document.addEventListener('DOMContentLoaded', () => {

    // --- ÉTAT GLOBAL, CONSTANTES, STORAGE, LOGIC (Tous inchangés) ---
    const state = { /* ... */ }; const WIZARD_STEPS = [ /* ... */ ];
    const storage = { /* ... */ }; const logic = { /* ... */ };

    // =================================================================================
    // MODULE UI (AVEC LES FONCTIONS DE LA MODALE)
    // =================================================================================
    const ui = {
        // ... (toutes les fonctions UI précédentes : showToast, updatePromptCount, etc.)

        // *** NOUVELLES FONCTIONS POUR LA MODALE ***
        openPromptModal(promptId) {
            const prompt = storage.getPrompts().find(p => p.id === promptId);
            if (!prompt) return;

            const modal = document.getElementById('prompt-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');

            if (modal && modalTitle && modalBody) {
                modalTitle.textContent = prompt.title;
                modalBody.textContent = prompt.content; // Utiliser textContent pour la sécurité
                modal.classList.remove('hidden');
            }
        },
        closePromptModal() {
            const modal = document.getElementById('prompt-modal');
            if (modal) modal.classList.add('hidden');
        },
    };

    // =================================================================================
    // GESTIONNAIRES D'ÉVÉNEMENTS (HANDLERS)
    // =================================================================================
    const handlers = {
        init() {
            const app = document.querySelector('.app'); if (!app) return;
            app.addEventListener('click', handlers.globalClickHandler);
            // ... (autres écouteurs)
            
            // *** ÉCOUTEURS SPÉCIFIQUES À LA MODALE ***
            const modal = document.getElementById('prompt-modal');
            if(modal) {
                modal.addEventListener('click', (e) => {
                    // Fermer si on clique sur le fond sombre ou sur le bouton de fermeture
                    if (e.target.id === 'prompt-modal' || e.target.closest('#modal-close-btn')) {
                        ui.closePromptModal();
                    }
                });
            }
        },

        globalClickHandler(e) {
            // ... (toute la logique de clic existante : nav, wizard, etc.)

            // *** LOGIQUE DE CLIC MODIFIÉE POUR LA BIBLIOTHÈQUE ***
            const card = e.target.closest('.prompt-card');
            if (card) {
                const cardAction = e.target.closest('[data-action]');
                // Si on a cliqué sur un bouton d'action (edit, delete, copy, move)
                if (cardAction) {
                    const action = cardAction.dataset.action;
                    const id = card.dataset.id;
                    if (action==='delete'){if(confirm('Supprimer?')){logic.deletePrompt(id);ui.renderPromptLibrary();}}
                    else if (action==='edit'){ state.editingPromptId=id; const p=storage.getPrompts().find(p=>p.id===id); ui.switchTab('freeform'); document.getElementById('freeform-prompt-title').value=p.title; document.getElementById('freeform-prompt-content').value=p.content; document.getElementById('freeform-prompt-category').value=p.category; document.getElementById('save-freeform-btn').textContent='Mettre à jour';}
                    else if (action==='copy'){const p=storage.getPrompts().find(p=>p.id===id);if(p)navigator.clipboard.writeText(p.content).then(()=>ui.showToast('Copié!','success'));}
                } else {
                    // Sinon, si on clique sur la carte elle-même, on ouvre la modale
                    ui.openPromptModal(card.dataset.id);
                }
            }
        },
        // ... (autres handlers)
    };
    
    // Démarrage de l'application
    handlers.init();
});
