// js/app.js (Version la plus robuste possible)

document.addEventListener('DOMContentLoaded', () => {
    // Ce code ne s'exécutera qu'une fois que l'intégralité du DOM est garantie d'être prête.

    const testButton = document.getElementById('mon-bouton-test');

    if (testButton) {
        testButton.addEventListener('click', () => {
            alert('VICTOIRE ABSOLUE ! La base est stable.');
        });
    } else {
        alert('ERREUR SYSTÈME : Le bouton est introuvable même après DOMContentLoaded. Problème d\'environnement suspecté.');
    }
});
