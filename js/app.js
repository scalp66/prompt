// On encapsule toute l'application dans un écouteur d'événement pour s'assurer que le DOM est prêt
// et pour éviter de polluer l'espace de noms global.
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // STATE : Une source unique de vérité pour l'état de l'application.
    // =================================================================================
    const state = {
        currentStep: 0,
        currentFolderId: 'all',
        editingPromptId: null,
        formData: { role: '', objective: '', context: '', structure: '', examples: '', constraints: '', category: 'général' },
    };

    // =================================================================================
    // CONSTANTS
    // =================================================================================
    const WIZARD_STEPS = [
        { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' },
        { key: 'objective', title: 'Quel est votre objectif ?' },
        { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' },
        { key: 'structure', title: 'Comment structurer la réponse ?' },
        { key: 'examples', title: 'Avez-vous des exemples ?' },
        { key: 'constraints', title: 'Des contraintes spécifiques ?' }
    ];
    const MAX_VERSIONS = 5;

    // =================================================================================
    // DOM ELEMENTS : Centraliser les sélecteurs pour la performance et la maintenabilité.
    // =================================================================================
    const dom = {
        app: document.querySelector('.app'),
        // Ajoutez d'autres éléments fréquemment utilisés ici
        promptCount: document.getElementById('prompt-count'),
        promptLibraryList: document.getElementById('prompt-library-list'),
        folderList: document.getElementById('folder-list'),
        // ... etc.
    };

    // =================================================================================
    // CORE LOGIC MODULE : Fonctions pures et logique métier.
    // =================================================================================
    const core = {
        renderTemplate(template, variables) {
            if (!template) return '';
            return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, key) => {
                return variables.hasOwnProperty(key) ? variables[key] : placeholder;
            });
        },
        archiveCurrentVersion(prompt) {
            if (!prompt.versions) prompt.versions = [];
            
            prompt.versions.unshift({
                content: prompt.content,
                title: prompt.title,
                savedAt: prompt.updatedAt
            });

            if (prompt.versions.length > MAX_VERSIONS) {
                prompt.versions.pop();
            }
        }
    };
    
    // =================================================================================
    // STORAGE MODULE : Gère toutes les interactions avec localStorage.
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
            ui.showToast('Prompt sauvegardé avec succès !', 'success');
            ui.updatePromptCount();
        },
        
        updatePrompt(promptId, updatedData) {
            let prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index === -1) return false;

            const originalPrompt = prompts[index];
            // Archiver l'ancienne version si le contenu a changé
            if (originalPrompt.content !== updatedData.content) {
                core.archiveCurrentVersion(originalPrompt);
            }
            
            // Appliquer les nouvelles données
            prompts[index] = { ...originalPrompt, ...updatedData, updatedAt: new Date().toISOString() };
            
            this.savePrompts(prompts);
            ui.showToast('Prompt mis à jour avec succès !', 'success');
            return true;
        },
        
        // ... autres fonctions de storage (deletePrompt, saveFolder, etc.) ...
        deletePrompt(id) {
            this.savePrompts(this.getPrompts().filter(p => p.id !== id));
            ui.showToast('Prompt supprimé !', 'success');
            ui.updatePromptCount();
        },
    };

    // =================================================================================
    // API MODULE : Gère les appels aux API externes (IA).
    // =================================================================================
    const api = {
        async callAI(promptContent) {
            const apiKey = storage.getApiKey();
            if (!apiKey) {
                ui.showToast("Clé API non configurée dans les Paramètres.", "error");
                throw new Error("Clé API manquante.");
            }
            // ... logique de fetch ...
        }
    };

    // =================================================================================
    // UI MODULE : Toutes les fonctions qui manipulent directement le DOM.
    // =================================================================================
    const ui = {
        showToast(message, type = 'info', duration = 3000) {
            // ... logique de la fonction showToast ...
        },
        updatePromptCount() {
            const count = storage.getPrompts().length;
            dom.promptCount.textContent = `${count} prompt${count > 1 ? 's' : ''} sauvegardé${count > 1 ? 's' : ''}`;
        },
        switchTab(tabName) {
            // Cacher toutes les sections
            dom.app.querySelectorAll('.main-content > div').forEach(section => section.classList.add('hidden'));
            // Afficher la bonne section
            const sectionToShow = document.getElementById(`${tabName}-section`);
            if(sectionToShow) sectionToShow.classList.remove('hidden');

            // Mettre à jour l'état actif du bouton de navigation
            dom.app.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.tab === tabName);
            });
            
            // Logique spécifique à l'onglet
            if (tabName === 'library') {
                this.renderFolders();
                this.renderPromptLibrary();
            }
        },
        // ... Toutes les autres fonctions de rendu (renderFolders, renderPromptLibrary, etc.)
        renderFolders() { /* ... */ },
        renderPromptLibrary() { /* ... */ },
    };

    // =================================================================================
    // EVENT HANDLERS : Fonctions qui répondent aux actions de l'utilisateur.
    // =================================================================================
    function handleNavClick(e) {
        const navButton = e.target.closest('.nav-item');
        if (navButton) {
            ui.switchTab(navButton.dataset.tab);
        }
    }

    function handleSettingsSave() {
        const apiKey = document.getElementById('api-key-input').value;
        if (apiKey) {
            storage.saveApiKey(apiKey);
            ui.showToast('Clé API sauvegardée !', 'success');
        } else {
            ui.showToast('Veuillez entrer une clé API.', 'error');
        }
    }

    // =================================================================================
    // INITIALIZATION : Met en place les écouteurs d'événements et démarre l'app.
    // =================================================================================
    function init() {
        // Délégation d'événements pour une meilleure performance
        dom.app.querySelector('.sidebar nav').addEventListener('click', handleNavClick);
        document.getElementById('save-api-key-btn').addEventListener('click', handleSettingsSave);
        // ... configurer d'autres écouteurs en utilisant la délégation si possible ...

        ui.switchTab('creator'); // Définir l'onglet initial
        ui.updatePromptCount();
        console.log("Application initialisée.");
    }

    // Démarrer l'application
    init();
});