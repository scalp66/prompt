document.addEventListener('DOMContentLoaded', () => {

    // --- ÉTAT ET CONSTANTES ---
    const state = { /* ... (inchangé) ... */ };
    const WIZARD_STEPS = [ /* ... (inchangé) ... */ ];

    // =================================================================================
    // DÉCLARATION ANTICIPÉE DES MODULES
    // =================================================================================
    const storage = {};
    const ui = {};
    const handlers = {};

    // =================================================================================
    // LOGIQUE MÉTIER PURE
    // =================================================================================
    function buildFinalPrompt() { /* ... (inchangé) ... */ }

    // =================================================================================
    // PEUPLEMENT DU MODULE STORAGE
    // =================================================================================
    Object.assign(storage, {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...promptData });
            this.savePrompts(prompts);
        },
        // ... (autres fonctions de storage)
    });

    // =================================================================================
    // PEUPLEMENT DU MODULE UI
    // =================================================================================
    Object.assign(ui, {
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
            document.getElementById(`step-${state.currentStep}`)?.classList.remove('hidden');
            document.getElementById('step-title').textContent = WIZARD_STEPS[state.currentStep].title;
            creatorSection.querySelectorAll('.steps-indicator .step').forEach((el, idx) => {
                el.classList.remove('active', 'completed');
                if (idx === state.currentStep) el.classList.add('active'); else if (idx < state.currentStep) el.classList.add('completed');
            });
            document.getElementById('prev-btn').classList.toggle('hidden', state.currentStep === 0);
            document.getElementById('next-btn').textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        },
        resetWizardForm: () => {
             // ... (logique de resetWizardForm)
        },
        // ... (autres fonctions UI)
    });

    // =================================================================================
    // PEUPLEMENT DU MODULE HANDLERS
    // =================================================================================
    Object.assign(handlers, {
        handleGlobalClick(e) {
            const navButton = e.target.closest('.nav-item');
            if (navButton) { ui.switchTab(navButton.dataset.tab); return; }

            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) {
                    state.currentStep++;
                    ui.updateStepDisplay();
                } else {
                    const finalPrompt = buildFinalPrompt();
                    if (!finalPrompt) return alert('Impossible de créer un prompt vide.');
                    storage.savePrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: finalPrompt, category: state.formData.category });
                    alert('Prompt Expert créé avec succès !');
                    ui.updatePromptCount();
                    ui.resetWizardForm();
                }
                return;
            }
            if (e.target.closest('#prev-btn')) {
                if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); }
                return;
            }
        },
        handleGlobalInput(e) {
            // ... (logique de handleGlobalInput)
        }
    });

    // =================================================================================
    // INITIALISATION
    // =================================================================================
    function init() {
        const appContainer = document.querySelector('.app');
        if (!appContainer) return;
        appContainer.addEventListener('click', handlers.handleGlobalClick);
        appContainer.addEventListener('input', handlers.handleGlobalInput);
        
        // CET APPEL EST MAINTENANT SÛR
        ui.switchTab('creator');
        ui.updateStepDisplay();
        ui.updatePromptCount();
    }
    
    init();
});
