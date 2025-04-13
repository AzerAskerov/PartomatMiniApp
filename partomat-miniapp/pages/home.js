// Ana səhifə modulu

const HomePage = {
    // Səhifə başlığı
    title: 'PartoMat',
    
    // Səhifənin vəziyyəti
    state: {
        hasVehicles: false,
        vehicles: [],
        currentVehicle: null,
        recentQueries: [],
        showVehicleDropdown: false,
        deletingVehicleId: null,
        isLoading: true,
        error: null
    },
    
    // Event listener referansları
    eventListeners: {
        addVehicle: null,
        changeVehicle: null,
        dropdownClick: null,
        clickOutside: null,
        newQuery: null,
        searchByPhoto: null,
        viewAllQueries: null,
        tempSeed: null
    },
    
    // Debug logging function
    debug: function(message, data = {}) {
        // Limit data logged in production if needed
        console.log(`[${new Date().toISOString()}] [HomePage] ${message}`, JSON.stringify(data));
    },
    
    // Səhifəni göstər
    show: async function() {
        this.debug('Ana səhifə yüklənir...');
        
        const appNameElement = document.querySelector('.app-name');
        if (appNameElement) appNameElement.textContent = this.title;
        
        if (typeof TelegramService !== 'undefined') {
            TelegramService.hideBackButton();
            TelegramService.hideMainButton();
        }
        
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error("Main content element not found!");
            return;
        }

        this.renderLoading(mainContent);
        this.state.isLoading = true;
        this.state.showVehicleDropdown = false; // Ensure dropdown is closed on load
        this.state.error = null;

        try {
            await this.loadData(); // Load vehicles
            await this.loadRecentQueries(); // Load queries
            this.state.isLoading = false;
            this.renderPage(mainContent);
            this.setupEventListeners(); 
        } catch (error) {
            console.error('Ana səhifə yüklənərkən xəta:', error);
            this.state.isLoading = false;
            this.state.error = error;
            this.renderError(mainContent, error);
        }
    },
    
    // Loading göstəricisini render et
    renderLoading: function(container) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Yüklənir...</p>
            </div>
        `;
    },
    
    // Xəta mesajını render et
    renderError: function(container, error) {
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3>Xəta baş verdi</h3>
                <p>${error?.message || 'Məlumatlar yüklənərkən xəta baş verdi'}</p>
                <button id="retryHomeBtn" class="button primary-button">Yenidən cəhd et</button>
                </div>
            `;
            
            const retryBtn = document.getElementById('retryHomeBtn');
            if(retryBtn) {
                 // Use arrow function to preserve 'this' context
                 retryBtn.addEventListener('click', () => this.show()); 
             }
    },
    
    // Səhifəni render et
    renderPage: function(container) {
        this.debug('Rendering page', { state: this.state });
        if (this.state.isLoading) {
            this.renderLoading(container);
            return;
        }

        if (this.state.error) {
             this.renderError(container, this.state.error);
             return;
        }
        
        let htmlContent = '';
        if (!this.state.hasVehicles) {
            htmlContent = this.renderNoVehicles();
        } else {
            // Render vehicle selector + search/queries
            htmlContent = this.renderWithVehicles(); 
        }
        
        container.innerHTML = htmlContent;
        this.debug('Page render complete');
    },
    
    // Məlumatları yüklə (Vehicles only)
    loadData: async function() {
        this.debug("Loading HomePage vehicle data...");
        this.state.vehicles = []; // Reset before loading
        this.state.currentVehicle = null;
        this.state.hasVehicles = false;
        
        try {
            const initData = TelegramService.getInitDataString(); // Use service
            if (!initData) {
                this.debug('Telegram initData not available, cannot load vehicles from backend.');
                // Optionally load mock data or show specific message
                // Using mock data for demonstration:
                this.state.vehicles = [
                     { id: 'V-MOCK1', make: 'MockBMW', model: 'X5', year: '2022', isDefault: true },
                     { id: 'V-MOCK2', make: 'MockMerc', model: 'E200', year: '2021', isDefault: false }
                 ];
                 this.state.hasVehicles = true;
                 this.state.currentVehicle = this.state.vehicles[0];
                // return; // Skip firebase call if using mock
                 throw new Error("Mock data loaded, Firebase call skipped"); // Throw to show error state in UI for demo
            }

            // Call Firebase function
            const getUserVehicles = firebase.functions().httpsCallable('getUserVehicles');
            this.debug('Calling getUserVehicles function...');
            const result = await getUserVehicles({ initData });
            this.debug('getUserVehicles result:', result.data);
            
            if (result.data && result.data.success && Array.isArray(result.data.vehicles)) {
                this.state.vehicles = result.data.vehicles;
                this.state.hasVehicles = this.state.vehicles.length > 0;
                
                if (this.state.hasVehicles) {
                    this.state.currentVehicle = this.state.vehicles.find(v => v.isDefault) || this.state.vehicles[0];
                    this.debug('Current vehicle set', { currentVehicle: this.state.currentVehicle });
                } else {
                    this.debug('No vehicles found for user.');
                }
            } else {
                throw new Error(result.data?.error || 'Failed to parse vehicles response');
            }
        } catch (error) {
            console.error('Error loading vehicle data:', error);
            // Don't set global error state here, let show() handle it
            // Keep isLoading true until show() handles the error rendering
            this.state.isLoading = false; // Set loading false even on error
            throw error; // Re-throw error for the show() function to catch
        }
    },
    
    // Son sorğuları yüklə
    loadRecentQueries: async function() {
        this.debug("Loading recent queries...");
        this.state.recentQueries = []; // Reset
        // --- START MOCKUP ---
        this.debug("Using mock data for recent queries.");
        this.state.recentQueries = [
            {
                id: 'Q-MOCK1',
                title: 'Mock BMW X5 2020 - Ön əyləc diski',
                createdAt: '12 Aprel 2025',
                status: 'active',
                responses: 2
            },
            {
                id: 'Q-MOCK2',
                title: 'Mock Mercedes E-Class 2019 - Hava filteri',
                createdAt: '10 Aprel 2025',
                status: 'completed',
                responses: 5
            }
        ];
        return; // Exit early to avoid Firebase call
        // --- END MOCKUP ---
        
        /* // Original Firebase call
        try {
            const initData = TelegramService.getInitDataString();
            if (!initData) {
                 this.debug('Cannot load recent queries without initData.');
                 return;
            }
            const getRecentQueries = firebase.functions().httpsCallable('getRecentQueries');
            this.debug('Calling getRecentQueries function...');
            const result = await getRecentQueries({ initData });
             this.debug('getRecentQueries result:', result.data);
            if (result.data && result.data.success && Array.isArray(result.data.queries)) {
                this.state.recentQueries = result.data.queries;
            } else {
                 this.debug('Failed to load or parse recent queries', { error: result.data?.error });
            }
        } catch (error) {
            console.error('Error loading recent queries:', error);
            // Don't throw here, just log and continue with empty queries
        }
        */
    },

    // Avtomobil olmadıqda render et
    renderNoVehicles: function() {
        // ... (renderNoVehicles remains the same) ...
        // Ensure button has ID: addVehicleBtn
         return `
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 6L19 9M18.5 14C18.5 14.5523 18.0523 15 17.5 15C16.9477 15 16.5 14.5523 16.5 14C16.5 13.4477 16.9477 13 17.5 13C18.0523 13 18.5 13.4477 18.5 14ZM7.5 14C7.5 14.5523 7.05228 15 6.5 15C5.94772 15 5.5 14.5523 5.5 14C5.5 13.4477 5.94772 13 6.5 13C7.05228 13 7.5 13.4477 7.5 14ZM5 18H19M8 18V20M16 18V20M9 4H15C16.0544 4 16.5816 4 17.0307 4.21799C17.479 4.40973 17.8435 4.7478 18.0701 5.15901C18.2967 5.57022 18.3428 6.06001 18.435 7.03956L18.7685 10.5632C18.8039 10.9147 18.8215 11.0905 18.7885 11.2514C18.693 11.6571 18.4215 11.9907 18.0463 12.1605C17.8939 12.236 17.7135 12.2518 17.3528 12.2835C16.6665 12.3473 16.3234 12.3792 16.0382 12.4879C15.263 12.7712 14.6114 13.3018 14.1717 14.0016C13.9929 14.2898 13.8663 14.6445 13.6131 15.3538L13.5 15.6667C13.221 16.4957 13.0815 16.9102 12.8335 17.1948C12.648 17.4034 12.4216 17.5712 12.1688 17.6873C11.8273 17.8421 11.4371 17.8421 10.6569 17.8421H9.34315C8.56287 17.8421 8.17273 17.8421 7.83116 17.6873C7.57841 17.5712 7.35202 17.4034 7.16651 17.1948C6.91855 16.9102 6.77902 16.4957 6.5 15.6667L6.38688 15.3538C6.13371 14.6445 6.00713 14.2898 5.82833 14.0016C5.3886 13.3018 4.73698 12.7712 3.96181 12.4879C3.67658 12.3792 3.33346 12.3473 2.64723 12.2835C2.28649 12.2518 2.10612 12.236 1.95372 12.1605C1.57852 11.9907 1.30698 11.6571 1.21148 11.2514C1.17848 11.0905 1.19615 10.9147 1.23148 10.5632L1.56504 7.03956C1.65721 6.06001 1.7033 5.57022 1.92991 5.15901C2.15651 4.7478 2.52095 4.40973 2.96931 4.21799C3.41839 4 3.94563 4 5 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h2 class="empty-title">Avtomobil əlavə edin</h2>
                    <p class="empty-description">Daha dəqiq axtarış nəticələri əldə etmək üçün avtomobilinizi əlavə edin</p>
                    <button id="addVehicleBtn" class="button primary-button" style="margin-top: 16px;">
                        <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Avtomobil əlavə et
                    </button>
                </div>
            </div>
            
            ${this.renderSearchAndQueries()} // Show search even if no vehicles
        `;
    },

    // Avtomobil olduqda render et (New Version)
    renderWithVehicles: function() {
        const vehicle = this.state.currentVehicle;
        if (!vehicle) {
            this.debug('RenderWithVehicles called but currentVehicle is null', { state: this.state });
            // Maybe fallback to renderNoVehicles or show an error/different state?
            // For now, render the search part only
            return this.renderSearchAndQueries();
        } 

        const dropdownVisible = this.state.showVehicleDropdown;
        this.debug('Rendering vehicle selector', { vehicle, dropdownVisible });

        // Use text-safe function for display
        const safeText = (text) => text ? String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
        const vehicleName = `${safeText(vehicle.make)} ${safeText(vehicle.model)} (${safeText(vehicle.year)})`;

        return `
            <div class="card">
                <div class="vehicle-selector ${dropdownVisible ? 'open' : ''}">
                    <button class="vehicle-selector-button" id="changeVehicleBtn" type="button" aria-haspopup="true" aria-expanded="${dropdownVisible}">
                        <div class="vehicle-info">
                            <svg class="vehicle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 6L19 9M18.5 14C18.5 14.5523 18.0523 15 17.5 15C16.9477 15 16.5 14.5523 16.5 14C16.5 13.4477 16.9477 13 17.5 13C18.0523 13 18.5 13.4477 18.5 14ZM7.5 14C7.5 14.5523 7.05228 15 6.5 15C5.94772 15 5.5 14.5523 5.5 14C5.5 13.4477 5.94772 13 6.5 13C7.05228 13 7.5 13.4477 7.5 14ZM5 18H19M8 18V20M16 18V20M9 4H15C16.0544 4 16.5816 4 17.0307 4.21799C17.479 4.40973 17.8435 4.7478 18.0701 5.15901C18.2967 5.57022 18.3428 6.06001 18.435 7.03956L18.7685 10.5632C18.8039 10.9147 18.8215 11.0905 18.7885 11.2514C18.693 11.6571 18.4215 11.9907 18.0463 12.1605C17.8939 12.236 17.7135 12.2518 17.3528 12.2835C16.6665 12.3473 16.3234 12.3792 16.0382 12.4879C15.263 12.7712 14.6114 13.3018 14.1717 14.0016C13.9929 14.2898 13.8663 14.6445 13.6131 15.3538L13.5 15.6667C13.221 16.4957 13.0815 16.9102 12.8335 17.1948C12.648 17.4034 12.4216 17.5712 12.1688 17.6873C11.8273 17.8421 11.4371 17.8421 10.6569 17.8421H9.34315C8.56287 17.8421 8.17273 17.8421 7.83116 17.6873C7.57841 17.5712 7.35202 17.4034 7.16651 17.1948C6.91855 16.9102 6.77902 16.4957 6.5 15.6667L6.38688 15.3538C6.13371 14.6445 6.00713 14.2898 5.82833 14.0016C5.3886 13.3018 4.73698 12.7712 3.96181 12.4879C3.67658 12.3792 3.33346 12.3473 2.64723 12.2835C2.28649 12.2518 2.10612 12.236 1.95372 12.1605C1.57852 11.9907 1.30698 11.6571 1.21148 11.2514C1.17848 11.0905 1.19615 10.9147 1.23148 10.5632L1.56504 7.03956C1.65721 6.06001 1.7033 5.57022 1.92991 5.15901C2.15651 4.7478 2.52095 4.40973 2.96931 4.21799C3.41839 4 3.94563 4 5 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div class="vehicle-details">
                                <p class="vehicle-label">Seçilmiş avtomobil</p>
                                <p class="vehicle-name">${vehicleName}</p>
                            </div>
                        </div>
                        <div class="vehicle-selector-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </button>
                    
                    ${this.renderVehicleDropdownMenu()} 

                </div>
            </div>
            
            ${this.renderSearchAndQueries()} 
        `;
    },
    
    // Added function to render Search/Queries sections
    renderSearchAndQueries: function() {
        // Make sure IDs (newQueryBtn, searchByPhotoBtn, viewAllQueriesBtn) are correct
        return `
            <div class="search-container">
                 <div class="search-bar">
                    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <input type="text" class="search-input" placeholder="Avtomobil hissəsi axtar...">
                 </div>
                <div class="quick-actions">
                    <button id="newQueryBtn" class="action-button action-primary">
                         <div class="action-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="action-text">
                            <span class="action-title">Yeni sorğu</span>
                            <span class="action-subtitle">Hissə axtar</span>
                        </div>
                    </button>
                    
                    <button id="searchByPhotoBtn" class="action-button action-secondary">
                         <div class="action-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9C3 7.89543 3.89543 7 5 7H5.92963C6.59834 7 7.2228 6.6658 7.59373 6.1094L8.40627 4.8906C8.7772 4.3342 9.40166 4 10.0704 4H13.9296C14.5983 4 15.2228 4.3342 15.5937 4.8906L16.4063 6.1094C16.7772 6.6658 17.4017 7 18.0704 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="action-text">
                            <span class="action-title">Şəkillə axtar</span>
                            <span class="action-subtitle">Şəkil yüklə</span>
                        </div>
                    </button>
                </div>
            </div>
            
            <div class="recent-queries">
                <div class="section-header">
                    <h2 class="section-title">Son sorğularınız</h2>
                    ${this.state.recentQueries.length > 0 ? `
                        <button id="viewAllQueriesBtn" class="view-all-button" type="button">
                            <span>Hamısı</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                
                ${this.renderRecentQueries()}
            </div>
        `;
    },
    
    // Added helper function
    updateState: function(newState) {
        const oldState = { ...this.state }; 
        this.state = { ...this.state, ...newState };
        this.debug('State updated', { /* oldState: oldState, */ currentState: this.state });

        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            this.renderPage(mainContent);
            this.setupEventListeners(); 
        } else {
            console.error("Cannot re-render, mainContent not found.");
        }
    },
    
    // Modified function
    renderVehicleDropdownMenu: function() {
        if (!this.state.showVehicleDropdown) return ''; 
        this.debug('Rendering vehicle dropdown menu', { vehicles: this.state.vehicles, deleting: this.state.deletingVehicleId });
        
        const safeText = (text) => text ? String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
        
        return `
            <div class="vehicle-dropdown-menu">
                <div class="vehicles-list">
                    ${this.state.vehicles.map(v => {
                        const vName = `${safeText(v.make)} ${safeText(v.model)} (${safeText(v.year)})`;
                        const isDeleting = this.state.deletingVehicleId === v.id; // Check if this item is deleting

                        // Conditionally render actions or spinner
                        const actionsHTML = isDeleting ? `
                            <div class="vehicle-item-actions loading">
                                <div class="small-spinner"></div> 
                            </div>
                        ` : `
                            <div class="vehicle-item-actions">
                                 <button class="icon-button edit-vehicle-dropdown-btn" title="Redaktə et" data-vehicle-id="${safeText(v.id)}" type="button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg> 
                                 </button>
                                 <button class="icon-button delete-vehicle-dropdown-btn" title="Sil" data-vehicle-id="${safeText(v.id)}" type="button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>
                                 </button>
                             </div>
                        `;

                        return `
                        <div class="vehicle-dropdown-item ${v.id === this.state.currentVehicle?.id ? 'selected' : ''} ${isDeleting ? 'is-deleting' : ''}" 
                             data-vehicle-id="${safeText(v.id)}">
                            <div class="vehicle-item-info">
                                <span>${vName}</span>
                                ${v.isDefault ? '<span class="default-badge-small">Əsas</span>' : ''}
                            </div>
                            ${actionsHTML} 
                        </div>
                    `;
                    }).join('')}
                </div>
                <button id="addNewVehicleDropdownBtn" class="button add-new-vehicle-dropdown-btn" type="button" ${this.state.deletingVehicleId ? 'disabled' : ''}>
                    <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Yeni avtomobil əlavə et
                </button>
            </div>
        `;
    },
    
    // Son sorğuları render et
    renderRecentQueries: function() {
        if (!this.state.recentQueries || this.state.recentQueries.length === 0) {
            return `<div class="empty-state-small">Hələ heç bir sorğunuz yoxdur</div>`;
        }
        
         const safeText = (text) => text ? String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
        
        return `
            <div class="queries-list">
                ${this.state.recentQueries.map(query => {
                    const statusText = query.status === 'active' ? 'Aktiv' : query.status === 'completed' ? 'Tamamlanıb' : 'Bilinmir';
                    return `
                    <div class="query-item" data-query-id="${safeText(query.id)}">
                        <div class="query-info">
                            <h3>${safeText(query.title)}</h3>
                            <p>${safeText(query.createdAt)}</p>
                        </div>
                        <div class="query-status">
                            <span class="status-badge ${safeText(query.status)}">${statusText}</span>
                            <span class="responses-count">${query.responses || 0} cavab</span>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    },
    
    // Event listenerləri əlavə et (New Version)
    setupEventListeners: function() {
        this.debug('Setting up event listeners');
        this.cleanupEventListeners();
        
        const addVehicleBtn = document.getElementById('addVehicleBtn'); // For empty state
        if (addVehicleBtn) {
            this.debug('Attaching listener for addVehicleBtn');
            this.eventListeners.addVehicle = () => PartoMatApp.navigateTo('add-vehicle');
            addVehicleBtn.addEventListener('click', this.eventListeners.addVehicle);
        }

        // --- Vehicle Selector Dropdown --- 
        const changeVehicleBtn = document.getElementById('changeVehicleBtn'); 
        if (changeVehicleBtn) {
             this.debug('Attaching listener for changeVehicleBtn');
             this.eventListeners.changeVehicle = (e) => {
                 e.stopPropagation(); 
                 this.toggleVehicleDropdown();
             };
             changeVehicleBtn.addEventListener('click', this.eventListeners.changeVehicle);
        }

        const dropdownMenu = document.querySelector('.vehicle-dropdown-menu');
        if (dropdownMenu) {
             this.debug('Attaching listener for dropdownMenu clicks');
             this.eventListeners.dropdownClick = (e) => {
                this.debug('Dropdown click event', { target: e.target });
                const target = e.target;
                const vehicleItem = target.closest('.vehicle-dropdown-item');
                const editBtn = target.closest('.edit-vehicle-dropdown-btn');
                const deleteBtn = target.closest('.delete-vehicle-dropdown-btn');
                const addNewBtn = target.closest('#addNewVehicleDropdownBtn');

                if (addNewBtn) {
                    this.debug('Add New button clicked inside dropdown');
                    this.addNewVehicle();
                } else if (editBtn) {
                     const vehicleId = editBtn.dataset.vehicleId;
                     this.debug('Edit button clicked inside dropdown', { vehicleId });
                     this.editVehicle(vehicleId);
                 } else if (deleteBtn) {
                     const vehicleId = deleteBtn.dataset.vehicleId;
                     this.debug('Delete button clicked inside dropdown', { vehicleId });
                     this.confirmDeleteVehicle(vehicleId);
                 } else if (vehicleItem) {
                     const vehicleId = vehicleItem.dataset.vehicleId;
                     this.debug('Vehicle item clicked inside dropdown', { vehicleId });
                     this.selectVehicle(vehicleId);
                 } else {
                     this.debug('Click inside dropdown menu, but not on a specific action');
                 }
             };
             dropdownMenu.addEventListener('click', this.eventListeners.dropdownClick);
        }
        
        // Click outside listener (only add if dropdown is open)
        if(this.state.showVehicleDropdown) {
             this.debug('Attaching click outside listener');
             this.eventListeners.clickOutside = (e) => {
                // Check if the click is outside the .vehicle-selector element
                if (!e.target.closest('.vehicle-selector.open')) {
                    this.debug('Clicked outside vehicle selector, closing dropdown');
                    this.toggleVehicleDropdown(false); // Force close
                } else {
                     this.debug('Clicked inside vehicle selector');
                }
             };
             // Use setTimeout to allow the current event loop to finish before attaching
             setTimeout(() => {
                 // Ensure listener isn't added multiple times if re-rendered quickly
                 document.removeEventListener('click', this.eventListeners.clickOutside);
                 document.addEventListener('click', this.eventListeners.clickOutside, { once: true });
             }, 0); 
        }

        // --- Other Action Buttons --- 
        const newQueryBtn = document.getElementById('newQueryBtn');
        if (newQueryBtn) {
            this.debug('Attaching listener for newQueryBtn');
            this.eventListeners.newQuery = () => {
                // TODO: Check if currentVehicle exists before navigating?
                if (!this.state.currentVehicle) {
                    TelegramService.showAlert('Zəhmət olmasa, əvvəlcə avtomobil seçin və ya əlavə edin.');
                    return;
                }
                PartoMatApp.navigateTo('query', { vehicleId: this.state.currentVehicle.id });
            };
            newQueryBtn.addEventListener('click', this.eventListeners.newQuery);
        }

        const searchByPhotoBtn = document.getElementById('searchByPhotoBtn');
        if (searchByPhotoBtn) {
            this.debug('Attaching listener for searchByPhotoBtn');
            this.eventListeners.searchByPhoto = () => {
                 if (!this.state.currentVehicle) {
                    TelegramService.showAlert('Zəhmət olmasa, əvvəlcə avtomobil seçin və ya əlavə edin.');
                    return;
                 }
                 PartoMatApp.navigateTo('search', { mode: 'photo', vehicleId: this.state.currentVehicle.id });
            };
            searchByPhotoBtn.addEventListener('click', this.eventListeners.searchByPhoto);
        }

        const viewAllQueriesBtn = document.getElementById('viewAllQueriesBtn');
        if (viewAllQueriesBtn) {
             this.debug('Attaching listener for viewAllQueriesBtn');
            this.eventListeners.viewAllQueries = () => {
                PartoMatApp.navigateTo('history'); // Navigate to history page
            };
            viewAllQueriesBtn.addEventListener('click', this.eventListeners.viewAllQueries);
        }
        
        this.debug('Event listeners setup complete');
    },
    
    // Added helper functions for dropdown
    toggleVehicleDropdown: function(forceState = null) {
        const newState = forceState !== null ? forceState : !this.state.showVehicleDropdown;
        // Check if state actually needs changing
        if (newState !== this.state.showVehicleDropdown) {
             this.debug(`Toggling vehicle dropdown -> ${newState ? 'open' : 'closed'}`);
             this.state.showVehicleDropdown = newState;
             
             // Efficiently update only the dropdown class and render menu if needed
             const selectorElement = document.querySelector('.vehicle-selector');
             if (selectorElement) {
                  selectorElement.classList.toggle('open', newState);
                  // Re-render just the menu part inside the selector
                  const menuContainer = selectorElement.querySelector('.vehicle-dropdown-menu');
                  if (menuContainer) menuContainer.remove(); // Remove old menu if exists
                  
                  if (newState) {
                       const menuHTML = this.renderVehicleDropdownMenu();
                       // Insert the new menu HTML
                       selectorElement.insertAdjacentHTML('beforeend', menuHTML);
                       // Re-attach listeners specific to the menu and outside click
                       this.setupEventListeners(); 
                  } else {
                     // If closing, ensure click outside listener is removed
                     if (this.eventListeners.clickOutside) {
                          document.removeEventListener('click', this.eventListeners.clickOutside);
                          this.eventListeners.clickOutside = null;
                     }
                  }
             } else {
                  this.debug('Vehicle selector element not found for toggle update');
                  // Fallback to full re-render if specific update fails
                  this.renderPage(document.getElementById('mainContent'));
                  this.setupEventListeners();
             }
        } else {
             this.debug('Toggle called but state already matches', { newState });
        }
    },

    selectVehicle: function(vehicleId) {
        this.debug(`Selecting vehicle: ${vehicleId}`);
        const selectedVehicle = this.state.vehicles.find(v => v.id === vehicleId);
        
        // Check if selection actually changes
        if (selectedVehicle && (!this.state.currentVehicle || selectedVehicle.id !== this.state.currentVehicle.id)) {
            this.state.currentVehicle = selectedVehicle;
            this.state.showVehicleDropdown = false; // Close dropdown
            
            // TODO: Save preference? Maybe update the default vehicle in backend?
            // For now, just update UI
            
            this.debug('Vehicle selection changed, re-rendering page');
            this.renderPage(document.getElementById('mainContent')); // Full re-render to update display and potentially recent queries
            this.setupEventListeners();
        } else if (!selectedVehicle) {
            this.debug('Selected vehicle ID not found in state', { vehicleId });
            this.toggleVehicleDropdown(false); // Close dropdown
        } else {
            this.debug('Selected vehicle is already the current one');
            this.toggleVehicleDropdown(false); // Still close dropdown
        }
    },

    addNewVehicle: function() {
        this.debug('Add new vehicle action triggered');
        this.state.showVehicleDropdown = false; // Ensure dropdown is visually closed state-wise
        PartoMatApp.navigateTo('add-vehicle');
    },

    editVehicle: function(vehicleId) {
         this.debug('Edit vehicle action triggered', { vehicleId });
         if (!vehicleId) return;
         this.state.showVehicleDropdown = false; 
         PartoMatApp.navigateTo('add-vehicle', { vehicleId: vehicleId });
    },

    confirmDeleteVehicle: function(vehicleId) {
         this.debug('Confirm delete vehicle action triggered', { vehicleId });
         if (!vehicleId) return;
         const vehicle = this.state.vehicles.find(v => v.id === vehicleId);
         if (!vehicle) {
              this.debug('Vehicle not found for deletion', { vehicleId });
              return;
         }
         
         this.state.showVehicleDropdown = false; // Close dropdown first
         const safeText = (text) => text ? String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
         const vName = `${safeText(vehicle.make)} ${safeText(vehicle.model)} (${safeText(vehicle.year)})`;
         
         TelegramService.showConfirm(
            `"${vName}" avtomobilini silməyə əminsiniz?`, 
            (confirmed) => {
                if (confirmed) {
                    this.deleteVehicle(vehicleId);
                } else {
                    this.debug('Vehicle deletion cancelled by user');
                }
            }
         );
    },

    deleteVehicle: async function(vehicleId) {
        this.debug('Attempting to delete vehicle', { vehicleId });
        
        // --- SET LOADING STATE ---
        this.updateState({ deletingVehicleId: vehicleId }); 
        
        // Hide any Telegram progress bar if shown previously
        TelegramService.hideMainButtonProgress && TelegramService.hideMainButtonProgress(); 

        try {
             const initData = TelegramService.getInitDataString();
             if (!initData) {
                  throw new Error("Authentication data not available.");
             }
             if (!firebase || !firebase.functions) {
                  throw new Error("Firebase Functions not initialized.");
             }
             
            const deleteVehicleFunc = firebase.functions().httpsCallable('deleteVehicle'); 
            const result = await deleteVehicleFunc({ vehicleId: vehicleId, initData: initData });
            this.debug('deleteVehicle function result:', result.data);
            
            if (result.data && result.data.success) {
                 TelegramService.showAlert('Avtomobil uğurla silindi.');
                 // Refresh the home page data fully (will reset deleting state via show())
                 await this.show(); 
                 // Return early as show() handles final state
                 return; 
            } else {
                 throw new Error(result.data?.error || 'Avtomobili silmək mümkün olmadı.');
            }
        } catch (error) {
            console.error("Error deleting vehicle:", error);
            TelegramService.showAlert(`Xəta baş verdi: ${error.message}`);
            // --- RESET LOADING STATE ON ERROR ---
            this.updateState({ deletingVehicleId: null }); 
        } 
    },
    
    // Event listenerləri təmizlə (New Version)
    cleanupEventListeners: function() {
        this.debug('Cleaning up event listeners');
        
        // Helper to remove listener
        const removeListener = (elementId, event, listenerRef, selector = null) => {
            const element = selector ? document.querySelector(selector) : document.getElementById(elementId);
            if (element && listenerRef) {
                element.removeEventListener(event, listenerRef);
                this.debug('Removed listener', { elementId, event, selector });
            } else if (listenerRef && elementId === 'document') {
                 document.removeEventListener(event, listenerRef);
                 this.debug('Removed document listener', { event });
            }
        };

        removeListener('addVehicleBtn', 'click', this.eventListeners.addVehicle);
        removeListener('changeVehicleBtn', 'click', this.eventListeners.changeVehicle);
        removeListener(null, 'click', this.eventListeners.dropdownClick, '.vehicle-dropdown-menu');
        removeListener('document', 'click', this.eventListeners.clickOutside);
        removeListener('newQueryBtn', 'click', this.eventListeners.newQuery);
        removeListener('searchByPhotoBtn', 'click', this.eventListeners.searchByPhoto);
        removeListener('viewAllQueriesBtn', 'click', this.eventListeners.viewAllQueries);
        removeListener('tempSeedDataBtn', 'click', this.eventListeners.tempSeed); // <-- Add cleanup for temp button if exists
        
        // Clear all refs
        Object.keys(this.eventListeners).forEach(key => {
            this.eventListeners[key] = null;
        });
        this.debug('Event listeners cleanup complete');
    }
};
