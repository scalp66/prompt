document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // ÉTAT CENTRALISÉ DE L'APPLICATION
    // =================================================================================
    const state = {
        currentStep: 0,
        formData: {},
        currentFolderId: 'all',
        editingPromptId: null,
    };

    // =================================================================================
    // CONSTANTES ET CONFIGURATION
    // =================================================================================
    const WIZARD_STEPS = [
        { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' }, { key: 'objective', title: 'Quel est votre objectif ?' },
        { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' }, { key: 'structure', title: 'Comment structurer la réponse ?' },
        { key: 'examples', title: 'Avez-vous des exemples ?' }, { key: 'constraints', title: 'Des contraintes spécifiques ?' }
    ];
    const PREDEFINED_ROLES = {
        'expert-dev': 'Tu es un expert développeur avec 10+ ans d\'expérience...', 'consultant': 'Tu es un consultant en stratégie d\'entreprise...',
        'professeur': 'Tu es un professeur pédagogue...', 'redacteur': 'Tu es un rédacteur professionnel...'
    };
    
    // =================================================================================
    // MODULE DE STOCKAGE (localStorage)
    // =================================================================================
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        getFolders: () => JSON.parse(localStorage.getItem('prompt_folders')) || [],
        saveFolders: (folders) => localStorage.setItem('prompt_folders', JSON.stringify(folders)),
        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), folderId: null, versions: [], ...promptData });
            this.savePrompts(prompts);
        },
        // ... (les autres fonctions de storage sont appelées par les handlers)
    };

    // =================================================================================
    // MODULE UI (Toutes les manipulations du DOM)
    // =================================================================================
    const ui = {
        // ... (toutes les fonctions UI pour mettre à jour l'affichage)
        updatePromptCount: () => { document.getElementById('prompt-count').textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`; },
        switchTab: (tabName) => {
            document.querySelectorAll('.main-content > div[id$="-section"]').forEach(s => s.classList.add('hidden'));
            document.getElementById(`${tabName}-section`)?.classList.remove('hidden');
            document.querySelectorAll('.sidebar .nav-item').forEach(item => item.classList.toggle('active', item.dataset.tab === tabName));
            if (tabName === 'library') { ui.renderFolders(); ui.renderPromptLibrary(); }
            if (tabName === 'freeform') { ui.resetFreeformForm(); }
        },
        updateStepDisplay: () => {
            document.querySelectorAll('#creator-section .step-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`step-${state.currentStep}`)?.classList.remove('hidden');
            document.getElementById('step-title').textContent = WIZARD_STEPS[state.currentStep].title;
            document.querySelectorAll('.steps-indicator .step').forEach((el, idx) => {
                el.classList.remove('active', 'completed');
                if (idx === state.currentStep) el.classList.add('active'); else if (idx < state.currentStep) el.classList.add('completed');
            });
            document.getElementById('prev-btn').classList.toggle('hidden', state.currentStep === 0);
            document.getElementById('next-btn').textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        },
        resetWizardForm: () => {
            state.currentStep = 0; state.formData = {};
            ['role', 'objective', 'context', 'structure', 'examples', 'constraints', 'category', 'role-suggestions'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });
            ui.updateStepDisplay();
        },
        // ... (les autres fonctions UI comme renderFolders, renderPromptLibrary, etc.)
    };

    // =================================================================================
    // GESTIONNAIRES D'ÉVÉNEMENTS (HANDLERS)
    // =================================================================================
    function getPromptPreview() {
        return [state.formData.role, state.formData.objective, state.formData.context, state.formData.structure, state.formData.examples, state.formData.constraints].filter(Boolean).join('\n\n');
    }

    // =================================================================================
    // INITIALISATION - Le Cœur de l'Application
    // =================================================================================
    function init() {
        // Attache un seul écouteur global sur toute l'application
        document.body.addEventListener('click', (e) => {
            
            // --- GESTIONNAIRE DE NAVIGATION ---
            const navButton = e.target.closest('.nav-item');
            if (navButton) {
                ui.switchTab(navButton.dataset.tab);
                return;
            }

            // --- GESTIONNAIRE DE L'ASSISTANT ---
            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) {
                    state.currentStep++;
                    ui.updateStepDisplay();
                } else {
                    storage.savePrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: getPromptPreview(), category: state.formData.category || 'général' });
                    ui.resetWizardForm();
                    ui.updatePromptCount();
                    alert('Prompt créé avec succès depuis l\'assistant !');
                }
                return;
            }
            if (e.target.closest('#prev-btn')) {
                if (state.currentStep > 0) {
                    state.currentStep--;
                    ui.updateStepDisplay();
                }
                return;
            }

            // --- GESTIONNAIRE DE SAISIE LIBRE ---
            if (e.target.closest('#save-freeform-btn')) {
                const content = document.getElementById('freeform-prompt-content').value.trim();
                let title = document.getElementById('freeform-prompt-title').value.trim();
                if (!content) return alert('Le contenu ne peut pas être vide.');
                if (!title) title = content.substring(0, 40) + '...';
                
                storage.savePrompt({ title, content, category: document.getElementById('freeform-prompt-category').value });
                alert('Prompt sauvegardé !');
                ui.switchTab('library');
                return;
            }

            // --- GESTIONNAIRE DE LA BIBLIOTHÈQUE ---
            if (e.target.closest('#new-folder-btn')) {
                const name = prompt('Nom du nouveau dossier:');
                if (name && name.trim()) {
                    const folders = storage.getFolders();
                    folders.push({ id: Date.now().toString(), name: name.trim() });
                    storage.saveFolders(folders);
                    ui.renderFolders();
                }
                return;
            }
            if (e.target.closest('#export-data-btn')) { /* ... logique d'export ... */ return; }
            if (e.target.closest('#import-data-btn')) { document.getElementById('import-data-input').click(); return; }

            // Gérer les actions sur les cartes de prompt
            const cardAction = e.target.closest('.prompt-card [data-action]');
            if (cardAction) {
                const action = cardAction.dataset.action;
                const promptId = cardAction.closest('.prompt-card').dataset.id;
                // ... logique pour delete, edit, copy ...
            }
        });

        // Attache les écouteurs pour la saisie de texte
        document.body.addEventListener('input', (e) => {
            // --- GESTIONNAIRE DE L'ASSISTANT (SAISIE) ---
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section select');
            if (wizardInput) {
                if (wizardInput.id in state.formData) {
                    state.formData[wizardInput.id] = wizardInput.value;
                }
                if (wizardInput.id === 'role-suggestions' && wizardInput.value) {
                    const roleText = PREDEFINED_ROLES[wizardInput.value];
                    document.getElementById('role').value = roleText;
                    state.formData.role = roleText;
                }
                // La logique d'analyse peut être ajoutée ici
            }
        });
        
        // Initialiser la vue
        ui.switchTab('creator');
        ui.updatePromptCount();
    }

    init();
});
