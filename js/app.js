// js/app.js (Étape 1 : Navigation Robuste)
document.addEventListener('DOMContentLoaded', () => {

    const appContainer = document.querySelector('.app');
    if (!appContainer) {
        alert("ERREUR CRITIQUE : Le conteneur .app est introuvable.");
        return;
    }

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

    const sidebarNav = appContainer.querySelector('.sidebar nav');
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (e) => {
            const navButton = e.target.closest('.nav-item');
            if (navButton && navButton.dataset.tab) {
                switchTab(navButton.dataset.tab);
            }
        });
    }

    // Initialisation
    switchTab('creator');
    console.log("Application initialisée. La navigation est prête.");
});
