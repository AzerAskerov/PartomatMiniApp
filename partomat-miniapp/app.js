// PartoMat Telegram miniApp - Əsas inisialisasiya faylı

// Tətbiq modulu
const PartoMatApp = {
    // Tətbiqin vəziyyəti
    state: {
        currentPage: 'home',
        user: null, // Holds Telegram user data (from initDataUnsafe)
        isRegistered: null, // null = unknown, false = no, true = yes
        isLoading: true,
        initData: '', // Store the raw initData string for backend calls
    },

    // Tətbiqi başlat
    init: async function() { // Make init async
        console.log('PartoMat miniApp başladılır...');
        this.state.isLoading = true;
        const loadingScreen = document.getElementById('loading');
        if (loadingScreen) loadingScreen.style.display = 'flex'; // Ensure loading is visible

        // Initialize services and get initial data
        if (typeof TelegramService !== 'undefined') {
            this.state.initData = TelegramService.getInitDataString(); // Get raw initData first
            this.state.user = TelegramService.getUserData(); // Get unsafe user data for immediate display needs
            if (TelegramService.tg) {
                 TelegramService.initialize(); // Initialize theme, buttons etc. only if in Telegram
            } else {
                 this.applyFallbackTheme(); // Apply fallback if not in Telegram
            }
        } else {
             console.error("TelegramService is not defined!");
             this.state.user = { id: 'browser_user', first_name: 'Browser', last_name: 'User' };
             this.applyFallbackTheme();
        }

        // Setup basic event listeners (like notifications) early
        this.setupCommonEventListeners(); 

        // Check registration status
        try {
            await this.checkUserRegistration(); // Wait for registration check
            this.state.isLoading = false;
            this.showApp(); // Show app (either registration prompt or main UI) after check completes
        } catch (error) {
             console.error('Tətbiq başlatma xətası (registration check): ', error);
             this.state.isLoading = false;
             // Hide loading, show specific error
             if (loadingScreen) loadingScreen.style.display = 'none';
             this.showErrorScreen('İstifadəçi statusu yoxlanılarkən xəta baş verdi. Zəhmət olmasa tətbiqi yenidən başladın.');
        }
    },

    // Check user registration status by calling backend
    checkUserRegistration: async function() {
        // Ensure Firebase Functions SDK is loaded
        if (typeof firebase === 'undefined' || typeof firebase.functions !== 'function') {
            console.error('Firebase Functions SDK not available.');
            this.state.isRegistered = false; // Assume not registered if SDK fails
            return;
        }
        
        // Use stored initData from state
        if (!this.state.initData) {
            console.warn("No initData found, cannot check registration. Assuming not registered for browser mode.");
            this.state.isRegistered = false; // Treat browser/no-initData as not registered
            return;
        }

        console.log("Checking user registration via Cloud Function...");
        try {
            const checkUserExistsCallable = firebase.functions().httpsCallable('checkUserExists');
            const result = await checkUserExistsCallable({ initData: this.state.initData });
            this.state.isRegistered = result.data.exists;
            console.log("User registered status from backend:", this.state.isRegistered);
        } catch (error) {
            console.error("Error calling checkUserExists function:", error);
            // Decide how to handle check failure - maybe treat as not registered or show error
            this.state.isRegistered = false; // Default to not registered on error
            throw new Error(`Backend check failed: ${error.message || 'Unknown error'}`); // Re-throw to be caught by init
        }
    },

    // Setup listeners that don't depend on registration status
    setupCommonEventListeners: function() {
         const notificationBtn = document.getElementById('notificationBtn');
         if (notificationBtn) {
             notificationBtn.addEventListener('click', () => {
                 const message = 'Bildiriş funksiyası tezliklə əlavə olunacaq';
                 if (typeof TelegramService !== 'undefined') {
                     TelegramService.showAlert(message);
                 } else {
                     alert(message);
                 }
             });
         }
         // Add any other early listeners here
    },

    // Setup listeners for the main app UI (nav, etc.)
    setupMainAppEventListeners: function() {
        console.log("Setting up main app event listeners...");
        document.querySelectorAll('.nav-item').forEach(item => {
            // Remove potential old listeners if this is called multiple times
            item.replaceWith(item.cloneNode(true)); 
        });
        // Re-add listeners
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
                if (typeof TelegramService !== 'undefined') TelegramService.hapticImpact('light');
            });
        });
        console.log("Main app event listeners set up.");
    },

    // Decide which UI to show based on registration status
    showApp: function() {
        const loadingScreen = document.getElementById('loading');
        if (loadingScreen) loadingScreen.style.display = 'none';

        if (this.state.isRegistered === false) {
            this.showRegistrationPrompt();
        } else if (this.state.isRegistered === true) {
            this.showMainInterface();
        } else {
            // This case should ideally be handled by the error catch in init()
            console.error("Registration status unknown when trying to show app.");
            this.showErrorScreen("İstifadəçi statusu təyin edilə bilmədi.");
        }
        console.log('showApp completed.');
    },

    // Show the main application interface (header, content, nav)
    showMainInterface: function() {
        console.log("Showing main interface...");
        const header = document.getElementById('header');
        if (header) header.style.display = 'block';
        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'block';
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.style.display = 'flex';

        // Set up navigation listeners only when main UI is shown
        this.setupMainAppEventListeners();

        // Load initial page (usually home)
        this.navigateTo(this.state.currentPage || 'home');
        if (this.state.currentPage === 'home' && typeof TelegramService !== 'undefined') {
            TelegramService.hideBackButton();
        }
    },

    // Show the registration prompt UI
    showRegistrationPrompt: function() {
        console.log("Showing registration prompt.");
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        // Ensure other parts are hidden
        const header = document.getElementById('header');
        if (header) header.style.display = 'none';
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.style.display = 'none';
        if (typeof TelegramService !== 'undefined') {
            TelegramService.hideBackButton();
            TelegramService.hideMainButton();
        }

        mainContent.style.display = 'block';
        mainContent.innerHTML = `
            <div class="registration-prompt" style="padding: 30px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh;">
                <div class="logo-circle" style="width: 60px; height: 60px; margin-bottom: 20px; background-color: var(--tg-theme-button-color, var(--primary));">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="var(--tg-theme-button-text-color, white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 10px; color: var(--tg-theme-text-color);">PartoMat'a Xoş Gəlmisiniz!</h1>
                <p style="color: var(--tg-theme-hint-color); margin-bottom: 25px; max-width: 300px;">
                    Sorğularınızı yadda saxlamaq və satıcılardan cavab almaq üçün qeydiyyatdan keçməyiniz xahiş olunur.
                </p>
                <button id="registerUserBtn" class="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; vertical-align: middle;">
                       <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.89543 15 2.87828 15.4214 2.12843 16.1716C1.37858 16.9217 1 17.9391 1 19V21M20 8V14M23 11H17M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span style="vertical-align: middle;">Qeydiyyatdan keç</span>
                </button>
                <p id="registerError" style="color: var(--error, #ef4444); margin-top: 15px; display: none; font-size: 14px;"></p>
            </div>
        `;

        // Add listener to the register button
        const registerBtn = document.getElementById('registerUserBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', async () => {
                const errorP = document.getElementById('registerError');
                if(errorP) errorP.style.display = 'none'; // Hide previous error
                registerBtn.disabled = true; // Prevent double clicks
                registerBtn.innerHTML = 'Qeydiyyat edilir...'; // Update button text

                try {
                     if (!this.state.initData) {
                          throw new Error("Authentication data not available.");
                     }
                     // Ensure Firebase Functions SDK is available
                     if (typeof firebase === 'undefined' || typeof firebase.functions !== 'function') {
                        throw new Error('Firebase Functions SDK not available for registration.');
                     }
                     const registerUserCallable = firebase.functions().httpsCallable('registerUser');
                     const result = await registerUserCallable({ initData: this.state.initData });

                     if (result.data.success) {
                        console.log("Registration successful on backend.");
                        this.state.isRegistered = true;
                        // Registration succeeded, show the main app interface immediately
                        this.showMainInterface(); 
                     } else {
                         throw new Error(result.data.message || "Qeydiyyat zamanı naməlum xəta.");
                     }
                } catch (error) {
                     console.error("Error calling registerUser function:", error);
                     if(errorP) {
                        errorP.textContent = `Qeydiyyat xətası: ${error.message || 'Bilinməyən server xətası'}`;
                        errorP.style.display = 'block';
                     }
                     registerBtn.disabled = false;
                     // Restore button text with SVG
                     registerBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; vertical-align: middle;">
                           <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.89543 15 2.87828 15.4214 2.12843 16.1716C1.37858 16.9217 1 17.9391 1 19V21M20 8V14M23 11H17M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span style="vertical-align: middle;">Qeydiyyatdan keç</span>
                     `;
                }
            });
        }
    },

    // Fallback theme application (if not in Telegram)
    applyFallbackTheme: function() {
         const root = document.documentElement;
         root.style.setProperty('--tg-theme-bg-color', '#ffffff');
         root.style.setProperty('--tg-theme-text-color', '#222222');
         root.style.setProperty('--tg-theme-hint-color', '#999999');
         root.style.setProperty('--tg-theme-link-color', '#2563eb');
         root.style.setProperty('--tg-theme-button-color', '#2563eb');
         root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
         root.style.setProperty('--tg-theme-secondary-bg-color', '#f9fafb');
         root.style.setProperty('--tg-theme-divider-color', '#e5e7eb');
         console.log("Applied fallback theme.")
    },

    // Xəta ekranını göstər
    showErrorScreen: function(errorMessage) {
        // ... (showErrorScreen implementation remains the same) ...
        const loadingScreen = document.getElementById('loading');
        if (loadingScreen) loadingScreen.style.display = 'none';
        
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.style.display = 'block';
            // Clear previous content
            mainContent.innerHTML = ''; 

            // Hide header and nav on error screen
            const header = document.getElementById('header');
            if (header) header.style.display = 'none';
            const bottomNav = document.getElementById('bottomNav');
            if (bottomNav) bottomNav.style.display = 'none';

            mainContent.innerHTML = `
                <div class="error-screen" style="padding: 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div class="error-icon" style="margin-bottom: 16px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h2 class="error-title" style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Xəta baş verdi</h2>
                    <p class="error-message" style="margin-bottom: 16px; color: var(--tg-theme-hint-color);">${errorMessage}</p>
                    <button onclick="window.location.reload()" class="button">Yenidən cəhd et</button>
                </div>
            `;
        }
    },

    // Səhifə naviqasiyası
    navigateTo: function(pageName) {
        // Block navigation if not registered, except for internal 'register' state if we had one
        if (this.state.isRegistered === false) {
             console.warn("Navigation blocked: User not registered.");
             this.showRegistrationPrompt(); // Ensure registration prompt is shown
             return;
        }

        console.log(`Navigating to: ${pageName}`);
        if (this.state.isLoading) {
            console.warn('Navigation attempted while still loading.');
            return; // Should not happen if init waits, but good safeguard
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        this.state.currentPage = pageName;
        
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error('Main content area not found!');
            return;
        }

        // Manage Telegram buttons
        if (typeof TelegramService !== 'undefined') {
            if (pageName === 'home') {
                TelegramService.hideBackButton();
            } else {
                TelegramService.showBackButton();
            }
            TelegramService.hideMainButton(); // Hide by default, show specifically where needed
        }

        // Load page content
        mainContent.innerHTML = ''; // Clear previous content
        try {
            switch(pageName) {
                case 'home':
                    if (typeof HomePage !== 'undefined') HomePage.show(); else throw new Error('HomePage missing');
                    break;
                case 'add-vehicle':
                    if (typeof AddVehiclePage !== 'undefined') AddVehiclePage.show(); else throw new Error('AddVehiclePage missing');
                    break;
                case 'history':
                    // Placeholder - Replace with HistoryPage.show() later
                    mainContent.innerHTML = `<div style="padding: 20px;"><h1>Tarixçə</h1><p>Keçmiş sorğularınız burada göstəriləcək.</p></div>`; 
                    break;
                case 'messages':
                    // Placeholder - Replace with MessagesPage.show() later
                    mainContent.innerHTML = `<div style="padding: 20px;"><h1>Mesajlar</h1><p>Satıcıların cavabları burada olacaq.</p></div>`;
                    break;
                case 'profile':
                    if (typeof ProfilePage !== 'undefined') ProfilePage.show(); else throw new Error('ProfilePage missing');
                    break;
                case 'query': 
                    // Placeholder - Replace with QueryPage.show() later
                    mainContent.innerHTML = `<div style="padding: 20px;"><h1>Yeni Sorğu</h1><p>Sorğu yaratma formu burada olacaq.</p></div>`;
                    if (typeof TelegramService !== 'undefined') {
                        TelegramService.showMainButton('Sorğunu Göndər', () => { 
                            TelegramService.showAlert('Sorğu göndərildi (demo)'); 
                        });
                    }
                    break;
                default:
                    throw new Error(`Bilinməyən səhifə: ${pageName}`);
            }
        } catch (error) {
             console.error("Error loading page content:", pageName, error);
             this.showErrorScreen(`Səhifə yüklənərkən xəta baş verdi: ${error.message}`);
        }
    }
};

// DOM hazır olduqda tətbiqi başlat
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase === 'undefined' || typeof firebase.initializeApp !== 'function') {
        console.error("Firebase SDK not loaded correctly!");
        document.body.innerHTML = '<div style="padding:20px; text-align:center; color:red;">Firebase yüklənərkən kritik xəta baş verdi. Tətbiq işləməyəcək.</div>';
        return;
    }
    // Check if config was initialized
    if (typeof firebaseApp === 'undefined' || typeof functions === 'undefined') {
         console.error("Firebase not initialized correctly (check config script)!");
         if (!document.body.innerHTML.includes('Firebase konfiqurasiya xətası')) {
             document.body.innerHTML = '<div style="padding:20px; text-align:center; color:red;">Firebase konfiqurasiya xətası. Tətbiq işləməyəcək.</div>';
         }
         return;
    }
    console.log("DOM loaded, starting app initialization...");
    PartoMatApp.init(); 
});

// Placeholder Page Objects (to be moved later)
// These are not strictly needed now as navigation directly injects HTML
// const HomePage = { show: () => { /* Render logic */ } };
// const HistoryPage = { show: () => { /* Render logic */ } };
// const MessagesPage = { show: () => { /* Render logic */ } };
// const ProfilePage = { show: () => { /* Render logic */ } };
// const QueryPage = { show: () => { /* Render logic */ } };
