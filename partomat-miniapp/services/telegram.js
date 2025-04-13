// Telegram WebApp inteqrasiya servisi

const TelegramService = {
    // Telegram WebApp obyekti
    tg: window.Telegram.WebApp,
    
    // Servisi inizialisasiya et
    initialize: function() {
        // Check if running inside Telegram
        if (!this.tg || !this.tg.initData) {
            console.warn('Telegram WebApp SDK not available or not initialized. Service methods might not work.');
            return; 
        }

        console.log('Telegram WebApp servisi başladılır...');
        
        // WebApp-ı tam ekrana genişləndir
        this.tg.expand();
        
        // Bağlama təsdiqini aktivləşdir
        this.tg.enableClosingConfirmation();
        
        // Telegram temasını tətbiq et
        this.applyTelegramTheme();
        
        // BackButton hadisəsini qeydə al
        this.tg.BackButton.onClick(() => {
            console.log('Geri düyməsinə basıldı');
            // Ana səhifədəyiksə, geri düyməsini gizlət
            if (PartoMatApp && PartoMatApp.state.currentPage === 'home') {
                this.tg.BackButton.hide();
            } else if (PartoMatApp) {
                // Ana səhifəyə qayıt (assuming PartoMatApp is globally available)
                PartoMatApp.navigateTo('home');
            } else {
                 console.warn('PartoMatApp not found, cannot navigate back.');
                 this.tg.BackButton.hide(); // Hide if cannot navigate
            }
        });
    },
    
    // Telegram temasını CSS dəyişənlərində tətbiq et
    applyTelegramTheme: function() {
        if (!this.tg || !this.tg.themeParams) return;

        const root = document.documentElement;
        
        // Telegramın standart rəng parametrlərini CSS dəyişənlərinə tətbiq et
        root.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || '#ffffff');
        root.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || '#222222');
        root.style.setProperty('--tg-theme-hint-color', this.tg.themeParams.hint_color || '#999999');
        root.style.setProperty('--tg-theme-link-color', this.tg.themeParams.link_color || '#2563eb');
        root.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color || '#2563eb');
        root.style.setProperty('--tg-theme-button-text-color', this.tg.themeParams.button_text_color || '#ffffff');
            
        // Əlavə UI elementləri üçün rəngləri hesabla
        const bgColor = this.tg.themeParams.bg_color || '#ffffff';
        const isLightTheme = this.isLightColor(bgColor);
            
        // Arka fon rəngi açıq/qaranlıq temanı təyin et
        if (isLightTheme) {
            root.style.setProperty('--tg-theme-secondary-bg-color', '#f9fafb'); // Light theme secondary bg
            root.style.setProperty('--tg-theme-divider-color', '#e5e7eb'); // Light divider
        } else {
            root.style.setProperty('--tg-theme-secondary-bg-color', '#1f2937'); // Dark theme secondary bg
            root.style.setProperty('--tg-theme-divider-color', '#374151'); // Dark divider
        }
        
        // Set header color based on theme
        try {
             this.tg.setHeaderColor(isLightTheme ? '#ffffff' : '#1f2937');
        } catch (e) {
            console.warn('Failed to set header color:', e);
        }
    },
    
    // Rəngin açıq və ya qaranlıq olduğunu təyin et
    isLightColor: function(hexColor) {
        if (!hexColor || typeof hexColor !== 'string') return true; // Default to light if color is invalid
        
        // Hex rəngi RGB komponentlərinə çevir
        let r, g, b;
        try {
            if (hexColor.startsWith('#')) {
                const hex = hexColor.substring(1);
                if (hex.length === 3) {
                    r = parseInt(hex[0] + hex[0], 16);
                    g = parseInt(hex[1] + hex[1], 16);
                    b = parseInt(hex[2] + hex[2], 16);
                } else if (hex.length === 6) {
                    r = parseInt(hex.substring(0, 2), 16);
                    g = parseInt(hex.substring(2, 4), 16);
                    b = parseInt(hex.substring(4, 6), 16);
                } else {
                    throw new Error('Invalid hex color format');
                }
            } else {
                 throw new Error('Invalid hex color format');
            }
        } catch (e) {
            console.warn("Error parsing color:", hexColor, e);
            r = g = b = 255; // Default to white on error
        }
        
        // Nisbi parlaqlığı hesabla (YIQ formula)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128; // 128-dən yuxarı açıq, aşağı qaranlıq
    },
    
    // İstifadəçi məlumatlarını əldə et
    getUserData: function() {
        // Əgər initData varsa, istifadəçi məlumatlarını əldə et
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            return this.tg.initDataUnsafe.user;
        }
        
        // İstifadəçi məlumatları yoxdursa, test istifadəçisi qaytar (yalnız debug üçün)
        console.warn('Returning mock user data. Telegram initData not found.');
        return {
            id: 'test_user',
            first_name: 'Test',
            last_name: 'İstifadəçi',
            username: 'test_user',
            language_code: 'az',
            is_premium: false
        };
    },
    
    // Get the raw initData string for backend validation
    getInitDataString: function() {
        if (this.tg) {
           return this.tg.initData || '';
        }
        return ''; // Return empty string if not in Telegram
    },
    
    // Xüsusi metod - Alert göstər
    showAlert: function(message) {
        if (this.tg) {
           this.tg.showAlert(message);
        } else {
            alert(message); // Fallback for browser
        }
    },
    
    // Xüsusi metod - Təsdiq mesajı göstər
    showConfirm: function(message, callback) {
        if (this.tg) {
            this.tg.showConfirm(message, callback);
        } else {
            // Simple browser fallback
            const result = confirm(message);
            if (callback) callback(result);
        }
    },
    
    // MainButton-u konfiqurasiya et və göstər
    showMainButton: function(text, onClick) {
        if (!this.tg || !this.tg.MainButton) return;
        
        this.tg.MainButton.setText(text);
        
        // Əvvəlki bütün event listenerləri təmizlə
        this.tg.MainButton.offClick(); // Ensure previous listeners are removed
        
        // Yeni click funksiyasını əlavə et
        if (onClick && typeof onClick === 'function') {
            this.tg.MainButton.onClick(onClick);
        }
        
        this.tg.MainButton.show();
    },
    
    // MainButton-u gizlət
    hideMainButton: function() {
        if (this.tg && this.tg.MainButton) {
           this.tg.MainButton.hide();
        }
    },
    
    // BackButton-u göstər
    showBackButton: function() {
         if (this.tg && this.tg.BackButton) {
            this.tg.BackButton.show();
         }
    },
    
    // BackButton-u gizlət
    hideBackButton: function() {
         if (this.tg && this.tg.BackButton) {
            this.tg.BackButton.hide();
         }
    },
    
    // Show loading progress on the main button
    showMainButtonProgress: function(leaveActive = false) {
        if (!this.tg || !this.tg.MainButton.isVisible) return;
        this.tg.MainButton.showProgress(!leaveActive); // Pass true to keep it non-clickable
        if (leaveActive) {
            this.tg.MainButton.enable();
        } else {
            this.tg.MainButton.disable();
        }
    },

    // Hide loading progress on the main button
    hideMainButtonProgress: function() {
        if (!this.tg || !this.tg.MainButton.isVisible) return;
        this.tg.MainButton.hideProgress();
        this.tg.MainButton.enable(); // Re-enable after progress
    },
    
    // HapticFeedback - dokunma vibrasiyası
    hapticImpact: function(style = 'medium') {
        // style: light, medium, heavy, rigid, soft
        if (this.tg && this.tg.HapticFeedback) {
           this.tg.HapticFeedback.impactOccurred(style || 'medium');
        }
    }
};
