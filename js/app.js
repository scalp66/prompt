document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // ÉTAT CENTRALISÉ
    // =================================================================================
    const state = {
        currentStep: 0,
        formData: {},
        currentFolderId: 'all',
        editingPromptId: null,
    };

    // =================================================================================
    // CONSTANTES ET CONFIGURATION
    // =================================================================================
    const WIZARD_STEPS = [ /* ... */ ];
    const PREDEFINED_ROLES = { /* ... */ };
    
    // =================================================================================
    // MODULE DE STOCKAGE (localStorage) - INCHANGÉ
    // =================================================================================
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        getFolders: () => JSON.parse(localStorage.getItem('prompt_folders')) || [],
        saveFolders: (folders) => localStorage.setItem('prompt_folders', JSON.stringify(folders)),
        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), folderId: null, versions: [], ...promptData });
            this.savePrompts(prompts);
        },
        deletePrompt(id) {
            this.savePrompts(this.getPrompts().filter(p => p.id !== id));
        },
        saveFolder(folderName) {
            const folders = this.getFolders();
            folders.push({ id: Date.now().toString(), name: folderName });
            this.saveFolders(folders);
        },
        deleteFolder(folderId) {
            this.saveFolders(this.getFolders().filter(f => f.id !== folderId));
            const prompts = this.getPrompts().map(p => { if (p.folderId === folderId) p.folderId = null; return p; });
            this.savePrompts(prompts);
        },
        updatePrompt(promptId, updatedData) {
            let prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index === -1) return;
            prompts[index] = { ...prompts[index], ...updatedData, updatedAt: new Date().toISOString() };
            this.savePrompts(prompts);
        },
        updatePromptFolder(promptId, folderId) {
            const prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index > -1) { prompts[index].folderId = folderId === 'null' ? null : folderId; this.savePrompts(prompts); }
        },
    };

    // =================================================================================
    // MODULE UI (AVEC LES FONCTIONS DE RENDU DE LA BIBLIOTHÈQUE)
    // =================================================================================
    const ui = {
        updatePromptCount: () => { document.getElementById('prompt-count').textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`; },
        switchTab: (tabName) => {
            document.querySelectorAll('.main-content > div[id$="-section"]').forEach(s => s.classList.add('hidden'));
            document.getElementById(`${tabName}-section`)?.classList.remove('hidden');
            document.querySelectorAll('.sidebar .nav-item').forEach(item => item.classList.toggle('active', item.dataset.tab === tabName));
            if (tabName === 'library') { ui.renderFolders(); ui.renderPromptLibrary(); }
            if (tabName === 'freeform') { ui.resetFreeformForm(); }
        },
        updateStepDisplay: () => { /* ... (inchangé) ... */ },
        resetWizardForm: () => { /* ... (inchangé) ... */ },
        resetFreeformForm: () => {
            document.getElementById('freeform-prompt-content').value = '';
            document.getElementById('freeform-prompt-title').value = '';
            document.getElementById('freeform-prompt-category').value = 'général';
            document.getElementById('save-freeform-btn').textContent = 'Sauvegarder le Prompt';
            state.editingPromptId = null;
        },

        // *** FONCTION RESTAURÉE ***
        renderFolders() {
            const folderList = document.getElementById('folder-list');
            const folders = storage.getFolders();
            folderList.innerHTML = `<li class="folder-item ${state.currentFolderId === 'all' ? 'active' : ''}" data-id="all">Tous les prompts</li><li class="folder-item ${state.currentFolderId === 'uncategorized' ? 'active' : ''}" data-id="uncategorized">Non classés</li>`;
            folders.forEach(folder => {
                folderList.innerHTML += `<li class="folder-item ${state.currentFolderId === folder.id ? 'active' : ''}" data-id="${folder.id}"><span>${folder.name}</span><button class="delete-folder-btn" data-id="${folder.id}">×</button></li>`;
            });
        },

        // *** FONCTION RESTAURÉE ***
        renderPromptLibrary() {
            const promptListContainer = document.getElementById('prompt-library-list');
            let prompts = storage.getPrompts();
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const sortValue = document.getElementById('sort-select').value;

            // 1. Filtrage
            if (state.currentFolderId === 'uncategorized') prompts = prompts.filter(p => !p.folderId);
            else if (state.currentFolderId !== 'all') prompts = prompts.filter(p => p.folderId === state.currentFolderId);
            if (searchTerm) prompts = prompts.filter(p => (p.title.toLowerCase() + p.content.toLowerCase()).includes(searchTerm));
            
            // 2. Tri
            prompts.sort((a, b) => {
                switch (sortValue) {
                    case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'title-asc': return a.title.localeCompare(b.title);
                    case 'title-desc': return b.title.localeCompare(a.title);
                    default: return new Date(b.createdAt) - new Date(a.createdAt);
                }
            });

            // 3. Rendu
            promptListContainer.innerHTML = prompts.length === 0 ? '<p style="text-align: center; color: #64748b; padding: 40px 0;">Aucun prompt trouvé.</p>' : '';
            prompts.forEach(p => {
                const card = document.createElement('div');
                card.className = 'prompt-card';
                card.dataset.id = p.id;
                const folderOptions = storage.getFolders().map(f => `<option value="${f.id}" ${p.folderId === f.id ? 'selected' : ''}>${f.name}</option>`).join('');
                const selectHTML = `<select class="form-select btn-sm" data-action="move"><option value="null" ${!p.folderId ? 'selected' : ''}>Non classé</option>${folderOptions}</select>`;
                card.innerHTML = `<div class="prompt-card-header"><h4 class="prompt-card-title">${p.title}</h4><span class="prompt-card-category">${p.category}</span></div><p class="prompt-card-content">${p.content}</p><div class="prompt-card-footer"><small class="prompt-card-date">Modifié : ${new Date(p.updatedAt).toLocaleDateString('fr-FR')}</small><div class="prompt-card-actions">${selectHTML}<button class="btn btn-secondary btn-sm" data-action="edit">Modifier</button><button class="btn btn-secondary btn-sm" data-action="copy">Copier</button><button class="btn btn-secondary btn-sm" data-action="delete" style="background-color:#fee2e2;color:#ef4444;">Supprimer</button></div></div>`;
                promptListContainer.appendChild(card);
            });
        },
    };

    // =================================================================================
    // INITIALISATION
    // =================================================================================
    function init() {
        // --- ÉCOUTEUR DE CLICS GLOBAL (pour les boutons) ---
        document.body.addEventListener('click', (e) => {
            
            // --- Navigation ---
            const navButton = e.target.closest('.nav-item');
            if (navButton) { ui.switchTab(navButton.dataset.tab); return; }

            // --- Assistant ---
            if (e.target.closest('#next-btn')) { /* ... (logique inchangée) ... */ return; }
            if (e.target.closest('#prev-btn')) { /* ... (logique inchangée) ... */ return; }

            // --- Saisie Libre ---
            if (e.target.closest('#save-freeform-btn')) {
                const content = document.getElementById('freeform-prompt-content').value.trim();
                let title = document.getElementById('freeform-prompt-title').value.trim();
                if (!content) return alert('Le contenu ne peut pas être vide.');
                if (!title) title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
                
                if (state.editingPromptId) {
                    storage.updatePrompt(state.editingPromptId, { title, content, category: document.getElementById('freeform-prompt-category').value });
                    alert('Prompt mis à jour !');
                } else {
                    storage.savePrompt({ title, content, category: document.getElementById('freeform-prompt-category').value });
                    alert('Prompt sauvegardé !');
                }
                ui.updatePromptCount();
                ui.switchTab('library');
                return;
            }

            // --- Bibliothèque ---
            if (e.target.closest('#new-folder-btn')) {
                const name = prompt('Nom du nouveau dossier:');
                if (name && name.trim()) { storage.saveFolder(name.trim()); ui.renderFolders(); }
                return;
            }
            const cardAction = e.target.closest('.prompt-card [data-action]');
            if (cardAction) {
                const action = cardAction.dataset.action;
                const promptId = cardAction.closest('.prompt-card').dataset.id;
                if(action === 'delete') {
                    if(confirm('Supprimer ce prompt ?')) { storage.deletePrompt(promptId); ui.renderPromptLibrary(); }
                } else if(action === 'edit') {
                    state.editingPromptId = promptId;
                    const p = storage.getPrompts().find(p => p.id === promptId);
                    ui.switchTab('freeform');
                    document.getElementById('freeform-prompt-content').value = p.content;
                    document.getElementById('freeform-prompt-title').value = p.title;
                    document.getElementById('freeform-prompt-category').value = p.category;
                    document.getElementById('save-freeform-btn').textContent = 'Mettre à jour le Prompt';
                } else if(action === 'copy') {
                    const p = storage.getPrompts().find(p => p.id === promptId);
                    if(p) navigator.clipboard.writeText(p.content);
                }
            }
            const folderItem = e.target.closest('.folder-item');
            if (folderItem) {
                const folderId = folderItem.dataset.id;
                const delBtn = e.target.closest('.delete-folder-btn');
                if (delBtn) {
                    e.stopPropagation();
                    if (confirm('Supprimer le dossier ? (Les prompts ne seront pas affectés)')) {
                        storage.deleteFolder(folderId);
                        state.currentFolderId = 'all';
                        ui.renderFolders();
                        ui.renderPromptLibrary();
                    }
                } else {
                    state.currentFolderId = folderId;
                    ui.renderFolders();
                    ui.renderPromptLibrary();
                }
            }
        });

        // --- ÉCOUTEUR DE CHANGEMENTS GLOBAL (pour les select et input) ---
        document.body.addEventListener('input', (e) => {
            // ... (logique de saisie de l'assistant inchangée) ...
            if (e.target.closest('#search-input, #sort-select')) {
                ui.renderPromptLibrary();
            }
            const moveSelect = e.target.closest('[data-action="move"]');
            if(moveSelect) {
                const promptId = moveSelect.closest('.prompt-card').dataset.id;
                storage.updatePromptFolder(promptId, moveSelect.value);
                if(state.currentFolderId !== 'all') ui.renderPromptLibrary();
            }
        });
        
        // --- Démarrage de l'application ---
        ui.switchTab('creator');
        ui.updatePromptCount();
    }

    init();
});
