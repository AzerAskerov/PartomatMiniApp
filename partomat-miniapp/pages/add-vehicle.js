// PartoMat Telegram miniApp - Avtomobil Əlavə Etmə Səhifəsi

const AddVehiclePage = {
    // Səhifə başlığı
    title: 'Avtomobil Əlavə Et',
    
    // Debug üçün log funksiyası
    debug: function(message, data = {}) {
        // Detailed logging
        console.log(`[${new Date().toISOString()}] [AddVehiclePage] ${message}`, JSON.stringify(data, null, 2));
    },
    
    // Səhifə vəziyyəti (State)
    state: {
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        passportPhoto: null, // base64 data URL or null
        showMakes: false,
        showModels: false,
        showYears: false,
        isDefault: false,
        errors: {}, // Format: { fieldName: errorMessage }
        isEditing: false,
        vehicleId: null, // ID of the vehicle being edited
        isLoading: false, // For loading state during async ops
    },
    
    // Event listener references
    eventListeners: {
        backButton: null,
        makeDropdown: null,
        modelDropdown: null,
        yearDropdown: null,
        dropdownItems: null,
        clickOutside: null,
        photoInput: null,
        removePhoto: null,
        defaultToggle: null,
        formSubmit: null,
        mainButtonClickHandler: null, // Store the main button handler
    },
    
    // --- Data (Makes, Models, Years) ---
    // In a real app, this might be fetched or be more extensive
    availableMakes: ['BMW', 'Mercedes', 'Audi', 'Toyota', 'Honda'],
    availableModels: {
        'BMW': ['X5', 'X3', '3 Series', '5 Series'],
        'Mercedes': ['C-Class', 'E-Class', 'S-Class', 'GLC'],
        'Audi': ['A4', 'A6', 'Q5', 'Q7'],
        'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander'],
        'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot']
    },
    availableYears: Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(String),

    getAvailableModels: function() {
        return this.availableModels[this.state.vehicleMake] || [];
    },
    
    // --- Core Page Methods ---
    
    // Səhifəni göstər
    show: async function(params = {}) {
        this.debug('Show method called', { params });
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error("Main content area not found!");
            return;
        }
        mainContent.innerHTML = '<div class="loading-indicator">Yüklənir...</div>'; 
        
        await this.init(params);
    },
    
    // Səhifəni başlat (initialize)
    init: async function(params = {}) {
        this.debug('Initializing page', { params });
        this.state.isLoading = true;
        this.resetState(); // Reset state for fresh load
        this.state.isEditing = !!params.vehicleId;
        this.state.vehicleId = params.vehicleId || null;
        
        if (this.state.isEditing) {
            this.debug('Editing mode detected', { vehicleId: this.state.vehicleId });
            await this.loadVehicleData(this.state.vehicleId);
        } else {
            this.debug('Adding new vehicle mode');
            // Reset to default for adding new vehicle
            this.updateState({ 
                vehicleMake: '', vehicleModel: '', vehicleYear: '', 
                passportPhoto: null, isDefault: false, errors: {}
            }, false); // Update without re-rendering yet
        }
        
        this.state.isLoading = false;
        this.debug('Initialization complete, proceeding to render', { finalState: this.state });
        this.render(); // Initial render after init
    },
    
    // Reset state to default values
    resetState: function() {
        this.debug('Resetting state');
        this.state = {
            ...this.state, // Keep refs like isLoading, isEditing
            vehicleMake: '',
            vehicleModel: '',
            vehicleYear: '',
            passportPhoto: null,
            showMakes: false,
            showModels: false,
            showYears: false,
            isDefault: false,
            errors: {},
            // Keep vehicleId if set
        };
    },
    
    // Vəziyyəti yenilə və UI-ı yenidən render et
    updateState: function(newState, shouldRender = true) {
        const oldState = { ...this.state };
        this.debug('Updating state', { oldState: oldState, newState: newState });
        this.state = { ...this.state, ...newState };
        this.debug('State updated', { currentState: this.state });
        if (shouldRender) {
            this.render();
        }
    },
    
    // Xəta mesajlarını göstər
    renderErrors: function() {
        this.debug('Rendering errors', { errors: this.state.errors });
        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.form-group.error').forEach(el => el.classList.remove('error'));

        for (const field in this.state.errors) {
            const errorMessage = this.state.errors[field];
            if (errorMessage) {
                let element;
                // Find the corresponding form group or button
                if (field === 'make' || field === 'model' || field === 'year') {
                    element = document.getElementById(`${field}Dropdown`)?.closest('.form-group');
                } else if (field === 'passportPhoto') {
                    element = document.querySelector('.image-upload-container')?.closest('.form-group');
                } else {
                    // General error display logic needed
                    element = document.getElementById('addVehicleForm'); // Fallback to form
                }

                if (element) {
                    element.classList.add('error');
                    const errorElement = document.createElement('p');
                    errorElement.className = 'error-message';
                    errorElement.textContent = errorMessage;
                    // Insert after the input/button container
                    const inputContainer = element.querySelector('.dropdown, .image-upload-container, .toggle-button') || element.querySelector('input, button');
                    inputContainer?.parentNode.insertBefore(errorElement, inputContainer.nextSibling);
                }
            }
        }
    },

    // --- Rendering Methods ---
    
    render: function() {
        this.debug('Starting render');
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        if (this.state.isLoading) {
            mainContent.innerHTML = '<div class="loading-indicator">Loading...</div>';
            return;
        }
        
        const html = this.generatePageHTML();
        this.debug('Generated HTML', { htmlLength: html.length });
        mainContent.innerHTML = html;
        
        this.renderErrors(); // Show validation errors if any
        this.setupEventListeners(); // Re-attach listeners after re-render
        this.setupTelegramButtons(); // Update Telegram buttons
        this.debug('Render completed');
    },
    
    generatePageHTML: function() {
        this.debug('Generating Page HTML');
        return `
            <div class="add-vehicle-page">
                ${this.generateHeaderHTML()}
                <div class="form-container">
                    <form id="addVehicleForm">
                        ${this.generateVehicleInfoSectionHTML()}
                        ${this.generateAdditionalInfoSectionHTML()}
                    </form>
                </div>
            </div>
        `;
    },
    
