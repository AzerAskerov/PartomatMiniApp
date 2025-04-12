// Profil səhifəsi modulu

const ProfilePage = {
    // Səhifə başlığı
    title: 'Profil',

    // Səhifəni göstər
    show: function() {
        console.log('Profil səhifəsi yüklənir...');
        
        // Başlığı yenilə (optional, if you want page-specific titles)
        // const appNameElement = document.querySelector('.app-name');
        // if (appNameElement) appNameElement.textContent = this.title;

        // Back düyməsini göstər
        if (typeof TelegramService !== 'undefined') {
            TelegramService.showBackButton();
            TelegramService.hideMainButton(); // Hide main button on profile page
        }

        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        // Məzmunu hazırla və göstər
        mainContent.innerHTML = this.render();

        // Event listenerləri əlavə et (əgər varsa)
        this.setupEventListeners();
    },

    // HTML hazırla
    render: function() {
        // İstifadəçi məlumatlarını PartoMatApp state-dən al
        const user = PartoMatApp.state.user;

        if (!user) {
            return `<div class="loading-indicator">İstifadəçi məlumatları yüklənir...</div>`;
        }

        // Təhlükəsizlik üçün HTML-dən qaçınma (basic example)
        const escapeHTML = (str) => str ? str.replace(/[&<>'"/]/g, (match) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '/': '&#x2F;'
            };
            return map[match];
        }) : '';

        const firstName = escapeHTML(user.first_name);
        const lastName = escapeHTML(user.last_name);
        const username = user.username ? `@${escapeHTML(user.username)}` : '(yoxdur)';
        const userId = escapeHTML(String(user.id));
        const language = escapeHTML(user.language_code);
        const isPremium = user.is_premium ? 'Bəli' : 'Xeyr';

        return `
            <div class="profile-container" style="padding: 16px;">
                <h1 class="section-title">Profil Məlumatları</h1>
                
                <div class="card">
                    <div class="profile-info-item">
                        <span class="info-label">Ad:</span>
                        <span class="info-value">${firstName} ${lastName}</span>
                    </div>
                    <div class="profile-info-item">
                        <span class="info-label">Username:</span>
                        <span class="info-value">${username}</span>
                    </div>
                    <div class="profile-info-item">
                        <span class="info-label">Telegram ID:</span>
                        <span class="info-value">${userId}</span>
                    </div>
                     <div class="profile-info-item">
                        <span class="info-label">Dil:</span>
                        <span class="info-value">${language}</span>
                    </div>
                     <div class="profile-info-item">
                        <span class="info-label">Premium:</span>
                        <span class="info-value">${isPremium}</span>
                    </div>
                </div>

                <h2 class="section-title" style="margin-top: 24px;">Tənzimləmələr</h2>
                <div class="card">
                   <p style="color: var(--tg-theme-hint-color);">Tezliklə burada tənzimləmələr olacaq (məsələn, avtomobil siyahısı, bildiriş tənzimləmələri).</p>
                   <button id="logoutBtn" class="button button-secondary" style="margin-top: 16px;">Çıxış (Simulyasiya)</button>
                </div>
            </div>
        `;
    },

    // Event listenerləri əlavə et
    setupEventListeners: function() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                 if (typeof TelegramService !== 'undefined') {
                    TelegramService.showConfirm('Tətbiqdən çıxmaq istədiyinizə əminsiniz? (Bu, yalnız demo çıxışıdır)', (confirmed) => {
                        if (confirmed) {
                             TelegramService.showAlert('Çıxış edildi (demo).');
                             // In a real app, you might clear local data or navigate to a logged-out state
                             // For now, just navigate home
                             PartoMatApp.navigateTo('home'); 
                        }
                    });
                 } else {
                     if(confirm('Çıxmaq istədiyinizə əminsiniz?')){
                        alert('Çıxış edildi (demo).');
                        // Navigate home in browser too
                         if(typeof PartoMatApp !== 'undefined') PartoMatApp.navigateTo('home'); 
                     }
                 }
            });
        }
        // Add other listeners for profile page actions here
    }
};
