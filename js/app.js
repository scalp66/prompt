// js/app.js (Retour à une base fonctionnelle simple)

document.addEventListener('DOMContentLoaded', () => {

    alert('TEST DE CHARGEMENT : Le nouveau script app.js est bien exécuté !');

    // =================================================================================
    // Fonctions de base
    // =================================================================================
    const switchTab = (tabName) => {
        // Cacher toutes les sections
        document.querySelectorAll('.main-content > div[id$="-section"]').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Afficher la bonne section
        const sectionToShow = document.getElementById(`${tabName}-section`);
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
        }

        // Mettre à jour l'état actif des boutons
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });
    };

    // =================================================================================
    // Écouteurs d'événements
    // =================================================================================
    
    // Navigation
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.tab);
        });
    });

    // =================================================================================
    // Initialisation
    // =================================================================================
    switchTab('creator'); // Afficher l'assistant par défaut
});
