document.addEventListener('DOMContentLoaded', () => {

    const state = {
        currentStep: 0,
        formData: {},
    };

    const WIZARD_STEPS = [
        { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' }, { key: 'objective', title: 'Quel est votre objectif ?' },
        { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' }, { key: 'structure', title: 'Comment structurer la réponse ?' },
        { key: 'examples', title: 'Avez-vous des exemples ?' }, { key: 'constraints', title: 'Des contraintes spécifiques ?' }
    ];
    const PREDEFINED_ROLES = {
        'expert-dev': 'Tu es un expert développeur avec 10+ ans d\'expérience en programmation...',
        'consultant': 'Tu es un consultant en stratégie d\'entreprise...',
        'professeur': 'Tu es un professeur pédagogue...',
        'redacteur': 'Tu es un rédacteur professionnel spécialisé...'
    };

    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...promptData });
            this.savePrompts(prompts);
        },
    };

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
                if (idx === state.currentStep) el.classList.add('active'); else if (idx < state.currentStep) el.classList.add('completed');
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
            ui.updateQualityAnalyzer();
        },
        updateQualityAnalyzer: () => {
            const getPromptPreview = () => Object.values(state.formData).filter(Boolean).join('\n\n');
            const promptPreview = getPromptPreview();
            const analyzerEl = document.getElementById('quality-analyzer');
            if (!analyzerEl) return;
            analyzerEl.classList.toggle('hidden', !promptPreview);
            if (!promptPreview) return;
            const analysis = { score: 5, suggestions: [] };
            if (!/\b(tu es|vous êtes|agis comme|joue le rôle|expert|spécialiste|professionnel)\b/i.test(promptPreview)) { analysis.suggestions.push('Définissez un rôle clair pour l\'IA.'); analysis.score--; }
            if (!/\b(je veux|génère|crée|écris|analyse|explique|aide|fais|objectif)\b/i.test(promptPreview)) { analysis.suggestions.push('Précisez l\'objectif de votre demande.'); analysis.score--; }
            if (promptPreview.length < 50) { analysis.suggestions.push('Ajoutez plus de contexte.'); analysis.score--; }
            if (/\b(chose|truc|quelque chose|bien|bon)\b/i.test(promptPreview)) { analysis.suggestions.push('Remplacez les termes vagues.'); analysis.score--; }
            analysis.score = Math.max(0, analysis.score);
            const scoreCircle = document.getElementById('score-circle'), scoreLabel = document.getElementById('score-label'), suggestionsContainer = document.getElementById('suggestions-container'), suggestionsList = document.getElementById('suggestions-list');
            if(scoreCircle) scoreCircle.textContent = `${analysis.score}/5`;
            const scoreClass = ['score-poor','score-poor','score-average','score-average','score-good','score-excellent'][analysis.score];
            if(scoreCircle) scoreCircle.className = `score-circle ${scoreClass}`;
            if(scoreLabel) scoreLabel.textContent = 'Qualité : ' + ['Très Faible','Faible','Moyenne','Bonne','Très Bonne','Excellente'][analysis.score];
            if(suggestionsContainer) suggestionsContainer.classList.toggle('hidden', analysis.suggestions.length === 0);
            if(suggestionsList) {
                suggestionsList.innerHTML = '';
                analysis.suggestions.forEach(s => { const li = document.createElement('li'); li.className = 'suggestion-item'; li.textContent = s; suggestionsList.appendChild(li); });
            }
        },
    };

    const handlers = {
        handleGlobalClick(e) {
            const navButton = e.target.closest('.nav-item');
            if (navButton) { ui.switchTab(navButton.dataset.tab); return; }
            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) { state.currentStep++; ui.updateStepDisplay(); }
                else {
                    const preview = Object.values(state.formData).filter(Boolean).join('\n\n');
                    storage.savePrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: preview, category: state.formData.category || 'général' });
                    alert('Prompt créé avec succès !');
                    ui.updatePromptCount();
                    ui.resetWizardForm();
                }
                return;
            }
            if (e.target.closest('#prev-btn')) { if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); } return; }
        },
        handleGlobalInput(e) {
            const wizardInput = e.target.closest('#creator-section textarea, #creator-section select');
            if (wizardInput) {
                const id = wizardInput.id, value = wizardInput.value;
                if (['role','objective','context','structure','examples','constraints','category'].includes(id)) { state.formData[id] = value; }
                if (id === 'role-suggestions' && value) {
                    const roleText = PREDEFINED_ROLES[value];
                    const roleTextarea = document.getElementById('role');
                    if (roleTextarea) { roleTextarea.value = roleText; state.formData.role = roleText; }
                }
                ui.updateQualityAnalyzer();
            }
        }
    };

    function init() {
        const appContainer = document.querySelector('.app');
        if (!appContainer) return console.error("ERREUR CRITIQUE : .app introuvable.");
        appContainer.addEventListener('click', handlers.handleGlobalClick);
        appContainer.addEventListener('input', handlers.handleGlobalInput);
        ui.switchTab('creator');
        ui.updateStepDisplay();
        ui.updatePromptCount();
        console.log("Application initialisée. Assistant et Analyseur prêts.");
    }
    init();
});
