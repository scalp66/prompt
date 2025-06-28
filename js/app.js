document.addEventListener('DOMContentLoaded', () => {

    // --- ÉTAT ET CONSTANTES (Maintenant complets) ---
    const state = {
        currentStep: 0,
        formData: {
            persona_role: '', persona_context: '', persona_style: '',
            objective: '', category: 'général',
            methodology: '', use_chain_of_thought: true,
            context: '', structure: '', constraints: ''
        },
    };
    const WIZARD_STEPS = [
        { title: 'Qui est l\'IA ? (Persona)' }, { title: 'Quel est l\'objectif final ?' },
        { title: 'Comment l\'IA doit-elle raisonner ?' }, { title: 'Quel contexte fournir ?' },
        { title: 'Quelle est la structure de la réponse ?' }, { title: 'Quelles sont les contraintes ?' }
    ];

    // =================================================================================
    // DÉCLARATION ANTICIPÉE DES MODULES
    // =================================================================================
    const storage = {};
    const ui = {};
    const handlers = {};

    // =================================================================================
    // LOGIQUE MÉTIER PURE
    // =================================================================================
    function buildFinalPrompt() {
        let promptParts = [];
        const data = state.formData;
        const useCoT = document.getElementById('use_chain_of_thought')?.checked ?? true;
        if (data.persona_role) { let personaStr = `Tu es un ${data.persona_role}`; if (data.persona_context) personaStr += `, ${data.persona_context}`; if (data.persona_style) personaStr += `. Ton style est ${data.persona_style}.`; promptParts.push(`**Persona:**\n${personaStr}`); }
        if (data.objective) promptParts.push(`**Objectif Principal:**\n${data.objective}`);
        let methodologyStr = useCoT ? "Réfléchis étape par étape. " : ""; if (data.methodology) methodologyStr += data.methodology; if (methodologyStr.trim()) promptParts.push(`**Méthodologie:**\n${methodologyStr}`);
        if (data.context) promptParts.push(`**Contexte:**\n${data.context}`);
        if (data.structure) promptParts.push(`**Structure de Réponse:**\n${data.structure}`);
        if (data.constraints) promptParts.push(`**Contraintes:**\n${data.constraints}`);
        return promptParts.join('\n\n---\n\n');
    }

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
    });

    // =================================================================================
    // PEUPLEMENT DU MODULE UI
    // =================================================================================
    Object.assign(ui, {
        updatePromptCount: () => { const el = document.getElementById('prompt-count'); if (el) el.textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`; },
        switchTab: (tabName) => { document.querySelectorAll('.main-content > div[id$="-section"]').forEach(s => s.classList.add('hidden')); const section = document.getElementById(`${tabName}-section`); if (section) section.classList.remove('hidden'); document.querySelectorAll('.sidebar .nav-item').forEach(item => item.classList.toggle('active', item.dataset.tab === tabName)); },
        updateStepDisplay: () => {
            const creatorSection = document.getElementById('creator-section');
            if (!creatorSection) return;
            creatorSection.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`step-${state.currentStep}`)?.classList.remove('hidden');
            document.getElementById('step-title').textContent = WIZARD_STEPS[state.currentStep].title; // Cette ligne est maintenant sûre
            creatorSection.querySelectorAll('.steps-indicator .step').forEach((el, idx) => { el.classList.remove('active', 'completed'); if (idx === state.currentStep) el.classList.add('active'); else if (idx < state.currentStep) el.classList.add('completed'); });
            document.getElementById('prev-btn').classList.toggle('hidden', state.currentStep === 0);
            document.getElementById('next-btn').textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        },
        resetWizardForm: () => {
            state.currentStep = 0; state.formData = { persona_role: '', persona_context: '', persona_style: '', objective: '', category: 'général', methodology: '', use_chain_of_thought: true, context: '', structure: '', constraints: '' };
            document.querySelectorAll('#creator-section input, #creator-section textarea, #creator-section select').forEach(el => { if (el.type === 'checkbox') el.checked = true; else el.value = ''; });
            ui.updateStepDisplay();
        },
    });

    // =================================================================================
    // PEUPLEMENT DU MODULE HANDLERS
    // =================================================================================
    Object.assign(handlers, {
        handleGlobalClick(e) {
            const navButton = e.target.closest('.nav-item');
            if (navButton) { ui.switchTab(navButton.dataset.tab); return; }
            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) { state.currentStep++; ui.updateStepDisplay(); }
                else { const finalPrompt = buildFinalPrompt(); if (!finalPrompt) return alert('Prompt vide.'); storage.savePrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: finalPrompt, category: state.formData.category }); alert('Prompt Expert créé !'); ui.updatePromptCount(); ui.resetWizardForm(); }
                return;
            }
            if (e.target.closest('#prev-btn')) { if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); } return; }
        },
        handleGlobalInput(e) {
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section input, #creator-section select');
            if (wizardInput) {
                const id = wizardInput.id;
                const value = wizardInput.type === 'checkbox' ? wizardInput.checked : wizardInput.value;
                if (state.formData.hasOwnProperty(id)) { state.formData[id] = value; }
            }
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
        ui.switchTab('creator');
        ui.updateStepDisplay();
        ui.updatePromptCount();
    }
    
    init();
});
