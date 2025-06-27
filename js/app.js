document.addEventListener('DOMContentLoaded', () => {

    // --- OUTIL DE LOG ---
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
        
        logDisplay.prepend(logEntry); // Ajoute en haut (grâce au CSS, il s'affichera en bas)

        // Limite le nombre d'entrées dans le DOM
        if (logCount > MAX_LOGS) {
            logDisplay.removeChild(logDisplay.lastChild);
        }
    }
    // --- FIN DE L'OUTIL DE LOG ---

    logToScreen('Script chargé et DOM prêt.', 'success');

    const dom = {
        sidebarNav: document.querySelector('.sidebar nav'),
        mainContent: document.querySelector('.main-content'),
    };

    const ui = {
        switchTab(tabName) {
            logToScreen(`Changement vers l'onglet : ${tabName}`, 'info');
            
            if (dom.mainContent) {
                dom.mainContent.querySelectorAll('.main-content > div[id$="-section"]').forEach(section => {
                    section.classList.add('hidden');
                });
                const sectionToShow = document.getElementById(`${tabName}-section`);
                if (sectionToShow) {
                    sectionToShow.classList.remove('hidden');
                } else {
                    logToScreen(`Section pour l'onglet "${tabName}" non trouvée !`, 'error');
                }
            }

            if (dom.sidebarNav) {
                dom.sidebarNav.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.tab === tabName);
                });
            }
        }
    };

    function handleNavClick(e) {
        const navButton = e.target.closest('.nav-item');
        if (navButton && navButton.dataset.tab) {
            ui.switchTab(navButton.dataset.tab);
        }
    }

    function setupEventListeners() {
        logToScreen('Attachement des écouteurs d\'événements...');
        if (dom.sidebarNav) {
            dom.sidebarNav.addEventListener('click', handleNavClick);
            logToScreen('Écouteur de navigation attaché.', 'success');
        } else {
            logToScreen('Barre de navigation non trouvée !', 'error');
        }
    }

    function init() {
        logToScreen('Initialisation de l\'application...');
        setupEventListeners();
        ui.switchTab('creator'); // Onglet par défaut
        logToScreen('Application initialisée avec succès !', 'success');
    }

    init();
});
