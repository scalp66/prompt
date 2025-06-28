document.addEventListener('DOMContentLoaded', () => {

    // --- ÉTAT DE L'APPLICATION ---
    const state = {
        currentStep: 0,
        formData: {
            persona_role: '', persona_context: '', persona_style: '',
            objective: '', category: 'général',
            methodology: '', use_chain_of_thought: true,
            context: '', structure: '', constraints: ''
        },
    };

    // --- CONSTANTES ---
    const WIZARD_STEPS = [
        { title: 'Qui est l\'IA ? (Persona)' },
        { title: 'Quel est l\'objectif final ?' },
        { title: 'Comment l\'IA doit-elle raisonner ?' },
        { title: 'Quel contexte fournir ?' },
        { title: 'Quelle est la structure de la réponse ?' },
        { title: 'Quelles sont les contraintes ?' }
    ];

    // --- MODULE DE STOCKAGE (inchangé) ---
    const storage = { /* ... */ };

    // --- MODULE UI (avec une fonction de construction de prompt experte) ---
    const ui = {
        // ... (updatePromptCount, switchTab, updateStepDisplay, resetWizardForm - fonctions majoritairement inchangées)

        // *** LA NOUVELLE FAÇON DE CONSTRUIRE LE PROMPT ***
        getExpertPromptPreview: () => {
            let promptParts = [];

            // 1. Persona
            if (state.formData.persona_role) {
                let personaStr = `Tu es un ${state.formData.persona_role}`;
                if (state.formData.persona_context) personaStr += `, ${state.formData.persona_context}`;
                if (state.formData.persona_style) personaStr += `. Ton style de communication est ${state.formData.persona_style}.`;
                promptParts.push(`**Persona:**\n${personaStr}`);
            }

            // 2. Objectif
            if (state.formData.objective) {
                promptParts.push(`**Objectif:**\n${state.formData.objective}`);
            }
            
            // 3. Méthodologie (Chaîne de Pensée)
            let methodologyStr = '';
            if (state.formData.use_chain_of_thought) {
                methodologyStr = "Réfléchis étape par étape pour construire ta réponse. ";
            }
            if (state.formData.methodology) {
                methodologyStr += state.formData.methodology;
            }
            if (methodologyStr) {
                 promptParts.push(`**Méthodologie:**\n${methodologyStr}`);
            }

            // 4. Contexte, Structure, Contraintes
            if (state.formData.context) promptParts.push(`**Contexte:**\n${state.formData.context}`);
            if (state.formData.structure) promptParts.push(`**Structure de Réponse Attendue:**\n${state.formData.structure}`);
            if (state.formData.constraints) promptParts.push(`**Contraintes:**\n${state.formData.constraints}`);
            
            return promptParts.join('\n\n---\n\n');
        },

        updateQualityAnalyzer() {
            const promptPreview = this.getExpertPromptPreview();
            // ... (logique d'analyse mise à jour pour le nouveau format)
            const analysis = { score: 5, suggestions: [] };
            if (!state.formData.persona_role) { analysis.suggestions.push('Définir un rôle principal améliore la spécialisation.'); analysis.score--; }
            if (!state.formData.objective) { analysis.suggestions.push('Un objectif clair est crucial.'); analysis.score--; }
            if (promptPreview.length < 100) { analysis.suggestions.push('Un prompt plus détaillé donne de meilleurs résultats.'); analysis.score--; }
            if (!state.formData.use_chain_of_thought) { analysis.suggestions.push('Activer la "Chaîne de Pensée" améliore le raisonnement pour les tâches complexes.'); }
            
            // ... (le reste de la logique d'affichage de l'analyseur)
        },
    };

    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    const handlers = {
        // ... (handleGlobalClick pour la navigation)
        handleWizardNav(e) {
            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) { state.currentStep++; ui.updateStepDisplay(); }
                else {
                    const finalPrompt = ui.getExpertPromptPreview();
                    if (!finalPrompt) return alert('Impossible de créer un prompt vide.');
                    storage.savePrompt({
                        title: (state.formData.objective || 'Nouveau Prompt Expert').substring(0, 40),
                        content: finalPrompt,
                        category: state.formData.category || 'général'
                    });
                    alert('Prompt Expert créé avec succès !');
                    ui.resetWizardForm();
                    ui.updatePromptCount();
                }
            }
            // ... (logique de prev-btn)
        },
        handleGlobalInput(e) {
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section input, #creator-section select');
            if (wizardInput) {
                const id = wizardInput.id;
                const value = wizardInput.type === 'checkbox' ? wizardInput.checked : wizardInput.value;
                
                if (state.formData.hasOwnProperty(id)) {
                    state.formData[id] = value;
                }
                
                // Cas spécial pour la checkbox qui n'est pas dans formData directement
                if (id === 'chain-of-thought-checkbox') {
                    state.formData.use_chain_of_thought = value;
                }
                
                ui.updateQualityAnalyzer();
            }
        }
    };

    // --- INITIALISATION ---
    function init() {
        // ... (code d'initialisation)
    }
    
    init();
});
