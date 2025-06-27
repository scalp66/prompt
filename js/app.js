document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // STATE & CONFIG
    // =================================================================================
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
        'expert-dev': 'Tu es un expert développeur avec 10+ ans d\'expérience en programmation. Tu maîtrises les bonnes pratiques, l\'architecture logicielle et l\'optimisation de code.',
        'consultant': 'Tu es un consultant en stratégie d\'entreprise avec une expertise en transformation digitale et amélioration des processus.',
        'professeur': 'Tu es un professeur pédagogue qui sait expliquer des concepts complexes de manière simple et accessible, avec des exemples concrets.',
        'redacteur': 'Tu es un rédacteur professionnel spécialisé dans la création de contenu engageant, optimisé SEO et adapté à différents publics.'
    };
    const MAX_VERSIONS = 5;

    // =================================================================================
    // DOM ELEMENTS
    // =================================================================================
    const dom = {
        // Navigation & Global
        app: document.querySelector('.app'),
        sidebarNav: document.querySelector('.sidebar nav'),
        mainContent: document.querySelector('.main-content'),
        promptCount: document.getElementById('prompt-count'),
        toastContainer: document.getElementById('toast-container'),

        // Wizard
        creatorSection: document.getElementById('creator-section'),
        stepsIndicator: document.querySelector('.steps-indicator'),
        stepTitle: document.getElementById('step-title'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        roleSuggestions: document.getElementById('role-suggestions'),
        qualityAnalyzer: document.getElementById('quality-analyzer'),
        scoreCircle: document.getElementById('score-circle'),
        scoreLabel: document.getElementById('score-label'),
        suggestionsContainer: document.getElementById('suggestions-container'),
        suggestionsList: document.getElementById('suggestions-list'),

        // Freeform
        saveFreeformBtn: document.getElementById('save-freeform-btn'),
        freeformContent: document.getElementById('freeform-prompt-content'),
        freeformTitle: document.getElementById('freeform-prompt-title'),
        freeformCategory: document.getElementById('freeform-prompt-category'),

        // Library
        libraryContainer: document.getElementById('library-section'),
        folderList: document.getElementById('folder-list'),
        promptLibraryList: document.getElementById('prompt-library-list'),
        newFolderBtn: document.getElementById('new-folder-btn'),
        searchInput: document.getElementById('search-input'),
        sortSelect: document.getElementById('sort-select'),

        // Modal
        promptModal: document.getElementById('prompt-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        modalCloseBtn: document.getElementById('modal-close-btn'),

        // Settings
        saveApiKeyBtn: document.getElementById('save-api-key-btn'),
        apiKeyInput: document.getElementById('api-key-input'),
    };

    // =================================================================================
    // STORAGE MODULE (localStorage)
    // =================================================================================
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
            ui.showToast('Prompt sauvegardé !', 'success');
            ui.updatePromptCount();
        },

        updatePrompt(promptId, updatedData) {
            let prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index === -1) return false;

            const originalPrompt = prompts[index];
            if (originalPrompt.content !== updatedData.content || originalPrompt.title !== updatedData.title) {
                if (!originalPrompt.versions) originalPrompt.versions = [];
                originalPrompt.versions.unshift({
                    content: originalPrompt.content,
                    title: originalPrompt.title,
                    savedAt: originalPrompt.updatedAt
                });
                if (originalPrompt.versions.length > MAX_VERSIONS) originalPrompt.versions.pop();
            }
            
            prompts[index] = { ...originalPrompt, ...updatedData, updatedAt: new Date().toISOString() };
            this.savePrompts(prompts);
            ui.showToast('Prompt mis à jour !', 'success');
            return true;
        },

        deletePrompt(id) {
            this.savePrompts(this.getPrompts().filter(p => p.id !== id));
            ui.showToast('Prompt supprimé !', 'success');
            ui.updatePromptCount();
        },

        saveFolder(folderName) {
            const folders = this.getFolders();
            folders.push({ id: Date.now().toString(), name: folderName });
            this.saveFolders(folders);
            ui.showToast('Dossier créé !', 'success');
        },

        deleteFolder(folderId) {
            this.saveFolders(this.getFolders().filter(f => f.id !== folderId));
            const prompts = this.getPrompts().map(p => {
                if (p.folderId === folderId) p.folderId = null;
                return p;
            });
            this.savePrompts(prompts);
            ui.showToast('Dossier supprimé !', 'success');
        },

        updatePromptFolder(promptId, folderId) {
            const prompts = this.getPrompts();
            const promptIndex = prompts.findIndex(p => p.id === promptId);
            if (promptIndex > -1) {
                prompts[promptIndex].folderId = folderId === 'null' ? null : folderId;
                this.savePrompts(prompts);
                ui.showToast('Prompt déplacé.', 'info');
            }
        },
    };

    // =================================================================================
    // UI MODULE (Manipulation du DOM)
    // =================================================================================
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

        updatePromptCount() {
            const count = storage.getPrompts().length;
            dom.promptCount.textContent = `${count} prompt${count > 1 ? 's' : ''} sauvegardé${count > 1 ? 's' : ''}`;
        },

        switchTab(tabName) {
            dom.mainContent.querySelectorAll('.main-content > div[id$="-section"]').forEach(section => {
                section.classList.add('hidden');
            });
            const sectionToShow = document.getElementById(`${tabName}-section`);
            if (sectionToShow) sectionToShow.classList.remove('hidden');

            dom.sidebarNav.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.tab === tabName);
            });
            
            if (tabName === 'library') {
                this.renderFolders();
                this.renderPromptLibrary();
            }
            if (tabName === 'freeform') {
                this.resetFreeformForm();
            }
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

        getPromptPreview: () => [
            state.formData.role, 
            state.formData.objective ? `Objectif: ${state.formData.objective}` : '',
            state.formData.context ? `Contexte: ${state.formData.context}` : '',
            state.formData.structure ? `Structure: ${state.formData.structure}` : '',
            state.formData.examples ? `Exemples: ${state.formData.examples}` : '',
            state.formData.constraints ? `Contraintes: ${state.formData.constraints}` : ''
        ].filter(Boolean).join('\n\n'),

        updateQualityAnalyzer() { /* ... (Logique d'analyse inchangée) ... */ },
        
        resetWizardForm() {
            state.currentStep = 0;
            state.formData = { role: '', objective: '', context: '', structure: '', examples: '', constraints: '', category: 'général' };
            ['role', 'objective', 'context', 'structure', 'examples', 'constraints'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const categoryEl = document.getElementById('category');
            if (categoryEl) categoryEl.value = 'général';
            dom.roleSuggestions.value = '';
            this.updateStepDisplay();
            this.updateQualityAnalyzer();
        },

        renderFolders() {
            const folders = storage.getFolders();
            dom.folderList.innerHTML = `<li class="folder-item ${state.currentFolderId === 'all' ? 'active' : ''}" data-id="all">Tous les prompts</li><li class="folder-item ${state.currentFolderId === 'uncategorized' ? 'active' : ''}" data-id="uncategorized">Non classés</li>`;
            folders.forEach(folder => {
                dom.folderList.innerHTML += `<li class="folder-item ${state.currentFolderId === folder.id ? 'active' : ''}" data-id="${folder.id}"><span>${folder.name}</span><button class="delete-folder-btn" data-id="${folder.id}">×</button></li>`;
            });
        },

        renderPromptLibrary() {
            let prompts = storage.getPrompts();
            const folders = storage.getFolders();
            const searchTerm = dom.searchInput.value.toLowerCase();
            const sortValue = dom.sortSelect.value;

            if (state.currentFolderId === 'uncategorized') prompts = prompts.filter(p => !p.folderId);
            else if (state.currentFolderId !== 'all') prompts = prompts.filter(p => p.folderId === state.currentFolderId);
            if (searchTerm) prompts = prompts.filter(p => p.title.toLowerCase().includes(searchTerm) || p.content.toLowerCase().includes(searchTerm));
            
            prompts.sort((a, b) => { /* ... (Logique de tri inchangée) ... */ });

            dom.promptLibraryList.innerHTML = prompts.length === 0 ? '<p style="text-align: center; color: #64748b; padding: 40px 0;">Aucun prompt trouvé.</p>' : '';
            prompts.forEach(prompt => {
                const card = document.createElement('div');
                card.className = 'prompt-card';
                card.dataset.id = prompt.id;
                // ... (Logique de création de la carte inchangée) ...
                dom.promptLibraryList.appendChild(card);
            });
        },

        openPromptModal(promptId) {
            const prompt = storage.getPrompts().find(p => p.id === promptId);
            if (!prompt) return;
            dom.modalTitle.textContent = prompt.title;
            dom.modalBody.textContent = prompt.content;
            dom.promptModal.classList.remove('hidden');
        },

        closePromptModal() { dom.promptModal.classList.add('hidden'); },

        resetFreeformForm() {
            dom.freeformContent.value = '';
            dom.freeformTitle.value = '';
            dom.freeformCategory.value = 'général';
            dom.saveFreeformBtn.textContent = 'Sauvegarder le Prompt';
            state.editingPromptId = null;
        }
    };

    // =================================================================================
    // EVENT HANDLERS
    // =================================================================================
    function handleNavClick(e) {
        const navButton = e.target.closest('.nav-item');
        if (navButton && navButton.dataset.tab) {
            ui.switchTab(navButton.dataset.tab);
        }
    }

    function handleWizardNav(e) {
        if (e.target === dom.nextBtn) {
            if (state.currentStep < WIZARD_STEPS.length - 1) {
                state.currentStep++;
                ui.updateStepDisplay();
            } else {
                storage.savePrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: ui.getPromptPreview(), category: state.formData.category });
                ui.resetWizardForm();
            }
        } else if (e.target === dom.prevBtn) {
            if (state.currentStep > 0) {
                state.currentStep--;
                ui.updateStepDisplay();
            }
        }
    }

    function handleWizardInput(e) {
        if (e.target.id in state.formData) {
            state.formData[e.target.id] = e.target.value;
        } else if (e.target.id === 'role-suggestions' && e.target.value) {
            const roleText = PREDEFINED_ROLES[e.target.value];
            document.getElementById('role').value = roleText;
            state.formData.role = roleText;
        }
        ui.updateQualityAnalyzer();
    }

    function handleFreeformSave() {
        const content = dom.freeformContent.value.trim();
        let title = dom.freeformTitle.value.trim();
        const category = dom.freeformCategory.value;

        if (!content) { ui.showToast('Le contenu du prompt ne peut pas être vide.', 'error'); return; }
        if (!title) title = content.substring(0, 40) + (content.length > 40 ? '...' : '');

        if (state.editingPromptId) {
            storage.updatePrompt(state.editingPromptId, { title, content, category });
            ui.switchTab('library');
        } else {
            storage.savePrompt({ title, content, category });
        }
        ui.resetFreeformForm();
    }

    function handleLibraryEvents(e) {
        const card = e.target.closest('.prompt-card');
        if (!card) return;
        const promptId = card.dataset.id;
        const actionTarget = e.target.closest('[data-action]');
        
        if (actionTarget) {
            const action = actionTarget.dataset.action;
            if (action === 'delete') {
                if (confirm('Supprimer ce prompt ?')) {
                    storage.deletePrompt(promptId);
                    ui.renderPromptLibrary();
                }
            } else if (action === 'edit') {
                state.editingPromptId = promptId;
                const prompt = storage.getPrompts().find(p => p.id === promptId);
                ui.switchTab('freeform');
                dom.freeformContent.value = prompt.content;
                dom.freeformTitle.value = prompt.title;
                dom.freeformCategory.value = prompt.category;
                dom.saveFreeformBtn.textContent = 'Mettre à jour le Prompt';
            } else if (action === 'copy') {
                const prompt = storage.getPrompts().find(p => p.id === promptId);
                navigator.clipboard.writeText(prompt.content).then(() => ui.showToast('Copié !', 'success'));
            } else if (action === 'move') {
                storage.updatePromptFolder(promptId, actionTarget.value);
                if (state.currentFolderId !== 'all') ui.renderPromptLibrary();
            }
        } else {
            ui.openPromptModal(promptId);
        }
    }
    
    function handleFolderEvents(e) {
        const item = e.target.closest('.folder-item');
        if (!item) return;

        const delBtn = e.target.closest('.delete-folder-btn');
        if (delBtn) {
            e.stopPropagation();
            if (confirm('Supprimer ce dossier ? (Les prompts seront conservés)')) {
                storage.deleteFolder(delBtn.dataset.id);
                state.currentFolderId = 'all';
                ui.renderFolders();
                ui.renderPromptLibrary();
            }
        } else {
            state.currentFolderId = item.dataset.id;
            ui.renderFolders();
            ui.renderPromptLibrary();
        }
    }

    function handleSettingsSave() {
        const apiKey = dom.apiKeyInput.value;
        if (apiKey && apiKey.trim()) {
            storage.saveApiKey(apiKey.trim());
            ui.showToast('Clé API sauvegardée !', 'success');
            dom.apiKeyInput.value = '';
            dom.apiKeyInput.placeholder = "Une clé est déjà enregistrée.";
        } else {
            ui.showToast('Veuillez entrer une clé API.', 'error');
        }
    }

    // =================================================================================
    // INITIALIZATION
    // =================================================================================
    function setupEventListeners() {
        dom.sidebarNav.addEventListener('click', handleNavClick);
        dom.saveApiKeyBtn.addEventListener('click', handleSettingsSave);
        dom.creatorSection.addEventListener('click', handleWizardNav);
        dom.creatorSection.addEventListener('input', handleWizardInput);
        dom.saveFreeformBtn.addEventListener('click', handleFreeformSave);
        dom.libraryContainer.addEventListener('click', handleLibraryEvents);
        dom.libraryContainer.addEventListener('change', handleLibraryEvents);
        dom.searchInput.addEventListener('input', ui.renderPromptLibrary);
        dom.sortSelect.addEventListener('change', ui.renderPromptLibrary);
        dom.folderList.addEventListener('click', handleFolderEvents);
        dom.newFolderBtn.addEventListener('click', () => {
            const name = prompt('Nom du nouveau dossier:');
            if (name && name.trim()) {
                storage.saveFolder(name.trim());
                ui.renderFolders();
            }
        });
        dom.modalCloseBtn.addEventListener('click', ui.closePromptModal);
        dom.promptModal.addEventListener('click', (e) => {
            if (e.target === dom.promptModal) ui.closePromptModal();
        });
    }

    function init() {
        setupEventListeners();
        ui.switchTab('creator');
        ui.updatePromptCount();
        const existingKey = storage.getApiKey();
        if (existingKey) dom.apiKeyInput.placeholder = "Une clé est déjà enregistrée.";
    }

    init();
});
