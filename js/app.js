// js/app.js (Version de test minimaliste)

// 1. Attendre que le document HTML soit entièrement chargé et prêt.
document.addEventListener('DOMContentLoaded', () => {

    // 2. Trouver notre bouton de test par son ID unique.
    const testButton = document.getElementById('mon-bouton-test');

    // 3. Vérifier si le bouton a bien été trouvé.
    if (testButton) {
        // 4. Si oui, attacher un écouteur d'événement pour le 'clic'.
        testButton.addEventListener('click', () => {
            // 5. Si le bouton est cliqué, afficher une alerte. C'est la preuve que tout fonctionne.
            alert('VICTOIRE ! La connexion entre HTML et JavaScript fonctionne !');
        });
    } else {
        // Si le bouton n'est pas trouvé, afficher une alerte d'erreur.
        alert('ERREUR CRITIQUE : Le bouton de test est introuvable dans le HTML.');
    }
});
