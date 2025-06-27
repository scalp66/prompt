document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // OUTIL DE LOG - NOTRE MEILLEUR AMI
    // =================================================================================
    const logDisplay = document.getElementById('log-display');
    function logToScreen(message, type = 'info') {
        if (!logDisplay) {
            console.error("L'élément de log n'existe pas !");
            return;
        }
        const logEntry = document.createElement('p');
        const timestamp = new Date().toLocaleTimeString();
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        logEntry.className = `log-${type}`;
        logDisplay.prepend(logEntry);
        while (logDisplay.children.length > 20) {
            logDisplay.removeChild(logDisplay.lastChild);
        }
    }

    logToScreen('DOM prêt. Démarrage du script...', 'success');

    // =================================================================================
    // INITIALISATION - Étape par étape, avec des vérifications
    // =================================================================================
    try {
        // --- Étape 1 : Vérifier les éléments de navigation ---
        const sidebarNav = document.querySelector('.sidebar nav');
        const mainContent = document.querySelector('.main-content');
        
        if (!sidebarNav) {
            logToScreen('ERREUR CRITIQUE : Barre de navigation non trouvée (.sidebar nav)', 'error');
            return; // Arrête tout si la navigation est absente
        }
        if (!mainContent) {
            logToScreen('ERREUR CRITIQUE : Conteneur principal non trouvé (.main-content)', 'error');
            return;
        }
        logToScreen('Navigation principale trouvée.', 'success');

        // --- Étape 2 : Définir la logique de changement d'onglet ---
        const switchTab = (tabName) => {
            logToScreen(`Tentative de changement vers l'onglet : ${tabName}`);
            
            mainContent.querySelectorAll('.main-content > div[id$="-section"]').forEach(section => {
                section.classList.add('hidden');
            });
            const sectionToShow = document.getElementById(`${tabName}-section`);
            if (sectionToShow) {
                sectionToShow.classList.remove('hidden');
                logToScreen(`Section "${tabName}" affichée.`, 'success');
            } else {
                logToScreen(`Section "${tabName}" NON TROUVÉE !`, 'error');
            }

            sidebarNav.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.tab === tabName);
            });
        };

        // --- Étape 3 : Attacher l'écouteur de navigation ---
        sidebarNav.addEventListener('click', (e) => {
            const navButton = e.target.closest('.nav-item');
            if (navButton && navButton.dataset.tab) {
                logToScreen(`Clic détecté sur le bouton : ${navButton.dataset.tab}`, 'info');
                switchTab(navButton.dataset.tab);
            }
        });
        logToScreen('Écouteur de navigation principal attaché.', 'success');

        // --- Étape 4 : Attacher les autres écouteurs, un par un, avec vérification ---
        
        // Assistant
        const creatorSection = document.getElementById('creator-section');
        if (creatorSection) {
            const nextBtn = document.getElementById('next-btn');
            if(nextBtn) {
                nextBtn.addEventListener('click', () => {
                    logToScreen('BOUTON SUIVANT CLIQUE !', 'success');
                    // La logique viendra plus tard, on teste juste le clic.
                });
                logToScreen('Écouteur pour "Suivant" attaché.', 'success');
            } else {
                 logToScreen('Bouton "Suivant" NON TROUVÉ !', 'error');
            }
        } else {
            logToScreen('Section "creator" NON TROUVÉE !', 'error');
        }

        // Saisie Libre
        const saveFreeformBtn = document.getElementById('save-freeform-btn');
        if (saveFreeformBtn) {
            saveFreeformBtn.addEventListener('click', () => {
                 logToScreen('BOUTON SAUVEGARDER (SAISIE LIBRE) CLIQUE !', 'success');
            });
            logToScreen('Écouteur pour "Sauvegarder Saisie Libre" attaché.', 'success');
        } else {
            logToScreen('Bouton "Sauvegarder Saisie Libre" NON TROUVÉ !', 'error');
        }
        
        // Bibliothèque
        const newFolderBtn = document.getElementById('new-folder-btn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => {
                logToScreen('BOUTON NOUVEAU DOSSIER CLIQUE !', 'success');
            });
             logToScreen('Écouteur pour "Nouveau Dossier" attaché.', 'success');
        } else {
            logToScreen('Bouton "Nouveau Dossier" NON TROUVÉ !', 'error');
        }


        // --- Étape finale : Initialiser la vue ---
        switchTab('creator');
        logToScreen('Application initialisée et prête.', 'success');

    } catch (error) {
        logToScreen(`ERREUR FATALE PENDANT L'INITIALISATION : ${error.message}`, 'error');
        console.error(error);
    }
});