generateHeaderHTML: function() {
        return `
            <div class="page-header">
                <button id="backButtonAddVehicle" class="back-button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <h1 class="page-title">${this.state.isEditing ? 'Avtomobili Redaktə Et' : 'Avtomobil Əlavə Et'}</h1>
            </div>
        `;
    },
    
generateVehicleInfoSectionHTML: function() {
        return `
            <div class="form-section">
                <h2 class="section-title">Avtomobil Məlumatları</h2>
                ${this.generateDropdownHTML('make', 'Marka', this.availableMakes, this.state.vehicleMake, !this.state.isLoading)}
                ${this.generateDropdownHTML('model', 'Model', this.getAvailableModels(), this.state.vehicleModel, !!this.state.vehicleMake)}
                ${this.generateDropdownHTML('year', 'Buraxılış İli', this.availableYears, this.state.vehicleYear, !this.state.isLoading)}
            </div>
        `;
    },
    
generateDropdownHTML: function(type, label, options, selectedValue, enabled) {
        const id = `${type}Dropdown`;
        const show = this.state[`show${type.charAt(0).toUpperCase() + type.slice(1)}s`];
        const hasError = !!this.state.errors[type];
        
        this.debug('Generating Dropdown', { type, label, optionsCount: options.length, selectedValue, enabled, show, hasError });
        
        return `
            <div class="form-group ${hasError ? 'error' : ''}">
                <label for="${id}">${label} <span class="required">*</span></label>
                <div class="dropdown">
                    <button type="button" id="${id}" class="dropdown-button ${show ? 'active' : ''} ${!enabled ? 'disabled' : ''}" 
                            ${!enabled ? 'disabled' : ''}>
                        <span>${selectedValue || `${label} seçin`}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    ${show && enabled ? this.generateDropdownMenuHTML(options) : ''}
                </div>
                ${hasError ? `<p class="error-message" style="display:block;">${this.state.errors[type]}</p>` : ''} 
            </div>
        `;
    },
    
