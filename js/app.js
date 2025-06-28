document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // ÉTAT CENTRALISÉ DE L'APPLICATION
    // =================================================================================
    const state = {
        currentStep: 0,
        formData: {},
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
        'expert-dev': 'Tu es un expert développeur avec 10+ ans d\'expérience en programmation...',
        'consultant': 'Tu es un consultant en stratégie d\'entreprise...',
        'professeur': 'Tu es un professeur pédagogue qui sait expliquer...',
        'redacteur': 'Tu es un rédacteur professionnel spécialisé...'
    };
    
    // =================================================================================
    // MODULE DE STOCKAGE (localStorage)
    // =================================================================================
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...promptData });
            this.savePrompts(prompts);
        },
    };

    // =================================================================================
    // MODULE UI (Toutes les manipulations du DOM)
    // =================================================================================
    const ui = {
        updatePromptCount: () => {
            const el = document.getElementById('prompt-count');
            if (el) el.textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`;
        },
        switchTab: (tabName) => {
            document.querySelectorAll('.main-content > div[id$="-section"]').forEach(s => s.classList.add('hidden'));
            const section = document.getElementById(`${tabName}-section`);
            if (section) section.classList.remove('hidden');

            document.querySelectorAll('.sidebar .nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.tab === tabName);
            });
        },
        updateStepDisplay: () => {
            const creatorSection = document.getElementById('creator-section');
            if (!creatorSection) return;

            creatorSection.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
            const currentStepEl = document.getElementById(`step-${state.currentStep}`);
            if (currentStepEl) currentStepEl.classList.remove('hidden');

            document.getElementById('step-title').textContent = WIZARD_STEPS[state.currentStep].title;
            
            creatorSection.querySelectorAll('.steps-indicator .step').forEach((el, idx) => {
                el.classList.remove('active', 'completed');
                if (idx === state.currentStep) el.classList.add('active');
                else if (idx < state.currentStep) el.classList.add('completed');
            });
            
            document.getElementById('prev-btn').classList.toggle('hidden', state.currentStep === 0);
            document.getElementById('next-btn').textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        },
        resetWizardForm: () => {
            state.currentStep = 0;
            state.formData = {};
            ['role', 'objective', 'context', 'structure', 'examples', 'constraints', 'category', 'role-suggestions'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            ui.updateStepDisplay();
        },
    };

    // =================================================================================
    // GESTIONNAIRES D'ÉVÉNEMENTS (HANDLERS)
    // =================================================================================
    const handlers = {
        handleGlobalClick(e) {
            // --- Navigation ---
            const navButton = e.target.closest('.nav-item');
            if (navButton) {
                ui.switchTab(navButton.dataset.tab);
                return;
            }

            // --- Assistant ---
            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) {
                    state.currentStep++;
                    ui.updateStepDisplay();
                } else {
                    const preview = Object.values(state.formData).filter(Boolean).join('\n\n');
                    storage.savePrompt({
                        title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40),
                        content: preview,
                        category: state.formData.category || 'général'
                    });
                    alert('Prompt créé avec succès depuis l\'assistant !');
                    ui.updatePromptCount();
                    ui.resetWizardForm();
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
        },

        handleGlobalInput(e) {
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section select');
            if (wizardInput) {
                const id = wizardInput.id;
                // Met à jour l'objet formData pour tous les champs correspondants
                if (id === 'role' || id === 'objective' || id === 'context' || id === 'structure' || id === 'examples' || id === 'constraints' || id === 'category') {
                    state.formData[id] = wizardInput.value;
                }
                // Gère spécifiquement le menu déroulant des rôles prédéfinis
                if (id === 'role-suggestions' && wizardInput.value) {
                    const roleText = PREDEFINED_ROLES[wizardInput.value];
                    const roleTextarea = document.getElementById('role');
                    if (roleTextarea) {
                        roleTextarea.value = roleText;
                        state.formData.role = roleText;
                    }
                }
            }
        }
    };

    // =================================================================================
    // INITIALISATION
    // =================================================================================
    function init() {
        const appContainer = document.querySelector('.app');
        if (!appContainer) {
            console.error("ERREUR CRITIQUE : Le conteneur .app est introuvable.");
            return;
        }

        // Attache les écouteurs globaux et robustes
        appContainer.addEventListener('click', handlers.handleGlobalClick);
        appContainer.addEventListener('input', handlers.handleGlobalInput);

        // Initialise la vue
        ui.switchTab('creator');
        ui.updateStepDisplay();
        ui.updatePromptCount();
        console.log("Application initialisée et entièrement fonctionnelle.");
    }

    init();
});
