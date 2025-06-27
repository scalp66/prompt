document.addEventListener('DOMContentLoaded', () => {
    console.log("Application en cours d'initialisation...");

    const state = {
        currentFolderId: 'all',
    };

    const dom = {
        app: document.querySelector('.app'),
        sidebarNav: document.querySelector('.sidebar nav'),
        mainContent: document.querySelector('.main-content'),
        promptCount: document.getElementById('prompt-count'),
        saveApiKeyBtn: document.getElementById('save-api-key-btn'),
        apiKeyInput: document.getElementById('api-key-input'),
    };
    
    const storage = {
        getApiKey: () => localStorage.getItem('user_api_key'),
        saveApiKey: (key) => localStorage.setItem('user_api_key', key),
        // ... Autres fonctions de storage que vous pourrez ajouter plus tard
    };

    const ui = {
        showToast(message, type = 'info', duration = 3000) {
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            let icon = 'ℹ️';
            if (type === 'success') icon = '✔️';
            else if (type === 'error') icon = '❌';

            toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;
            toastContainer.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 10);

            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => toast.remove());
            }, duration);
        },

        updatePromptCount() {
            // Cette fonction sera complétée quand la logique des prompts sera ajoutée
            // const count = storage.getPrompts().length;
            // dom.promptCount.textContent = `${count} prompt${count > 1 ? 's' : ''} sauvegardé${count > 1 ? 's' : ''}`;
        },

        switchTab(tabName) {
            dom.mainContent.querySelectorAll('.main-content > div').forEach(section => {
                section.classList.add('hidden');
            });
            
            const sectionToShow = document.getElementById(`${tabName}-section`);
            if (sectionToShow) {
                sectionToShow.classList.remove('hidden');
            }

            dom.sidebarNav.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.tab === tabName);
            });
        }
    };

    function handleNavClick(e) {
        const navButton = e.target.closest('.nav-item');
        if (navButton && navButton.dataset.tab) {
            ui.switchTab(navButton.dataset.tab);
        }
    }

    function handleSettingsSave() {
        const apiKey = dom.apiKeyInput.value;
        if (apiKey && apiKey.trim() !== '') {
            storage.saveApiKey(apiKey.trim());
            ui.showToast('Clé API sauvegardée !', 'success');
        } else {
            ui.showToast('Veuillez entrer une clé API.', 'error');
        }
    }

    function init() {
        if (!dom.sidebarNav || !dom.saveApiKeyBtn) {
            console.error("Erreur critique: Un ou plusieurs éléments du DOM n'ont pas été trouvés. Vérifiez les IDs dans index.html.");
            return;
        }

        dom.sidebarNav.addEventListener('click', handleNavClick);
        dom.saveApiKeyBtn.addEventListener('click', handleSettingsSave);
        
        ui.switchTab('creator');
        ui.updatePromptCount();
        
        // Charger la clé API existante pour l'afficher (optionnel, mais bon pour l'UX)
        const existingKey = storage.getApiKey();
        if (existingKey) {
            dom.apiKeyInput.placeholder = "Une clé est déjà enregistrée.";
        }
        
        console.log("Application initialisée avec succès !");
    }

    init();
});
