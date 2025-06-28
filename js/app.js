document.addEventListener('DOMContentLoaded', () => {

    // --- ÉTAT DE L'APPLICATION ---
    const state = {
        currentStep: 0,
        // formData est maintenant un simple dictionnaire qui se remplit dynamiquement.
        formData: {}, 
    };

    // --- CONSTANTES ---
    const WIZARD_STEPS = [
        { title: 'Qui est l\'IA ? (Persona)' }, { title: 'Quel est l\'objectif final ?' },
        { title: 'Comment l\'IA doit-elle raisonner ?' }, { title: 'Quel contexte fournir ?' },
        { title: 'Quelle est la structure de la réponse ?' }, { title: 'Quelles sont les contraintes ?' }
    ];
    
    // --- MODULE DE STOCKAGE (simplifié pour la clarté) ---
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...promptData });
            this.savePrompts(prompts);
        },
    };

    // --- MODULE UI ---
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
            state.currentStep = 0; state.formData = {};
            document.querySelectorAll('#creator-section input, #creator-section textarea, #creator-section select').forEach(el => {
                if(el.type === 'checkbox') el.checked = true; else el.value = '';
            });
            ui.updateStepDisplay();
        },
    };

    // --- LOGIQUE MÉTIER ---

    // *** NOUVELLE FONCTION CLÉ POUR LA FLEXIBILITÉ ***
    // Construit le prompt final uniquement avec les sections remplies.
    function buildFinalPrompt() {
        let promptParts = [];

        // 1. Persona
        const personaRole = state.formData.persona_role || '';
        const personaContext = state.formData.persona_context || '';
        const personaStyle = state.formData.persona_style || '';
        if (personaRole) {
            let personaStr = `Tu es un ${personaRole}`;
            if (personaContext) personaStr += `, ${personaContext}`;
            if (personaStyle) personaStr += `. Ton style est ${personaStyle}.`;
            promptParts.push(`**Persona:**\n${personaStr}`);
        }

        // 2. Objectif
        const objective = state.formData.objective || '';
        if (objective) {
            promptParts.push(`**Objectif Principal:**\n${objective}`);
        }
        
        // 3. Méthodologie
        const useCoT = document.getElementById('use_chain_of_thought').checked;
        const methodology = state.formData.methodology || '';
        let methodologyStr = '';
        if (useCoT) methodologyStr = "Réfléchis étape par étape. ";
        if (methodology) methodologyStr += methodology;
        if (methodologyStr.trim()) {
             promptParts.push(`**Méthodologie de Réflexion:**\n${methodologyStr}`);
        }

        // 4. Autres sections
        const context = state.formData.context || '';
        if (context) promptParts.push(`**Contexte Clé:**\n${context}`);
        const structure = state.formData.structure || '';
        if (structure) promptParts.push(`**Structure de Réponse Attendue:**\n${structure}`);
        const constraints = state.formData.constraints || '';
        if (constraints) promptParts.push(`**Contraintes:**\n${constraints}`);
        
        return promptParts.join('\n\n---\n\n');
    }

    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    const handlers = {
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
                    
                    storage.savePrompt({
                        title: (state.formData.objective || 'Nouveau Prompt Expert').substring(0, 40),
                        content: finalPrompt,
                        category: state.formData.category || 'général'
                    });
                    
                    alert('Prompt Expert créé avec succès !\n\nContenu :\n' + finalPrompt);
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
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section input, #creator-section select');
            if (wizardInput) {
                state.formData[wizardInput.id] = wizardInput.value;
            }
        }
    };

    // --- INITIALISATION ---
    function init() {
        const appContainer = document.querySelector('.app');
        if (!appContainer) return console.error("ERREUR CRITIQUE : .app introuvable.");

        appContainer.addEventListener('click', handlers.handleGlobalClick);
        appContainer.addEventListener('input', handlers.handleGlobalInput);
        
        ui.switchTab('creator');
        ui.updateStepDisplay();
        ui.updatePromptCount();
        console.log("Application initialisée. L'assistant expert est prêt et flexible.");
    }

    init();
});
