document.addEventListener('DOMContentLoaded', () => {

    const state = {
        currentStep: 0,
        formData: {
            persona_role: '', persona_context: '', persona_style: '',
            objective: '', category: 'général',
            methodology: '', use_chain_of_thought: true,
            context: '', structure: '', constraints: ''
        },
    };

    const WIZARD_STEPS = [ /* ... (inchangé) ... */ ];

    const storage = { /* ... (inchangé) ... */ };

    function buildFinalPrompt() { /* ... (inchangé) ... */ }

    const ui = {
        // ... (updatePromptCount, switchTab, resetWizardForm, updateQualityAnalyzer - inchangés) ...
        
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
    };

    const handlers = {
        handleGlobalClick(e) {
            const navButton = e.target.closest('.nav-item');
            if (navButton) { ui.switchTab(navButton.dataset.tab); return; }

            // *** LOGIQUE DE NAVIGATION DE L'ASSISTANT CORRIGÉE ***
            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) {
                    state.currentStep++; // On incrémente l'étape
                    ui.updateStepDisplay(); // On met à jour l'affichage
                } else {
                    // On est à la dernière étape, on crée le prompt
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
                if (state.currentStep > 0) {
                    state.currentStep--; // On décrémente l'étape
                    ui.updateStepDisplay(); // On met à jour l'affichage
                }
                return;
            }
        },

        handleGlobalInput(e) {
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section input, #creator-section select');
            if (wizardInput) {
                const id = wizardInput.id;
                const value = wizardInput.type === 'checkbox' ? wizardInput.checked : wizardInput.value;
                
                // On met à jour l'état seulement si la clé existe dans notre modèle de données
                if (state.formData.hasOwnProperty(id)) {
                    state.formData[id] = value;
                }
                
                ui.updateQualityAnalyzer();
            }
        }
    };

    function init() {
        const appContainer = document.querySelector('.app');
        if (!appContainer) return;
        appContainer.addEventListener('click', handlers.handleGlobalClick);
        appContainer.addEventListener('input', handlers.handleGlobalInput);
        ui.switchTab('creator');
        ui.updateStepDisplay();
        ui.updatePromptCount();
    }
    init();
});
