document.addEventListener('DOMContentLoaded', () => {

    // --- ÉTAT DE L'APPLICATION ---
    const state = {
        currentStep: 0,
        formData: {}, 
    };

    // --- CONSTANTES ---
    const WIZARD_STEPS = [ /* ... */ ];

    // --- MODULE DE STOCKAGE ---
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...promptData });
            this.savePrompts(prompts);
        },
    };

    // --- LOGIQUE MÉTIER ---
    function buildFinalPrompt() {
        let promptParts = [];
        const data = state.formData;
        const useCoT = document.getElementById('use_chain_of_thought')?.checked ?? true;

        if (data.persona_role) {
            let personaStr = `Tu es un ${data.persona_role}`;
            if (data.persona_context) personaStr += `, ${data.persona_context}`;
            if (data.persona_style) personaStr += `. Ton style est ${data.persona_style}.`;
            promptParts.push(`**Persona:**\n${personaStr}`);
        }
        if (data.objective) promptParts.push(`**Objectif Principal:**\n${data.objective}`);
        let methodologyStr = useCoT ? "Réfléchis étape par étape. " : "";
        if (data.methodology) methodologyStr += data.methodology;
        if (methodologyStr.trim()) promptParts.push(`**Méthodologie:**\n${methodologyStr}`);
        if (data.context) promptParts.push(`**Contexte:**\n${data.context}`);
        if (data.structure) promptParts.push(`**Structure de Réponse:**\n${data.structure}`);
        if (data.constraints) promptParts.push(`**Contraintes:**\n${data.constraints}`);
        return promptParts.join('\n\n---\n\n');
    }

    // --- MODULE UI ---
    const ui = {
        updatePromptCount: () => { /* ... (inchangé) ... */ },
        switchTab: (tabName) => { /* ... (inchangé) ... */ },
        updateStepDisplay: () => { /* ... (inchangé) ... */ },
        resetWizardForm: () => {
            state.currentStep = 0; state.formData = {};
            document.querySelectorAll('#creator-section input, #creator-section textarea, #creator-section select').forEach(el => {
                if (el.type === 'checkbox') el.checked = true; else el.value = '';
            });
            ui.updateStepDisplay();
            ui.updateQualityAnalyzer(); // <-- Réinitialiser aussi l'analyseur
        },

        // *** FONCTION RESTAURÉE ET CONNECTÉE ***
        updateQualityAnalyzer() {
            const promptPreview = buildFinalPrompt();
            const analyzerEl = document.getElementById('quality-analyzer');
            if (!analyzerEl) return;
            analyzerEl.classList.toggle('hidden', !promptPreview);
            if (!promptPreview) return;

            const analysis = { score: 5, suggestions: [] };
            if (!state.formData.persona_role) { analysis.suggestions.push('Définir un rôle principal améliore la spécialisation.'); analysis.score--; }
            if (!state.formData.objective) { analysis.suggestions.push('Un objectif clair est crucial pour guider l\'IA.'); analysis.score--; }
            if (promptPreview.length < 100) { analysis.suggestions.push('Un prompt plus détaillé et contextuel donne de meilleurs résultats.'); analysis.score--; }
            if (!document.getElementById('use_chain_of_thought')?.checked) { analysis.suggestions.push('Activer la "Chaîne de Pensée" améliore le raisonnement.'); }
            
            const scoreCircle = document.getElementById('score-circle');
            const scoreLabel = document.getElementById('score-label');
            const suggestionsContainer = document.getElementById('suggestions-container');
            const suggestionsList = document.getElementById('suggestions-list');

            if (scoreCircle) scoreCircle.textContent = `${analysis.score}/5`;
            const scoreClass = ['score-poor','score-poor','score-average','score-average','score-good','score-excellent'][analysis.score];
            if (scoreCircle) scoreCircle.className = `score-circle ${scoreClass}`;
            if (scoreLabel) scoreLabel.textContent = 'Qualité : ' + ['Très Faible','Faible','Moyenne','Bonne','Très Bonne','Excellente'][analysis.score];
            if (suggestionsContainer) suggestionsContainer.classList.toggle('hidden', analysis.suggestions.length === 0);
            if (suggestionsList) {
                suggestionsList.innerHTML = '';
                analysis.suggestions.forEach(s => { const li = document.createElement('li'); li.className = 'suggestion-item'; li.textContent = s; suggestionsList.appendChild(li); });
            }
        },
    };

    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    const handlers = {
        handleGlobalClick(e) {
            // --- Navigation ---
            const navButton = e.target.closest('.nav-item');
            if (navButton) { ui.switchTab(navButton.dataset.tab); return; }

            // --- Assistant ---
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
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section input, #creator-section select');
            if (wizardInput) {
                state.formData[wizardInput.id] = wizardInput.type === 'checkbox' ? wizardInput.checked : wizardInput.value;
                // --- APPEL À L'ANALYSEUR À CHAQUE SAISIE ---
                ui.updateQualityAnalyzer();
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
        console.log("Application initialisée. Assistant expert et analyseur prêts.");
    }

    init();
});
