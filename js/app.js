document.addEventListener('DOMContentLoaded', () => {

    const state = {
        currentStep: 0,
        formData: { persona_role: '', persona_context: '', persona_style: '', objective: '', category: 'général', methodology: '', use_chain_of_thought: true, context: '', structure: '', constraints: '' },
    };
    const WIZARD_STEPS = [ { title: 'Qui est l\'IA ? (Persona)' }, { title: 'Quel est l\'objectif final ?' }, { title: 'Comment l\'IA doit-elle raisonner ?' }, { title: 'Quel contexte fournir ?' }, { title: 'Quelle est la structure de la réponse ?' }, { title: 'Quelles sont les contraintes ?' } ];
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [], savePrompts: (p) => localStorage.setItem('prompts', JSON.stringify(p)),
        savePrompt(d) { const p = this.getPrompts(); p.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...d }); this.savePrompts(p); },
    };

    function buildFinalPrompt() { /* ... (logique inchangée, pour construire le prompt) ... */ }

    const ui = {
        updatePromptCount: () => { /* ... */ },
        switchTab: (tabName) => { /* ... */ },
        updateStepDisplay: () => { /* ... */ },
        resetWizardForm: () => {
            state.currentStep = 0; state.formData = { persona_role: '', persona_context: '', persona_style: '', objective: '', category: 'général', methodology: '', use_chain_of_thought: true, context: '', structure: '', constraints: '' };
            document.querySelectorAll('#creator-section input[type="text"], #creator-section textarea, #creator-section select').forEach(el => el.value = '');
            const checkbox = document.getElementById('use_chain_of_thought'); if(checkbox) checkbox.checked = true;
            ui.updateStepDisplay();
            ui.updateQualityAnalyzer();
        },
        
        // *** FONCTION D'ANALYSE ENTIÈREMENT RÉÉCRITE ***
        updateQualityAnalyzer() {
            const analyzerEl = document.getElementById('quality-analyzer');
            if (!analyzerEl) return;

            let score = 0;
            const suggestions = [];
            const data = state.formData;

            // 1. Analyse du Persona (3 points)
            if (data.persona_role) score += 1;
            if (data.persona_context) score += 1;
            if (data.persona_style) score += 1;
            if (score < 2) suggestions.push("Détaillez le Persona (rôle, contexte, style) pour une IA plus spécialisée.");

            // 2. Analyse de l'Objectif (2 points)
            if (data.objective) {
                score += 1;
                if (data.objective.length > 50) score += 1; // Un objectif détaillé est un bon signe
                else suggestions.push("Un objectif plus spécifique et détaillé améliore la précision.");
            } else {
                suggestions.push("L'Objectif est la partie la plus critique. Il doit être clair.");
            }

            // 3. Méthodologie & CoT (2 points)
            if (document.getElementById('use_chain_of_thought')?.checked) score += 1;
            if (data.methodology) score += 1;
            if (!document.getElementById('use_chain_of_thought')?.checked) suggestions.push("Cochez 'Réfléchis étape par étape' pour les tâches complexes.");
            
            // 4. Contexte, Structure, Contraintes (3 points)
            if (data.context) score += 1;
            if (data.structure) score += 1;
            if (data.constraints) score += 1;
            if (!data.context) suggestions.push("Fournissez un contexte pour éviter les réponses génériques.");
            if (!data.constraints) suggestions.push("Ajoutez des contraintes (Ex: 'NE PAS...') pour affiner le résultat.");

            const hasContent = Object.values(data).some(v => typeof v === 'string' && v.length > 0);
            analyzerEl.classList.toggle('hidden', !hasContent);
            if (!hasContent) return;

            const scoreCircle = document.getElementById('score-circle');
            const scoreLabel = document.getElementById('score-label');
            const suggestionsList = document.getElementById('suggestions-list');
            const suggestionsContainer = document.getElementById('suggestions-container');

            if (scoreCircle) scoreCircle.textContent = `${score}/10`;
            const scoreClass = score < 4 ? 'score-poor' : score < 7 ? 'score-average' : 'score-good';
            if (scoreCircle) scoreCircle.className = `score-circle ${scoreClass}`;
            if (scoreLabel) scoreLabel.textContent = score < 4 ? 'Qualité : Basique' : score < 7 ? 'Qualité : Efficace' : 'Qualité : Experte';
            
            if (suggestionsContainer) suggestionsContainer.classList.toggle('hidden', suggestions.length === 0);
            if (suggestionsList) {
                suggestionsList.innerHTML = '';
                suggestions.forEach(s => { const li = document.createElement('li'); li.className = 'suggestion-item'; li.textContent = s; suggestionsList.appendChild(li); });
            }
        },
    };

    const handlers = {
        handleGlobalClick(e) {
            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) { state.currentStep++; ui.updateStepDisplay(); }
                else {
                    const finalPrompt = buildFinalPrompt();
                    if (!finalPrompt) return alert('Impossible de créer un prompt vide.');
                    storage.savePrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: finalPrompt, category: state.formData.category });
                    alert('Prompt Expert créé !'); ui.updatePromptCount(); ui.resetWizardForm();
                }
            } else if (e.target.closest('#prev-btn')) {
                if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); }
            } else if (e.target.closest('.nav-item')) {
                ui.switchTab(e.target.closest('.nav-item').dataset.tab);
            }
        },
        handleGlobalInput(e) {
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section input, #creator-section select');
            if (wizardInput) {
                const id = wizardInput.id;
                const value = wizardInput.type === 'checkbox' ? wizardInput.checked : wizardInput.value;
                if (state.formData.hasOwnProperty(id)) { state.formData[id] = value; }
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
        ui.updateQualityAnalyzer();
    }
    
    init();
});
