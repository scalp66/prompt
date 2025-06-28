document.addEventListener('DOMContentLoaded', () => {

    // On s'assure que le conteneur principal existe
    const appContainer = document.querySelector('.app');
    if (!appContainer) {
        console.error("ERREUR CRITIQUE : Le conteneur .app est introuvable.");
        return;
    }

    // Fonction pour changer d'onglet
    const switchTab = (tabName) => {
        // Cacher toutes les sections
        appContainer.querySelectorAll('.main-content > div').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Afficher la bonne section
        const sectionToShow = document.getElementById(`${tabName}-section`);
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
        }

        // Mettre à jour l'état actif des boutons
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
            alert(`Navigation vers ${navButton.dataset.tab} OK !`); // Alerte de confirmation
        }
    });

    // Initialisation
    switchTab('creator'); // Afficher le premier onglet au démarrage
    alert("Application initialisée. La navigation est prête.");
});
