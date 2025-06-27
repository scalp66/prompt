document.addEventListener('DOMContentLoaded', () => {

    const state = {
        currentStep: 0,
        formData: { role: '', objective: '', context: '', structure: '', examples: '', constraints: '', category: 'général' },
        currentFolderId: 'all',
        editingPromptId: null,
    };

    const WIZARD_STEPS = [
        { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' },
        { key: 'objective', title: 'Quel est votre objectif ?' },
        { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' },
        { key: 'structure', title: 'Comment structurer la réponse ?' },
        { key: 'examples', title: 'Avez-vous des exemples ?' },
        { key: 'constraints', title: 'Des contraintes spécifiques ?' }
    ];
    const PREDEFINED_ROLES = {
        'expert-dev': 'Tu es un expert développeur avec 10+ ans d\'expérience en programmation...',
        'consultant': 'Tu es un consultant en stratégie d\'entreprise...',
        'professeur': 'Tu es un professeur pédagogue qui sait expliquer...',
        'redacteur': 'Tu es un rédacteur professionnel spécialisé...'
    };
    const MAX_VERSIONS = 5;

    const dom = {
        sidebarNav: document.querySelector('.sidebar nav'),
        mainContent: document.querySelector('.main-content'),
        promptCount: document.getElementById('prompt-count'),
        toastContainer: document.getElementById('toast-container'),
        creatorSection: document.getElementById('creator-section'),
        stepsIndicator: document.querySelector('.steps-indicator'),
        stepTitle: document.getElementById('step-title'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        roleSuggestions: document.getElementById('role-suggestions'),
        saveFreeformBtn: document.getElementById('save-freeform-btn'),
        freeformContent: document.getElementById('freeform-prompt-content'),
        freeformTitle: document.getElementById('freeform-prompt-title'),
        freeformCategory: document.getElementById('freeform-prompt-category'),
        libraryContainer: document.getElementById('library-section'),
        folderList: document.getElementById('folder-list'),
        promptLibraryList: document.getElementById('prompt-library-list'),
        newFolderBtn: document.getElementById('new-folder-btn'),
        searchInput: document.getElementById('search-input'),
        sortSelect: document.getElementById('sort-select'),
        exportDataBtn: document.getElementById('export-data-btn'),
        importDataBtn: document.getElementById('import-data-btn'),
        importDataInput: document.getElementById('import-data-input'),
        promptModal: document.getElementById('prompt-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        modalCloseBtn: document.getElementById('modal-close-btn'),
        saveApiKeyBtn: document.getElementById('save-api-key-btn'),
        apiKeyInput: document.getElementById('api-key-input'),
    };

    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        getFolders: () => JSON.parse(localStorage.getItem('prompt_folders')) || [],
        saveFolders: (folders) => localStorage.setItem('prompt_folders', JSON.stringify(folders)),
        getApiKey: () => localStorage.getItem('user_api_key'),
        saveApiKey: (key) => localStorage.setItem('user_api_key', key),

        savePrompt(promptData) {
            const prompts = this.getPrompts();
            const newPrompt = { 
                id: Date.now().toString(), 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString(),
                folderId: null, 
                versions: [],
                ...promptData 
            };
            prompts.push(newPrompt);
            this.savePrompts(prompts);
            ui.updatePromptCount();
        },

        updatePrompt(promptId, updatedData) {
            let prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index === -1) return false;
            const originalPrompt = prompts[index];
            if (originalPrompt.content !== updatedData.content || originalPrompt.title !== updatedData.title) {
                if (!originalPrompt.versions) originalPrompt.versions = [];
                originalPrompt.versions.unshift({ content: originalPrompt.content, title: originalPrompt.title, savedAt: originalPrompt.updatedAt || new Date().toISOString() });
                if (originalPrompt.versions.length > MAX_VERSIONS) originalPrompt.versions.pop();
            }
            prompts[index] = { ...originalPrompt, ...updatedData, updatedAt: new Date().toISOString() };
            this.savePrompts(prompts);
            return true;
        },

        deletePrompt(id) {
            this.savePrompts(this.getPrompts().filter(p => p.id !== id));
            ui.updatePromptCount();
        },
        
        saveFolder(folderName) {
            const folders = this.getFolders();
            folders.push({ id: Date.now().toString(), name: folderName });
            this.saveFolders(folders);
        },

        deleteFolder(folderId) {
            this.saveFolders(this.getFolders().filter(f => f.id !== folderId));
            const prompts = this.getPrompts().map(p => {
                if (p.folderId === folderId) p.folderId = null;
                return p;
            });
            this.savePrompts(prompts);
        },

        updatePromptFolder(promptId, folderId) {
            const prompts = this.getPrompts();
            const promptIndex = prompts.findIndex(p => p.id === promptId);
            if (promptIndex > -1) {
                prompts[promptIndex].folderId = folderId === 'null' ? null : folderId;
                this.savePrompts(prompts);
            }
        },
    };

    const ui = {
        showToast(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            let icon = 'ℹ️';
            if (type === 'success') icon = '✔️';
            if (type === 'error') icon = '❌';
            toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;
            dom.toastContainer.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => toast.remove());
            }, duration);
        },

        updatePromptCount() { dom.promptCount.textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`; },

        switchTab(tabName) {
            dom.mainContent.querySelectorAll('.main-content > div[id$="-section"]').forEach(section => section.classList.add('hidden'));
            const sectionToShow = document.getElementById(`${tabName}-section`);
            if (sectionToShow) sectionToShow.classList.remove('hidden');

            dom.sidebarNav.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.tab === tabName));
            
            if (tabName === 'library') { this.renderFolders(); this.renderPromptLibrary(); }
            if (tabName === 'freeform') { this.resetFreeformForm(); }
        },

        updateStepDisplay() {
            dom.creatorSection.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`step-${state.currentStep}`).classList.remove('hidden');
            dom.stepTitle.textContent = WIZARD_STEPS[state.currentStep].title;
            dom.stepsIndicator.querySelectorAll('.step').forEach((el, idx) => {
                el.classList.remove('active', 'completed');
                if (idx === state.currentStep) el.classList.add('active');
                else if (idx < state.currentStep) el.classList.add('completed');
            });
            dom.prevBtn.classList.toggle('hidden', state.currentStep === 0);
            dom.nextBtn.textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        },
        
        resetWizardForm() {
            state.currentStep = 0;
            state.formData = { role: '', objective: '', context: '', structure: '', examples: '', constraints: '', category: 'général' };
            ['role', 'objective', 'context', 'structure', 'examples', 'constraints'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const categoryEl = document.getElementById('category');
            if (categoryEl) categoryEl.value = 'général';
            if (dom.roleSuggestions) dom.roleSuggestions.value = '';
            this.updateStepDisplay();
        },

        renderFolders() {
            const folders = storage.getFolders();
            dom.folderList.innerHTML = `<li class="folder-item ${state.currentFolderId === 'all' ? 'active' : ''}" data-id="all">Tous les prompts</li><li class="folder-item ${state.currentFolderId === 'uncategorized' ? 'active' : ''}" data-id="uncategorized">Non classés</li>`;
            folders.forEach(folder => { dom.folderList.innerHTML += `<li class="folder-item ${state.currentFolderId === folder.id ? 'active' : ''}" data-id="${folder.id}"><span>${folder.name}</span><button class="delete-folder-btn" data-id="${folder.id}">×</button></li>`; });
        },

        renderPromptLibrary() {
            let prompts = storage.getPrompts();
            const searchTerm = dom.searchInput.value.toLowerCase();
            const sortValue = dom.sortSelect.value;
            if (state.currentFolderId === 'uncategorized') prompts = prompts.filter(p => !p.folderId);
            else if (state.currentFolderId !== 'all') prompts = prompts.filter(p => p.folderId === state.currentFolderId);
            if (searchTerm) prompts = prompts.filter(p => p.title.toLowerCase().includes(searchTerm) || p.content.toLowerCase().includes(searchTerm));
            prompts.sort((a, b) => { /* ... (logique de tri) ... */ });
            dom.promptLibraryList.innerHTML = prompts.length === 0 ? '<p style="text-align: center; color: #64748b; padding: 40px 0;">Aucun prompt trouvé.</p>' : '';
            prompts.forEach(prompt => {
                const card = document.createElement('div');
                card.className = 'prompt-card';
                card.dataset.id = prompt.id;
                const folders = storage.getFolders();
                const folderOptions = folders.map(f => `<option value="${f.id}" ${prompt.folderId === f.id ? 'selected' : ''}>${f.name}</option>`).join('');
                const selectHTML = `<select class="form-select btn-sm" data-action="move"><option value="null" ${!prompt.folderId ? 'selected' : ''}>Non classé</option>${folderOptions}</select>`;
                card.innerHTML = `<div class="prompt-card-header"><h4 class="prompt-card-title">${prompt.title}</h4><span class="prompt-card-category">${prompt.category}</span></div><p class="prompt-card-content">${prompt.content}</p><div class="prompt-card-footer"><small class="prompt-card-date">Modifié le: ${new Date(prompt.updatedAt).toLocaleDateString('fr-FR')}</small><div class="prompt-card-actions">${selectHTML}<button class="btn btn-secondary btn-sm" data-action="edit">Modifier</button><button class="btn btn-secondary btn-sm" data-action="copy">Copier</button><button class="btn btn-secondary btn-sm" data-action="delete" style="background-color: #fee2e2; color: #ef4444;">Supprimer</button></div></div>`;
                dom.promptLibraryList.appendChild(card);
            });
        },

        openPromptModal(promptId) { /* ... */ },
        closePromptModal() { /* ... */ },
        resetFreeformForm() {
            dom.freeformContent.value = '';
            dom.freeformTitle.value = '';
            dom.freeformCategory.value = 'général';
            dom.saveFreeformBtn.textContent = 'Sauvegarder le Prompt';
            state.editingPromptId = null;
        }
    };

    function getPromptPreview() {
        return [state.formData.role, state.formData.objective, state.formData.context, state.formData.structure, state.formData.examples, state.formData.constraints].filter(Boolean).join('\n\n');
    }
    
    function handleNavClick(e) { /* ... */ }
    function handleWizardNav(e) {
        if (e.target === dom.nextBtn) {
            if (state.currentStep < WIZARD_STEPS.length - 1) {
                state.currentStep++;
                ui.updateStepDisplay();
            } else {
                storage.savePrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: getPromptPreview(), category: state.formData.category });
                ui.resetWizardForm();
                ui.showToast('Prompt créé depuis l\'assistant !', 'success');
            }
        } else if (e.target === dom.prevBtn) {
            if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); }
        }
    }
    function handleWizardInput(e) { /* ... */ }
    function handleFreeformSave() { /* ... */ }
    function handleLibraryEvents(e) { /* ... */ }
    function handleFolderEvents(e) { /* ... */ }
    function handleSettingsSave() { /* ... */ }
    function exportData() { /* ... */ }
    function importData(event) { /* ... */ }

    function setupEventListeners() {
        if (dom.sidebarNav) dom.sidebarNav.addEventListener('click', handleNavClick);
        if (dom.creatorSection) {
            dom.creatorSection.addEventListener('click', handleWizardNav);
            dom.creatorSection.addEventListener('input', handleWizardInput);
        }
        if (dom.saveFreeformBtn) dom.saveFreeformBtn.addEventListener('click', handleFreeformSave);
        if (dom.libraryContainer) {
            dom.libraryContainer.addEventListener('click', handleLibraryEvents);
            dom.libraryContainer.addEventListener('change', handleLibraryEvents);
            if (dom.searchInput) dom.searchInput.addEventListener('input', ui.renderPromptLibrary);
            if (dom.sortSelect) dom.sortSelect.addEventListener('change', ui.renderPromptLibrary);
            if (dom.folderList) dom.folderList.addEventListener('click', handleFolderEvents);
            if (dom.newFolderBtn) dom.newFolderBtn.addEventListener('click', () => {
                const name = prompt('Nom du nouveau dossier:');
                if (name && name.trim()) { storage.saveFolder(name.trim()); ui.renderFolders(); }
            });
            if (dom.exportDataBtn) dom.exportDataBtn.addEventListener('click', exportData);
            if (dom.importDataBtn) dom.importDataBtn.addEventListener('click', () => dom.importDataInput.click());
            if (dom.importDataInput) dom.importDataInput.addEventListener('change', importData);
        }
        if (dom.promptModal) {
            dom.modalCloseBtn.addEventListener('click', ui.closePromptModal);
            dom.promptModal.addEventListener('click', (e) => { if (e.target === dom.promptModal) ui.closePromptModal(); });
        }
        if (dom.saveApiKeyBtn) dom.saveApiKeyBtn.addEventListener('click', handleSettingsSave);
    }

    function init() {
        setupEventListeners();
        ui.switchTab('creator');
        ui.updatePromptCount();
        const existingKey = storage.getApiKey();
        if (existingKey && dom.apiKeyInput) dom.apiKeyInput.placeholder = "Une clé est déjà enregistrée.";
    }

    init();
});