generateDropdownMenuHTML: function(options) {
        this.debug('Generating Dropdown Menu', { optionsCount: options.length });
        return `
            <div class="dropdown-menu">
                ${options.map(option => `
                    <button type="button" class="dropdown-item" data-value="${option}">${option}</button>
                `).join('')}
            </div>
        `;
    },
    
generateAdditionalInfoSectionHTML: function() {
        return `
            <div class="form-section">
                <h2 class="section-title">Əlavə Məlumat (Optional)</h2>
                ${this.generatePhotoUploadHTML()}
                ${this.generateDefaultToggleHTML()}
            </div>
        `;
    },
    
generatePhotoUploadHTML: function() {
        const hasError = !!this.state.errors.passportPhoto;
        this.debug('Generating Photo Upload', { photoState: this.state.passportPhoto, hasError });
        return `
            <div class="form-group ${hasError ? 'error' : ''}">
                <label>Avtomobilin Texpassportu</label>
                <div class="image-upload-container">
                    ${this.state.passportPhoto ? `
                        <div class="image-preview-wrapper">
                            <img src="${this.state.passportPhoto}" alt="Texpassport Preview" class="image-preview">
                            <button type="button" class="remove-photo-button">&times;</button>
                        </div>
                    ` : `
                        <label for="passport-photo-upload" class="image-upload-button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9C3 7.89543 3.89543 7 5 7H5.92963C6.59834 7 7.2228 6.6658 7.59373 6.1094L8.40627 4.8906C8.7772 4.3342 9.40166 4 10.0704 4H13.9296C14.5983 4 15.2228 4.3342 15.5937 4.8906L16.4063 6.1094C16.7772 6.6658 17.4017 7 18.0704 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Şəkil əlavə et</span>
                        </label>
                        <input type="file" id="passport-photo-upload" accept="image/*" style="display: none;">
                    `}
                </div>
                <p class="upload-hint">Texpassportun şəklini yükləmək məlumatların daha dəqiq olmasına kömək edir.</p>
                ${hasError ? `<p class="error-message" style="display:block;">${this.state.errors.passportPhoto}</p>` : ''} 
            </div>
        `;
    },
    
