// js/app.js (Version de test finale, sans DOMContentLoaded)

// Le script s'exécute immédiatement, car il est placé à la fin du body.
// Tout le HTML au-dessus est garanti d'exister.

const testButton = document.getElementById('mon-bouton-test');

if (testButton) {
    testButton.addEventListener('click', () => {
        alert('VICTOIRE FINALE ! La connexion est 100% stable.');
    });
} else {
    // Cette alerte ne devrait plus jamais apparaître avec cette méthode.
    alert('ERREUR INATTENDUE : Le bouton est toujours introuvable.');
}
