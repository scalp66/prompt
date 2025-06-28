// js/app.js (Étape 2 : Assistant Fonctionnel)
document.addEventListener('DOMContentLoaded', () => {

    // --- ÉTAT DE L'APPLICATION ---
    const state = {
        currentStep: 0,
        formData: {}
    };

    // --- CONSTANTES ---
    const WIZARD_STEPS = [
        { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' }, { key: 'objective', title: 'Quel est votre objectif ?' },
        { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' }, { key: 'structure', title: 'Comment structurer la réponse ?' },
        { key: 'examples', title: 'Avez-vous des exemples ?' }, { key: 'constraints', title: 'Des contraintes spécifiques ?' }
    ];
    const PREDEFINED_ROLES = {
        'expert-dev': 'Tu es un expert développeur avec 10+ ans d\'expérience...', 'consultant': 'Tu es un consultant...',
        'professeur': 'Tu es un professeur...', 'redacteur': 'Tu es un rédacteur...'
    };

    // --- ÉLÉMENTS DU DOM ---
    const appContainer = document.querySelector('.app');
    if (!appContainer) return alert("ERREUR CRITIQUE : .app introuvable.");

    // --- FONCTIONS UI ---
    const ui = {
        switchTab: (tabName) => {
            appContainer.querySelectorAll('.main-content > div').forEach(s => s.classList.add('hidden'));
            const section = document.getElementById(`${tabName}-section`);
            if (section) section.classList.remove('hidden');
            appContainer.querySelectorAll('.sidebar .nav-item').forEach(i => i.classList.toggle('active', i.dataset.tab === tabName));
        },
        updateStepDisplay: () => {
            const creatorSection = document.getElementById('creator-section');
            if (!creatorSection) return;
            
            creatorSection.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
            const currentStepEl = document.getElementById(`step-${state.currentStep}`);
            if(currentStepEl) currentStepEl.classList.remove('hidden');

            document.getElementById('step-title').textContent = WIZARD_STEPS[state.currentStep].title;
            
            creatorSection.querySelectorAll('.steps-indicator .step').forEach((el, idx) => {
                el.classList.remove('active', 'completed');
                if (idx === state.currentStep) el.classList.add('active');
                else if (idx < state.currentStep) el.classList.add('completed');
            });
            
            document.getElementById('prev-btn').classList.toggle('hidden', state.currentStep === 0);
            document.getElementById('next-btn').textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? '
