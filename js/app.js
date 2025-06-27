document.addEventListener('DOMContentLoaded', () => {

    const logDisplay = document.getElementById('log-display');
    let logCount = 0;
    const MAX_LOGS = 20;
    function logToScreen(message, type = 'info') {
        if (!logDisplay) return;
        logCount++;
        const logEntry = document.createElement('p');
        const timestamp = new Date().toLocaleTimeString();
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        logEntry.className = `log-${type}`;
        logDisplay.prepend(logEntry);
        if (logCount > MAX_LOGS) logDisplay.removeChild(logDisplay.lastChild);
    }

    logToScreen('Script chargé et DOM prêt.', 'success');

    const state = {
        currentStep: 0,
        formData: { role: '', objective: '', context: '', structure: '', examples: '', constraints: '', category: 'général' }
    };

    const WIZARD_STEPS = [
        { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' },
        { key: 'objective', title: 'Quel est votre objectif ?' },
        { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' },
        { key: 'structure', title: 'Comment structurer la réponse ?' },
        { key: 'examples', title: 'Avez-vous des exemples ?' },
        { key: 'constraints', title: 'Des contraintes spécifiques ?' }
    ];

    const dom = {
        sidebarNav: document.querySelector('.sidebar nav'),
        mainContent: document.querySelector('.main-content'),
        creatorSection: document.getElementById('creator-section'),
        stepsIndicator: document.querySelector('.steps-indicator'),
        stepTitle: document.getElementById('step-title'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
    };
    
    const ui = {
        switchTab(tabName) {
            logToScreen(`Changement vers l'onglet : ${tabName}`, 'info');
            if (dom.mainContent) {
                dom.mainContent.querySelectorAll('.main-content > div[id$="-section"]').forEach(section => section.classList.add('hidden'));
                const sectionToShow = document.getElementById(`${tabName}-section`);
                if (sectionToShow) sectionToShow.classList.remove('hidden');
                else logToScreen(`Section pour "${tabName}" non trouvée !`, 'error');
            }
            if (dom.sidebarNav) {
                dom.sidebarNav.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.tab === tabName));
            }
        },

        updateStepDisplay() {
            logToScreen(`Mise à jour de l'affichage pour l'étape ${state.currentStep}`, 'info');
            if (!dom.creatorSection) return;

            dom.creatorSection.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
            const currentStepEl = document.getElementById(`step-${state.currentStep}`);
            if(currentStepEl) currentStepEl.classList.remove('hidden');
            else logToScreen(`Contenu pour l'étape ${state.currentStep} non trouvé !`, 'error');

            if(dom.stepTitle) dom.stepTitle.textContent = WIZARD_STEPS[state.currentStep].title;
            
            if(dom.stepsIndicator) {
                dom.stepsIndicator.querySelectorAll('.step').forEach((el, idx) => {
                    el.classList.remove('active', 'completed');
                    if (idx === state.currentStep) el.classList.add('active');
                    else if (idx < state.currentStep) el.classList.add('completed');
                });
            }
            
            if(dom.prevBtn) dom.prevBtn.classList.toggle('hidden', state.currentStep === 0);
            if(dom.nextBtn) dom.nextBtn.textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        }
    };

    function handleNavClick(e) { /* ... (inchangé) ... */ }
    
    function handleWizardNav(e) {
        if (e.target === dom.nextBtn) {
            logToScreen('Bouton "Suivant" cliqué.', 'success');
            if (state.currentStep < WIZARD_STEPS.length - 1) {
                state.currentStep++;
                ui.updateStepDisplay();
            } else {
                logToScreen('Dernière étape : Création du prompt...', 'success');
                // La logique de sauvegarde sera ajoutée plus tard
            }
        } else if (e.target === dom.prevBtn) {
            logToScreen('Bouton "Précédent" cliqué.', 'success');
            if (state.currentStep > 0) {
                state.currentStep--;
                ui.updateStepDisplay();
            }
        }
    }

    function setupEventListeners() {
        logToScreen('Attachement des écouteurs...');
        if (dom.sidebarNav) {
            dom.sidebarNav.addEventListener('click', handleNavClick);
            logToScreen('Écouteur de navigation OK.', 'success');
        } else {
            logToScreen('Barre de navigation non trouvée !', 'error');
        }

        // --- NOUVEL ÉCOUTEUR POUR L'ASSISTANT ---
        if (dom.creatorSection) {
            dom.creatorSection.addEventListener('click', handleWizardNav);
            logToScreen('Écouteur de l\'assistant OK.', 'success');
        } else {
            logToScreen('Section de l\'assistant non trouvée !', 'error');
        }
    }

    function init() {
        logToScreen('Initialisation de l\'application...');
        setupEventListeners();
        ui.switchTab('creator');
        ui.updateStepDisplay(); // Assurer l'affichage de la première étape
        logToScreen('Application initialisée avec succès !', 'success');
    }

    init();
});