generateDefaultToggleHTML: function() {
        this.debug('Generating Default Toggle', { isDefault: this.state.isDefault });
        return `
            <div class="form-group toggle-group">
                <label for="defaultToggle">Əsas avtomobil kimi seç</label>
                <button type="button" id="defaultToggle" class="toggle-button ${this.state.isDefault ? 'active' : ''}" 
                        aria-pressed="${this.state.isDefault}">
                    <span class="toggle-handle"></span>
                </button>
            </div>
        `;
    },
    
    // --- Event Listener Setup & Cleanup ---
    
    setupEventListeners: function() {
        this.debug('Setting up event listeners');
        // Ensure previous listeners are cleaned up before adding new ones
        this.cleanupEventListeners(); 
        
        this.debug('Attaching back button listener');
        const backButton = document.getElementById('backButtonAddVehicle');
        if (backButton) {
            this.eventListeners.backButton = () => PartoMatApp.navigateTo('home'); // Navigate home explicitly
            backButton.addEventListener('click', this.eventListeners.backButton);
        } else {
            this.debug('Back button element not found');
        }

        this.debug('Attaching dropdown listeners');
        this.setupDropdownButtonListener('makeDropdown', 'make');
        this.setupDropdownButtonListener('modelDropdown', 'model');
        this.setupDropdownButtonListener('yearDropdown', 'year');
        
        // Listener for clicks on dropdown items (delegated)
        this.eventListeners.dropdownItems = (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const dropdownButton = e.target.closest('.dropdown')?.querySelector('.dropdown-button');
                if (!dropdownButton) return;
                const type = dropdownButton.id.replace('Dropdown', '');
                const value = e.target.dataset.value;
                this.debug('Dropdown item click detected', { type, value });
                this.handleDropdownItemClick(type, value);
            }
        };
        document.addEventListener('click', this.eventListeners.dropdownItems);
        
        // Listener for clicks outside dropdowns to close them
        this.eventListeners.clickOutside = (e) => {
            if (!e.target.closest('.dropdown')) {
                if (this.state.showMakes || this.state.showModels || this.state.showYears) {
                    this.debug('Clicked outside dropdown, closing open dropdowns');
                    this.updateState({
                        showMakes: false,
                        showModels: false,
                        showYears: false
                    });
                }
            }
        };
        document.addEventListener('click', this.eventListeners.clickOutside);

        this.debug('Attaching photo upload listener');
        const photoInput = document.getElementById('passport-photo-upload');
        if (photoInput) {
            this.eventListeners.photoInput = (e) => {
                const file = e.target.files[0];
                this.debug('Photo input changed', { fileName: file?.name });
                if (file) {
                    this.handlePhotoUpload(file);
                }
            };
            photoInput.addEventListener('change', this.eventListeners.photoInput);
        } else {
             this.debug('Photo input element not found');
        }
        
        this.debug('Attaching remove photo listener');
        const removePhotoButton = document.querySelector('.remove-photo-button');
        if (removePhotoButton) {
            this.eventListeners.removePhoto = () => {
                 this.debug('Remove photo button clicked');
                 this.updateState({ passportPhoto: null });
            };
            removePhotoButton.addEventListener('click', this.eventListeners.removePhoto);
        } else {
             this.debug('Remove photo button element not found (expected if no photo is present)');
        }

        this.debug('Attaching default toggle listener');
        const defaultToggle = document.getElementById('defaultToggle');
        if (defaultToggle) {
            this.eventListeners.defaultToggle = () => {
                this.debug('Default toggle clicked', { currentState: this.state.isDefault });
                this.updateState({
                    isDefault: !this.state.isDefault
                });
            };
            defaultToggle.addEventListener('click', this.eventListeners.defaultToggle);
        } else {
            this.debug('Default toggle element not found');
        }
        
        this.debug('Attaching form submit listener');
        const form = document.getElementById('addVehicleForm');
        if(form) {
             this.eventListeners.formSubmit = (e) => {
                  e.preventDefault(); // Prevent default form submission
                  this.debug('Form submit intercepted, calling handleSubmit');
                  // Trigger the main button handler instead of directly calling handleSubmit
                  if (this.eventListeners.mainButtonClickHandler) {
                      this.eventListeners.mainButtonClickHandler();
                  }
             };
             form.addEventListener('submit', this.eventListeners.formSubmit);
        } else {
             this.debug('Form element not found');
        }
        
        // --- Setup Telegram Main Button Listener (only once) ---
        if (!this.eventListeners.mainButtonClickHandler && typeof TelegramService !== 'undefined') {
             this.debug('Setting up Telegram Main Button click handler for the first time');
             this.eventListeners.mainButtonClickHandler = () => this.handleSubmit();
             TelegramService.tg.MainButton.onClick(this.eventListeners.mainButtonClickHandler);
        }
        
        this.debug('Event listeners setup complete');
    },
    
    setupDropdownButtonListener: function(id, type) {
        const button = document.getElementById(id);
        if (button) {
            const listenerKey = `${type}Dropdown`; // e.g., makeDropdown
            this.eventListeners[listenerKey] = (e) => {
                e.stopPropagation(); // Prevent clickOutside from closing immediately
                this.debug('Dropdown button clicked', { type });
                this.toggleDropdown(type);
            };
            button.addEventListener('click', this.eventListeners[listenerKey]);
            this.debug('Attached listener for dropdown button', { id });
        } else {
             this.debug('Dropdown button element not found', { id });
        }
    },

    cleanupEventListeners: function() {
        this.debug('Cleaning up event listeners');
        
        // Function to safely remove listener
        const removeListener = (elementId, event, listenerRef) => {
            const element = document.getElementById(elementId);
            if (element && listenerRef) {
                element.removeEventListener(event, listenerRef);
                this.debug('Removed listener', { elementId, event });
            } else if (listenerRef) {
                // Special cases for document listeners
                if (elementId === 'document') {
                    document.removeEventListener(event, listenerRef);
                    this.debug('Removed listener', { elementId: 'document', event });
                } else if (elementId === 'form') {
                    const form = document.getElementById('addVehicleForm');
                    if(form) form.removeEventListener(event, listenerRef);
                    this.debug('Removed listener', { elementId: 'form', event });
                } else {
                     this.debug('Listener ref exists but element not found for cleanup', { elementId });
                }
            }
        };
        
        // Special case for remove photo button (might not exist)
        const removePhotoButton = document.querySelector('.remove-photo-button');
        if (removePhotoButton && this.eventListeners.removePhoto) {
             removePhotoButton.removeEventListener('click', this.eventListeners.removePhoto);
             this.debug('Removed listener', { elementSelector: '.remove-photo-button', event: 'click' });
        }

        removeListener('backButtonAddVehicle', 'click', this.eventListeners.backButton);
        removeListener('makeDropdown', 'click', this.eventListeners.makeDropdown);
        removeListener('modelDropdown', 'click', this.eventListeners.modelDropdown);
        removeListener('yearDropdown', 'click', this.eventListeners.yearDropdown);
        removeListener('document', 'click', this.eventListeners.dropdownItems);
        removeListener('document', 'click', this.eventListeners.clickOutside);
        removeListener('passport-photo-upload', 'change', this.eventListeners.photoInput);
        removeListener('defaultToggle', 'click', this.eventListeners.defaultToggle);
        removeListener('form', 'submit', this.eventListeners.formSubmit);
        
        // Clear DOM listener references ONLY
        this.eventListeners.backButton = null;
        this.eventListeners.makeDropdown = null;
        this.eventListeners.modelDropdown = null;
        this.eventListeners.yearDropdown = null;
        this.eventListeners.dropdownItems = null;
        this.eventListeners.clickOutside = null;
        this.eventListeners.photoInput = null;
        this.eventListeners.removePhoto = null;
        this.eventListeners.defaultToggle = null;
        this.eventListeners.formSubmit = null;
        
        // *** Do NOT remove Telegram MainButton listener here, only in cleanup ***
        // *** Do NOT nullify mainButtonClickHandler here ***

        this.debug('DOM Event listeners cleanup complete');
    },

    // --- Interaction Handlers ---

    toggleDropdown: function(type) {
        this.debug(`Toggling ${type} dropdown`, { 
            currentStates: {
                showMakes: this.state.showMakes,
                showModels: this.state.showModels,
                showYears: this.state.showYears
            }
        });
        
        const newState = {
            showMakes: type === 'make' ? !this.state.showMakes : false,
            showModels: type === 'model' ? !this.state.showModels : false,
            showYears: type === 'year' ? !this.state.showYears : false,
        };
        
        this.updateState(newState);
    },

    handleDropdownItemClick: function(type, value) {
        this.debug('Dropdown item selected', { type, value });
        
        const newState = {
            showMakes: false,
            showModels: false,
            showYears: false,
            errors: { ...this.state.errors, [type]: undefined } // Clear error for this field
        };
        
        switch(type) {
            case 'make':
                newState.vehicleMake = value;
                newState.vehicleModel = ''; // Reset model when make changes
                newState.errors.model = undefined; // Clear model error too
                break;
            case 'model':
                newState.vehicleModel = value;
                break;
            case 'year':
                newState.vehicleYear = value;
                break;
        }
        
        this.updateState(newState);
    },

    handlePhotoUpload: function(file) {
        this.debug('Handling photo upload', { fileName: file.name, fileSize: file.size, fileType: file.type });
        
        // Clear previous photo error
        const currentErrors = { ...this.state.errors };
        delete currentErrors.passportPhoto;
        this.updateState({ errors: currentErrors }, false); // Update errors without re-render

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.debug('Invalid file type for photo upload');
            this.updateState({
                errors: { ...this.state.errors, passportPhoto: 'Yalnız şəkil faylları qəbul edilir.' }
            });
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
             this.debug('File size exceeds limit for photo upload');
            this.updateState({
                errors: { ...this.state.errors, passportPhoto: 'Şəkil ölçüsü 5MB-dan çox ola bilməz.' }
            });
            return;
        }
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            this.debug('Photo read successfully, updating state with preview');
            this.updateState({
                passportPhoto: e.target.result // Store base64 data URL
            });
        };
        reader.onerror = (e) => {
             this.debug('Error reading photo file', { error: e });
              this.updateState({
                errors: { ...this.state.errors, passportPhoto: 'Şəkil oxunarkən xəta baş verdi.' }
            });
        };
        reader.readAsDataURL(file);
    },

    // --- Data Loading & Saving ---

    loadVehicleData: async function(vehicleId) {
        this.debug('Loading vehicle data for editing', { vehicleId });
        this.updateState({ isLoading: true }, false); // Set loading without render
        
        try {
            const initData = TelegramService.getInitDataString();
            if (!initData) {
                throw new Error('Telegram initData not available');
            }
            
            const getVehicle = firebase.functions().httpsCallable('getVehicle');
            const result = await getVehicle({ vehicleId, initData });
            
            if (result.data.success) {
                const vehicle = result.data.vehicle;
                this.debug('Successfully loaded vehicle data', { vehicle });
                this.updateState({
                    vehicleMake: vehicle.make,
                    vehicleModel: vehicle.model,
                    vehicleYear: vehicle.year,
                    passportPhoto: vehicle.passportPhoto || null,
                    isDefault: vehicle.isDefault || false,
                    isLoading: false,
                    errors: {}
                }, false); // Update state without rendering yet
            } else {
                throw new Error(result.data.message || 'Failed to load vehicle data');
            }
        } catch (error) {
            this.debug('Error loading vehicle data', { error: error.message, details: error.details });
            this.updateState({ 
                isLoading: false,
                errors: { general: `Avtomobil məlumatları yüklənərkən xəta: ${error.message}` }
            }, false); // Update state without rendering yet
            // The render after init will show the error
        }
    },
    
