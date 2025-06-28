// js/app.js (Étape 1 : Assistant Complet et Fonctionnel)
document.addEventListener('DOMContentLoaded', () => {

    let currentStep = 0;
    const formData = {};
    const WIZARD_STEPS = [
        { title: 'Qui est l\'IA ? (Persona)' }, { title: 'Quel est l\'objectif final ?' },
        { title: 'Comment l\'IA doit-elle raisonner ?' }, { title: 'Quel contexte fournir ?' },
        { title: 'Quelle est la structure de la réponse ?' }, { title: 'Quelles sont les contraintes ?' }
    ];

    // --- Fonctions UI ---
    const switchTab = (tabName) => {
        document.querySelectorAll('.main-content > div').forEach(s => s.classList.add('hidden'));
        document.getElementById(`${tabName}-section`)?.classList.remove('hidden');
        document.querySelectorAll('.sidebar .nav-item').forEach(i => i.classList.toggle('active', i.dataset.tab === tabName));
    };

    const updateStepDisplay = () => {
        const creatorSection = document.getElementById('creator-section');
        creatorSection.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`step-${currentStep}`)?.classList.remove('hidden');
        document.getElementById('step-title').textContent = WIZARD_STEPS[currentStep].title;
        creatorSection.querySelectorAll('.steps-indicator .step').forEach((el, idx) => {
            el.classList.remove('active', 'completed');
            if (idx === currentStep) el.classList.add('active');
            else if (idx < currentStep) el.classList.add('completed');
        });
        document.getElementById('prev-btn').classList.toggle('hidden', currentStep === 0);
        document.getElementById('next-btn').textContent = (currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
    };

    // --- Écouteurs d'événements ---
    document.querySelector('.sidebar nav').addEventListener('click', (e) => {
        const navButton = e.target.closest('.nav-item');
        if (navButton) switchTab(navButton.dataset.tab);
    });

    const creatorSection = document.getElementById('creator-section');
    if (creatorSection) {
        // Clics sur les boutons de l'assistant
        creatorSection.addEventListener('click', (e) => {
            if (e.target.closest('#next-btn')) {
                if (currentStep < WIZARD_STEPS.length - 1) {
                    currentStep++;
                    updateStepDisplay();
                } else {
                    alert('Logique de création à implémenter.');
                }
            } else if (e.target.closest('#prev-btn')) {
                if (currentStep > 0) {
                    currentStep--;
                    updateStepDisplay();
                }
            }
        });

        // Saisie dans les champs de l'assistant
        creatorSection.addEventListener('input', (e) => {
            const inputElement = e.target.closest('input, textarea, select');
            if (inputElement) {
                formData[inputElement.id] = inputElement.type === 'checkbox' ? inputElement.checked : inputElement.value;
                console.clear();
                console.log("Données du formulaire actuelles :", formData);
            }
        });
    }

    // --- Initialisation ---
    switchTab('creator');
    updateStepDisplay();
    console.log("Application initialisée. Assistant prêt.");
});
