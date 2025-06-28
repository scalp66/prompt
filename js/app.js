// js/app.js (Étape 1 : Navigation)

// Le script s'exécute quand le HTML au-dessus est prêt.
const appContainer = document.querySelector('.app');

if (!appContainer) {
    alert("ERREUR CRITIQUE : Le conteneur .app est introuvable.");
} else {
    // Fonction pour changer d'onglet
    const switchTab = (tabName) => {
        appContainer.querySelectorAll('.main-content > div').forEach(section => {
            section.classList.add('hidden');
        });
        const sectionToShow = document.getElementById(`${tabName}-section`);
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
        }
        appContainer.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });
    };

    // Écouteur de clic global sur le conteneur de l'application
    appContainer.addEventListener('click', (e) => {
        // Délégation pour la navigation
        const navButton = e.target.closest('.nav-item');
        if (navButton && navButton.dataset.tab) {
            switchTab(navButton.dataset.tab);
        }
    });

    // Initialisation
    switchTab('creator'); // Afficher le premier onglet au démarrage
    console.log("Application initialisée. La navigation est prête.");
}