handleSubmit: async function() {
        this.debug('Handling form submission');
        
        if (this.state.isLoading) {
             this.debug('Submission blocked: Already loading');
             return;
        }
        
        if (!this.validateForm()) {
            this.debug('Form validation failed');
            this.renderErrors(); // Re-render errors
            TelegramService.hapticImpact('light');
            return;
        }
        
        this.debug('Form validation passed, preparing to save');
        this.updateState({ isLoading: true }); // Show loading/disable button via render
        TelegramService.showMainButtonProgress();

        const vehicleData = {
            make: this.state.vehicleMake,
            model: this.state.vehicleModel,
            year: this.state.vehicleYear,
            passportPhoto: this.state.passportPhoto, // Send base64 or existing URL
            isDefault: this.state.isDefault
        };
        
        try {
            const initData = TelegramService.getInitDataString();
            if (!initData) {
                throw new Error('Telegram initData not available');
            }
            
            const saveVehicle = firebase.functions().httpsCallable('saveVehicle');
            const result = await saveVehicle({
                vehicleId: this.state.vehicleId, // Will be null for new vehicles
                vehicleData: vehicleData,
                initData: initData
            });
            
            if (result.data.success) {
                this.debug('Vehicle saved successfully', { resultData: result.data });
                TelegramService.showAlert(this.state.isEditing ? 'Avtomobil yeniləndi!' : 'Avtomobil əlavə edildi!');
                TelegramService.hapticImpact('light');
                PartoMatApp.navigateTo('home'); // Navigate back to home
            } else {
                throw new Error(result.data.message || 'Failed to save vehicle data');
            }
        } catch (error) {
            this.debug('Error saving vehicle', { error: error.message, details: error.details });
            this.updateState({
                isLoading: false,
                errors: { general: `Saxlama zamanı xəta: ${error.message}` }
            });
            TelegramService.showAlert(`Avtomobil saxlanarkən xəta baş verdi: ${error.message}`);
            TelegramService.hapticImpact('light');
        } finally {
            this.updateState({ isLoading: false }); // Ensure loading is off
            TelegramService.hideMainButtonProgress();
        }
    },
    
    validateForm: function() {
        this.debug('Validating form');
        const errors = {};
        if (!this.state.vehicleMake) {
            errors.make = 'Marka seçimi məcburidir.';
        }
        if (!this.state.vehicleModel) {
            errors.model = 'Model seçimi məcburidir.';
        }
        if (!this.state.vehicleYear) {
            errors.year = 'İl seçimi məcburidir.';
        }
        // Add more validation rules if needed
        
        this.updateState({ errors: errors }, false); // Update errors without re-render
        this.debug('Validation result', { errors, isValid: Object.keys(errors).length === 0 });
        return Object.keys(errors).length === 0; // Return true if no errors
    },

    // --- Telegram Integration ---
    
    setupTelegramButtons: function() {
        this.debug('Setting up Telegram buttons state (text, visibility, progress)');
        if (typeof TelegramService === 'undefined') {
             this.debug('TelegramService is undefined, skipping button setup');
             return;
        }
        // Back button is handled globally by TelegramService and App.navigateTo
        this.updateMainButtonState(); // Just update the appearance
    },

    updateMainButtonState: function() { // Renamed from setupMainButton
        const buttonText = this.state.isEditing ? 'Yadda Saxla' : 'Əlavə Et';
        const isEnabled = !this.state.isLoading; // Disable button while loading
        this.debug('Updating main button state', { text: buttonText, isEnabled, isLoading: this.state.isLoading, isEditing: this.state.isEditing });
        
        if (typeof TelegramService === 'undefined') return;
        
        // Only update properties, don't re-add onClick
        TelegramService.tg.MainButton.setText(buttonText);
        if (isEnabled) {
            TelegramService.tg.MainButton.enable();
        } else {
            TelegramService.tg.MainButton.disable();
        }
        TelegramService.tg.MainButton.show(); // Ensure it's visible

        // Also handle showing/hiding progress specifically
        if (this.state.isLoading) {
             TelegramService.showMainButtonProgress();
        } else {
             TelegramService.hideMainButtonProgress();
        }
    },
    
    // --- Page Cleanup ---
    
    cleanup: function() {
        this.debug('Cleaning up AddVehiclePage');
        this.cleanupEventListeners(); // Clean up DOM listeners
        
        // Clean up Telegram main button listener specifically
        if (this.eventListeners.mainButtonClickHandler && typeof TelegramService !== 'undefined') {
            this.debug('Removing Telegram Main Button click handler');
            TelegramService.tg.MainButton.offClick(this.eventListeners.mainButtonClickHandler);
            this.eventListeners.mainButtonClickHandler = null;
        }
        
        this.resetState(); 
        if (typeof TelegramService !== 'undefined') {
             TelegramService.hideMainButton(); // Hide main button when leaving
        }
    }
};