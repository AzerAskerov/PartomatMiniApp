// Ana səhifə modulu

const HomePage = {
    // Səhifə başlığı
    title: 'PartoMat',
    
    // Səhifənin vəziyyəti
    state: {
        hasVehicles: false,
        vehicles: [],
        currentVehicle: null,
        recentQueries: []
    },
    
    // Səhifəni göstər
    show: async function() {
        console.log('Ana səhifə yüklənir...');
        
        // Başlığı yenilə (Ensure header exists)
        const appNameElement = document.querySelector('.app-name');
        if (appNameElement) appNameElement.textContent = this.title;
        
        // Back düyməsini gizlət (ana səhifədə back düyməsi olmur)
        if (typeof TelegramService !== 'undefined') {
            TelegramService.hideBackButton();
            // Main (əsas) düyməsini gizlət
            TelegramService.hideMainButton();
        }
        
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return; // Exit if main content area not found

        // Show loading indicator within main content if needed (optional)
        mainContent.innerHTML = '<div class="loading-indicator">Yüklənir...</div>'; 

        try {
            // Avtomobil və sorğu məlumatlarını yüklə
            await this.loadData();
            
            // Ana səhifə məzmununu hazırla və göstər
            mainContent.innerHTML = this.render();
            
            // Event listenerləri əlavə et
            this.setupEventListeners();
        } catch (error) {
            console.error('Ana səhifə yüklənərkən xəta:', error);
            // Xəta mesajı göstər
            mainContent.innerHTML = `
                <div class="error-container" style="padding: 20px; text-align: center;">
                    <p>Məlumatlar yüklənərkən xəta baş verdi. Yenidən cəhd edin.</p>
                    <button id="retryHomeBtn" class="button">Yenidən cəhd et</button>
                </div>
            `;
            
            // Yenidən cəhd düyməsinə listener əlavə et
            const retryBtn = document.getElementById('retryHomeBtn');
            if(retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.show(); // Retry loading the home page
                });
            }
        }
    },
    
    // Məlumatları yüklə
    loadData: async function() {
        // Demo məqsədilə - əsl tətbiqdə Firebase-dən məlumatlar yüklənəcək
        console.log("Loading HomePage data...");
        return new Promise(resolve => {
            setTimeout(() => {
                // Demo məlumatları - Check localStorage
                try {
                    this.state.hasVehicles = localStorage.getItem('partomat_has_vehicles') === 'true';
                } catch (e) {
                    console.warn("Could not access localStorage for vehicles flag.");
                    this.state.hasVehicles = false;
                }
                
                if (this.state.hasVehicles) {
                    // Load vehicle from storage if exists, otherwise mock
                    try {
                         const storedVehicles = JSON.parse(localStorage.getItem('partomat_vehicles'));
                         if (storedVehicles && storedVehicles.length > 0) {
                             this.state.vehicles = storedVehicles;
                             // Find the default vehicle or take the first one
                             this.state.currentVehicle = this.state.vehicles.find(v => v.isDefault) || this.state.vehicles[0];
                         } else {
                             throw new Error("No vehicles found in storage despite flag being true.");
                         }
                    } catch (e) {
                         console.warn("Failed to load vehicles from localStorage, using mock data.", e);
                         // Fallback mock data if storage fails or is empty
                         this.state.vehicles = [
                            { id: 1, make: 'BMW', model: 'X5', year: 2020, isDefault: true }
                         ];
                         this.state.currentVehicle = this.state.vehicles[0];
                         // Optionally, update localStorage with mock data
                         try {
                             localStorage.setItem('partomat_vehicles', JSON.stringify(this.state.vehicles));
                         } catch (lsError) { console.warn("Could not save mock vehicles to localStorage."); }
                    }
                    
                    // Son sorğular (Mock data)
                    this.state.recentQueries = [
                        {
                            id: 'Q-2354',
                            title: 'BMW X5 2020 - Ön əyləc diski',
                            createdAt: '27 Mart 2025',
                            status: 'active',
                            responses: 4
                        },
                        {
                            id: 'Q-2350',
                            title: 'BMW X5 2020 - Arxa əyləc kolodkaları',
                            createdAt: '25 Mart 2025',
                            status: 'completed',
                            responses: 3
                        }
                    ];
                } else {
                    this.state.vehicles = [];
                    this.state.currentVehicle = null;
                    this.state.recentQueries = [];
                }
                console.log("HomePage data loaded:", this.state);
                resolve();
            }, 300);
        });
    },
    
    // HTML hazırla
    render: function() {
        if (this.state.hasVehicles && this.state.currentVehicle) {
            return this.renderWithVehicles();
        } else {
            return this.renderNoVehicles();
        }
    },
    
    // Avtomobil varsa ana səhifəni hazırla
    renderWithVehicles: function() {
        const vehicle = this.state.currentVehicle;
        if (!vehicle) return this.renderNoVehicles(); // Fallback if currentVehicle is somehow null

        return `
            <div class="card">
                <div class="vehicle-selector">
                    <div class="vehicle-info">
                        <svg class="vehicle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 6L19 9M18.5 14C18.5 14.5523 18.0523 15 17.5 15C16.9477 15 16.5 14.5523 16.5 14C16.5 13.4477 16.9477 13 17.5 13C18.0523 13 18.5 13.4477 18.5 14ZM7.5 14C7.5 14.5523 7.05228 15 6.5 15C5.94772 15 5.5 14.5523 5.5 14C5.5 13.4477 5.94772 13 6.5 13C7.05228 13 7.5 13.4477 7.5 14ZM5 18H19M8 18V20M16 18V20M9 4H15C16.0544 4 16.5816 4 17.0307 4.21799C17.479 4.40973 17.8435 4.7478 18.0701 5.15901C18.2967 5.57022 18.3428 6.06001 18.435 7.03956L18.7685 10.5632C18.8039 10.9147 18.8215 11.0905 18.7885 11.2514C18.693 11.6571 18.4215 11.9907 18.0463 12.1605C17.8939 12.236 17.7135 12.2518 17.3528 12.2835C16.6665 12.3473 16.3234 12.3792 16.0382 12.4879C15.263 12.7712 14.6114 13.3018 14.1717 14.0016C13.9929 14.2898 13.8663 14.6445 13.6131 15.3538L13.5 15.6667C13.221 16.4957 13.0815 16.9102 12.8335 17.1948C12.648 17.4034 12.4216 17.5712 12.1688 17.6873C11.8273 17.8421 11.4371 17.8421 10.6569 17.8421H9.34315C8.56287 17.8421 8.17273 17.8421 7.83116 17.6873C7.57841 17.5712 7.35202 17.4034 7.16651 17.1948C6.91855 16.9102 6.77902 16.4957 6.5 15.6667L6.38688 15.3538C6.13371 14.6445 6.00713 14.2898 5.82833 14.0016C5.3886 13.3018 4.73698 12.7712 3.96181 12.4879C3.67658 12.3792 3.33346 12.3473 2.64723 12.2835C2.28649 12.2518 2.10612 12.236 1.95372 12.1605C1.57852 11.9907 1.30698 11.6571 1.21148 11.2514C1.17848 11.0905 1.19615 10.9147 1.23148 10.5632L1.56504 7.03956C1.65721 6.06001 1.7033 5.57022 1.92991 5.15901C2.15651 4.7478 2.52095 4.40973 2.96931 4.21799C3.41839 4 3.94563 4 5 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div class="vehicle-details">
                            <p class="vehicle-label">Seçilmiş avtomobil</p>
                            <p class="vehicle-name">${vehicle.make} ${vehicle.model} ${vehicle.year}</p>
                        </div>
                    </div>
                    <button id="changeVehicleBtn" class="vehicle-selector-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            
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
                        <button id="viewAllQueriesBtn" class="view-all-button">
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
    
    // Avtomobil yoxdursa ana səhifəni hazırla
    renderNoVehicles: function() {
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
                    <button id="addVehicleBtn" class="button" style="margin-top: 16px;">
                        <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Avtomobil əlavə et
                    </button>
                </div>
            </div>
            
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
                </div>
                
                <div class="card">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h2 class="empty-title">Hələ sorğunuz yoxdur</h2>
                        <p class="empty-description">Avtomobil hissələri tapmaq üçün yuxarıdakı "Yeni sorğu" düyməsindən istifadə edin</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Son sorğuları göstər
    renderRecentQueries: function() {
        // Əgər son sorğular yoxdursa, boş vəziyyəti göstər
        if (!this.state.recentQueries || this.state.recentQueries.length === 0) {
            return `
                <div class="card">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h2 class="empty-title">Hələ sorğunuz yoxdur</h2>
                        <p class="empty-description">Avtomobil hissələri tapmaq üçün yuxarıdakı "Yeni sorğu" düyməsindən istifadə edin</p>
                    </div>
                </div>
            `;
        }
        
        // Sorğular varsa, onları siyahı şəklində göstər
        // Needs component CSS for .query-list, .query-card, etc.
        let queriesHTML = '<div class="query-list">';
        
        this.state.recentQueries.forEach(query => {
            queriesHTML += `
                <div class="query-card card" data-query-id="${query.id}" style="cursor: pointer; margin-bottom: 10px;">
                    <div class="query-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 class="query-title" style="font-size: 14px; font-weight: 500; margin-right: 8px;">${query.title}</h3>
                        <span class="badge ${query.status === 'active' ? 'badge-success' : 'badge-info'}">
                            ${query.status === 'active' ? 'Aktiv' : 'Tamamlandı'}
                        </span>
                    </div>
                    <div class="query-footer" style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--tg-theme-hint-color);">
                        <span class="query-date">${query.createdAt}</span>
                        <div class="query-responses" style="display: flex; align-items: center;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 4px;">
                                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>${query.responses} cavab</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        queriesHTML += '</div>';
        return queriesHTML;
    },
    
    // Event listenerləri əlavə et
    setupEventListeners: function() {
        // Avtomobil əlavə etmə düyməsi
        const addVehicleBtn = document.getElementById('addVehicleBtn');
        if (addVehicleBtn) {
            addVehicleBtn.addEventListener('click', () => {
                this.handleAddVehicle();
            });
        }
        
        // Avtomobil dəyişdirmə düyməsi
        const changeVehicleBtn = document.getElementById('changeVehicleBtn');
        if (changeVehicleBtn) {
            changeVehicleBtn.addEventListener('click', () => {
                this.handleChangeVehicle();
            });
        }
        
        // Yeni sorğu düyməsi
        const newQueryBtn = document.getElementById('newQueryBtn');
        if (newQueryBtn) {
            newQueryBtn.addEventListener('click', () => {
                this.handleNewQuery();
            });
        }
        
        // Şəkillə axtarış düyməsi
        const searchByPhotoBtn = document.getElementById('searchByPhotoBtn');
        if (searchByPhotoBtn) {
            searchByPhotoBtn.addEventListener('click', () => {
                if (typeof TelegramService !== 'undefined') {
                   TelegramService.showAlert('Şəkillə axtarış funksiyası tezliklə əlavə olunacaq!');
                } else {
                    alert('Şəkillə axtarış funksiyası tezliklə əlavə olunacaq!');
                }
            });
        }
        
        // Hamısını göstər düyməsi
        const viewAllQueriesBtn = document.getElementById('viewAllQueriesBtn');
        if (viewAllQueriesBtn) {
            viewAllQueriesBtn.addEventListener('click', () => {
                if (typeof PartoMatApp !== 'undefined') PartoMatApp.navigateTo('history');
            });
        }
        
        // Sorğu kartlarına klik hadisəsi
        const queryCards = document.querySelectorAll('.query-card');
        queryCards.forEach(card => {
            card.addEventListener('click', () => {
                const queryId = card.getAttribute('data-query-id');
                this.handleQueryDetails(queryId);
            });
        });
    },
    
    // Avtomobil əlavə etmə hadisəsini işlə
    handleAddVehicle: function() {
        // AddVehicle səhifəsinə yönləndir (Future implementation)
        // For now, show alert and mock add
        if (typeof TelegramService !== 'undefined') {
             TelegramService.showAlert('Avtomobil əlavə etmə səhifəsi tezliklə əlavə olunacaq! Demo avtomobil əlavə edildi.');
        } else {
             alert('Avtomobil əlavə etmə səhifəsi tezliklə əlavə olunacaq! Demo avtomobil əlavə edildi.');
        }
        
        // Demo üçün lokalda bir dəyər saxla
        try {
            localStorage.setItem('partomat_has_vehicles', 'true');
             const demoVehicle = [{ id: Date.now(), make: 'Demo', model: 'Car', year: 2023, isDefault: true }];
             localStorage.setItem('partomat_vehicles', JSON.stringify(demoVehicle));
        } catch (e) {
            console.warn("Could not save demo vehicle flag/data to localStorage.");
        }

        // Səhifəni yenilə
        this.show();
    },
    
    // Avtomobil dəyişdirmə hadisəsini işlə
    handleChangeVehicle: function() {
        // Əsl tətbiqdə bu avtomobil seçimi popup-ı açacaq
        // Future implementation: Show a modal or navigate to a selection page
         if (typeof TelegramService !== 'undefined') {
             TelegramService.showAlert('Avtomobil seçimi funksiyası tezliklə əlavə olunacaq!');
         } else {
             alert('Avtomobil seçimi funksiyası tezliklə əlavə olunacaq!');
         }
    },
    
    // Yeni sorğu yaratma hadisəsini işlə
    handleNewQuery: function() {
        // Əgər avtomobil yoxdursa, avtomobil əlavə etmək lazımdır
        if (!this.state.hasVehicles) {
             if (typeof TelegramService !== 'undefined') {
                 TelegramService.showAlert('Sorğu yaratmaq üçün əvvəlcə avtomobil əlavə etməlisiniz');
             } else {
                  alert('Sorğu yaratmaq üçün əvvəlcə avtomobil əlavə etməlisiniz');
             }
            // Optionally trigger the add vehicle flow directly
            // this.handleAddVehicle(); 
            return;
        }
        
        // NewQuery səhifəsinə yönləndir (Using PartoMatApp navigation)
        if (typeof PartoMatApp !== 'undefined') {
            PartoMatApp.navigateTo('query');
        } else {
            console.error("PartoMatApp is not defined, cannot navigate to query page.");
        }
    },
    
    // Sorğu detallarını göstərmə hadisəsini işlə
    handleQueryDetails: function(queryId) {
        // QueryDetails səhifəsinə yönləndir (Future implementation)
        // For now, just show an alert
        if (typeof TelegramService !== 'undefined') {
             TelegramService.showAlert(`Sorğu detalları (ID: ${queryId}) tezliklə əlavə olunacaq!`);
        } else {
             alert(`Sorğu detalları (ID: ${queryId}) tezliklə əlavə olunacaq!`);
        }
        // Future: PartoMatApp.navigateTo('queryDetails', { queryId: queryId });
    }
};
