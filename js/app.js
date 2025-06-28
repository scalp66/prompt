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
    const WIZARD_STEPS = [
        { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' }, { key: 'objective', title: 'Quel est votre objectif ?' },
        { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' }, { key: 'structure', title: 'Comment structurer la réponse ?' },
        { key: 'examples', title: 'Avez-vous des exemples ?' }, { key: 'constraints', title: 'Des contraintes spécifiques ?' }
    ];
    const PREDEFINED_ROLES = {
        'expert-dev': 'Tu es un expert développeur avec 10+ ans d\'expérience en programmation. Tu maîtrises les bonnes pratiques, l\'architecture logicielle et l\'optimisation de code.',
        'consultant': 'Tu es un consultant en stratégie d\'entreprise avec une expertise en transformation digitale et amélioration des processus.',
        'professeur': 'Tu es un professeur pédagogue qui sait expliquer des concepts complexes de manière simple et accessible, avec des exemples concrets.',
        'redacteur': 'Tu es un rédacteur professionnel spécialisé dans la création de contenu engageant, optimisé SEO et adapté à différents publics.'
    };
    
    // =================================================================================
    // MODULE DE STOCKAGE (localStorage)
    // =================================================================================
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        getFolders: () => JSON.parse(localStorage.getItem('prompt_folders')) || [],
        saveFolders: (folders) => localStorage.setItem('prompt_folders', JSON.stringify(folders)),
        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), folderId: null, ...promptData });
            this.savePrompts(prompts);
        },
        updatePrompt(promptId, updatedData) {
            let prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index === -1) return;
            prompts[index] = { ...prompts[index], ...updatedData, updatedAt: new Date().toISOString() };
            this.savePrompts(prompts);
        },
        deletePrompt(id) { this.savePrompts(this.getPrompts().filter(p => p.id !== id)); },
        saveFolder(folderName) { const folders = this.getFolders(); folders.push({ id: Date.now().toString(), name: folderName }); this.saveFolders(folders); },
        deleteFolder(folderId) {
            this.saveFolders(this.getFolders().filter(f => f.id !== folderId));
            const prompts = this.getPrompts().map(p => { if (p.folderId === folderId) p.folderId = null; return p; });
            this.savePrompts(prompts);
        },
        updatePromptFolder(promptId, folderId) {
            const prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index > -1) { prompts[index].folderId = folderId === 'null' ? null : folderId; this.savePrompts(prompts); }
        },
    };

    // =================================================================================
    // MODULE UI (Manipulation du DOM)
    // =================================================================================
    const ui = {
        showToast(message, type = 'info', duration = 3000) {
            const toastContainer = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            let icon = 'ℹ️'; if (type === 'success') icon = '✔️'; if (type === 'error') icon = '❌';
            toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;
            toastContainer.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove()); }, duration);
        },
        updatePromptCount: () => { document.getElementById('prompt-count').textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`; },
        switchTab: (tabName) => {
            document.querySelectorAll('.main-content > div[id$="-section"]').forEach(s => s.classList.add('hidden'));
            document.getElementById(`${tabName}-section`)?.classList.remove('hidden');
            document.querySelectorAll('.sidebar .nav-item').forEach(item => item.classList.toggle('active', item.dataset.tab === tabName));
            if (tabName === 'library') { ui.renderFolders(); ui.renderPromptLibrary(); }
            if (tabName === 'freeform') { ui.resetFreeformForm(); }
        },
        updateStepDisplay: () => {
            document.querySelectorAll('#creator-section .step-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`step-${state.currentStep}`)?.classList.remove('hidden');
            document.getElementById('step-title').textContent = WIZARD_STEPS[state.currentStep].title;
            document.querySelectorAll('.steps-indicator .step').forEach((el, idx) => {
                el.classList.remove('active', 'completed');
                if (idx === state.currentStep) el.classList.add('active'); else if (idx < state.currentStep) el.classList.add('completed');
            });
            document.getElementById('prev-btn').classList.toggle('hidden', state.currentStep === 0);
            document.getElementById('next-btn').textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        },
        resetWizardForm: () => {
            state.currentStep = 0; state.formData = {};
            ['role', 'objective', 'context', 'structure', 'examples', 'constraints', 'category', 'role-suggestions'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });
            ui.updateStepDisplay();
        },
        resetFreeformForm: () => {
            document.getElementById('freeform-prompt-content').value = '';
            document.getElementById('freeform-prompt-title').value = '';
            document.getElementById('freeform-prompt-category').value = 'général';
            document.getElementById('save-freeform-btn').textContent = 'Sauvegarder le Prompt';
            state.editingPromptId = null;
        },
        renderFolders() {
            const folderList = document.getElementById('folder-list');
            const folders = storage.getFolders();
            folderList.innerHTML = `<li class="folder-item ${state.currentFolderId === 'all' ? 'active' : ''}" data-id="all">Tous les prompts</li><li class="folder-item ${state.currentFolderId === 'uncategorized' ? 'active' : ''}" data-id="uncategorized">Non classés</li>`;
            folders.forEach(folder => { folderList.innerHTML += `<li class="folder-item ${state.currentFolderId === folder.id ? 'active' : ''}" data-id="${folder.id}"><span>${folder.name}</span><button class="delete-folder-btn" data-id="${folder.id}">×</button></li>`; });
        },
        renderPromptLibrary() {
            const promptListContainer = document.getElementById('prompt-library-list');
            let prompts = storage.getPrompts();
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const sortValue = document.getElementById('sort-select').value;
            if (state.currentFolderId === 'uncategorized') prompts = prompts.filter(p => !p.folderId);
            else if (state.currentFolderId !== 'all') prompts = prompts.filter(p => p.folderId === state.currentFolderId);
            if (searchTerm) prompts = prompts.filter(p => (p.title.toLowerCase() + p.content.toLowerCase()).includes(searchTerm));
            prompts.sort((a,b)=>{ switch (sortValue) { case 'oldest': return new Date(a.createdAt)-new Date(b.createdAt); case 'title-asc': return a.title.localeCompare(b.title); case 'title-desc': return b.title.localeCompare(a.title); default: return new Date(b.createdAt)-new Date(a.createdAt); } });
            promptListContainer.innerHTML = prompts.length === 0 ? '<p style="text-align: center; color: #64748b; padding: 40px 0;">Aucun prompt trouvé.</p>' : '';
            prompts.forEach(p => {
                const card = document.createElement('div'); card.className = 'prompt-card'; card.dataset.id = p.id;
                const folderOptions = storage.getFolders().map(f => `<option value="${f.id}" ${p.folderId === f.id ? 'selected' : ''}>${f.name}</option>`).join('');
                const selectHTML = `<select class="form-select btn-sm" data-action="move"><option value="null" ${!p.folderId ? 'selected' : ''}>Non classé</option>${folderOptions}</select>`;
                card.innerHTML = `<div class="prompt-card-header"><h4 class="prompt-card-title">${p.title}</h4><span class="prompt-card-category">${p.category}</span></div><p class="prompt-card-content">${p.content}</p><div class="prompt-card-footer"><small class="prompt-card-date">Modifié : ${new Date(p.updatedAt).toLocaleDateString('fr-FR')}</small><div class="prompt-card-actions">${selectHTML}<button class="btn btn-secondary btn-sm" data-action="edit">Modifier</button><button class="btn btn-secondary btn-sm" data-action="copy">Copier</button><button class="btn btn-secondary btn-sm" data-action="delete" style="background-color:#fee2e2;color:#ef4444;">Supprimer</button></div></div>`;
                promptListContainer.appendChild(card);
            });
        },
    };

    // =================================================================================
    // GESTIONNAIRES D'ÉVÉNEMENTS (HANDLERS)
    // =================================================================================
    const handlers = {
        handleNavClick(e) {
            const navButton = e.target.closest('.nav-item');
            if (navButton) ui.switchTab(navButton.dataset.tab);
        },
        handleWizardNav(e) {
            const getPromptPreview = () => [state.formData.role, state.formData.objective, state.formData.context, state.formData.structure, state.formData.examples, state.formData.constraints].filter(Boolean).join('\n\n');
            if (e.target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) { state.currentStep++; ui.updateStepDisplay(); }
                else { storage.savePrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: getPromptPreview(), category: state.formData.category || 'général' }); ui.showToast('Prompt créé !', 'success'); ui.resetWizardForm(); ui.updatePromptCount(); }
            } else if (e.target.closest('#prev-btn')) {
                if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); }
            }
        },
        handleWizardInput(e) {
            const target = e.target;
            if (target.id in state.formData) state.formData[target.id] = target.value;
            if (target.id === 'role-suggestions' && target.value) { const roleText = PREDEFINED_ROLES[target.value]; document.getElementById('role').value = roleText; state.formData.role = roleText; }
        },
        handleFreeformSave() {
            const content = document.getElementById('freeform-prompt-content').value.trim();
            let title = document.getElementById('freeform-prompt-title').value.trim();
            if (!content) return ui.showToast('Le contenu ne peut pas être vide.', 'error');
            if (!title) title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
            
            const promptData = { title, content, category: document.getElementById('freeform-prompt-category').value };
            if (state.editingPromptId) { storage.updatePrompt(state.editingPromptId, promptData); ui.showToast('Prompt mis à jour !', 'success'); }
            else { storage.savePrompt(promptData); ui.showToast('Prompt sauvegardé !', 'success'); }
            ui.updatePromptCount();
            ui.switchTab('library');
        },
        handleLibraryClick(e) {
            const cardAction = e.target.closest('.prompt-card [data-action]');
            if (cardAction) {
                const action = cardAction.dataset.action;
                const promptId = cardAction.closest('.prompt-card').dataset.id;
                if(action === 'delete') { if(confirm('Supprimer ce prompt ?')) { storage.deletePrompt(promptId); ui.renderPromptLibrary(); ui.showToast('Prompt supprimé.', 'info'); }}
                else if(action === 'edit') {
                    state.editingPromptId = promptId;
                    const p = storage.getPrompts().find(p => p.id === promptId);
                    ui.switchTab('freeform');
                    document.getElementById('freeform-prompt-content').value = p.content;
                    document.getElementById('freeform-prompt-title').value = p.title;
                    document.getElementById('freeform-prompt-category').value = p.category;
                    document.getElementById('save-freeform-btn').textContent = 'Mettre à jour le Prompt';
                } else if(action === 'copy') {
                    const p = storage.getPrompts().find(p => p.id === promptId);
                    if(p) navigator.clipboard.writeText(p.content).then(() => ui.showToast('Copié !', 'success'));
                }
            }
        },
        handleFolderClick(e) {
            const folderItem = e.target.closest('.folder-item');
            if (folderItem) {
                const folderId = folderItem.dataset.id;
                const delBtn = e.target.closest('.delete-folder-btn');
                if (delBtn) {
                    e.stopPropagation();
                    if (confirm('Supprimer le dossier ? (Les prompts ne seront pas affectés)')) { storage.deleteFolder(folderId); state.currentFolderId = 'all'; ui.renderFolders(); ui.renderPromptLibrary(); ui.showToast('Dossier supprimé.','info'); }
                } else { state.currentFolderId = folderId; ui.renderFolders(); ui.renderPromptLibrary(); }
            }
        },
        handleLibraryInputChange(e) {
            const moveSelect = e.target.closest('[data-action="move"]');
            if (moveSelect) {
                const promptId = moveSelect.closest('.prompt-card').dataset.id;
                storage.updatePromptFolder(promptId, moveSelect.value);
                if(state.currentFolderId !== 'all') ui.renderPromptLibrary();
                ui.showToast('Prompt déplacé.', 'info');
            } else if (e.target.closest('#search-input, #sort-select')) {
                ui.renderPromptLibrary();
            }
        },
        handleNewFolder() { const name = prompt('Nom du nouveau dossier:'); if (name && name.trim()) { storage.saveFolder(name.trim()); ui.renderFolders(); ui.showToast('Dossier créé.','success'); } },
        handleExport() {
            const data = { prompts: storage.getPrompts(), folders: storage.getFolders() }; const s = JSON.stringify(data, null, 2); const b = new Blob([s], {type:'application/json'});
            const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`prompt_export_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
        },
        handleImport(e) {
            const file = e.target.files[0]; if(!file)return; const reader = new FileReader();
            reader.onload = function(ev){ try { const data=JSON.parse(ev.target.result); if(data.prompts && data.folders){ if(confirm('Ceci remplacera toutes vos données. Continuer ?')){ storage.savePrompts(data.prompts); storage.saveFolders(data.folders); ui.showToast('Importation réussie !','success'); ui.updatePromptCount(); ui.switchTab('library'); }} else {ui.showToast('Fichier invalide.','error');}} catch(err){ui.showToast('Erreur de lecture du fichier.','error');}};
            reader.readAsText(file);
        },
    };

    // =================================================================================
    // INITIALISATION
    // =================================================================================
    function init() {
        document.querySelector('.sidebar nav').addEventListener('click', handlers.handleNavClick);
        document.getElementById('creator-section')?.addEventListener('click', handlers.handleWizardNav);
        document.getElementById('creator-section')?.addEventListener('input', handlers.handleWizardInput);
        document.getElementById('save-freeform-btn')?.addEventListener('click', handlers.handleFreeformSave);
        document.getElementById('library-section')?.addEventListener('click', handlers.handleLibraryClick);
        document.getElementById('library-section')?.addEventListener('change', handlers.handleLibraryInputChange);
        document.getElementById('library-section')?.addEventListener('input', handlers.handleLibraryInputChange);
        document.getElementById('folder-list')?.addEventListener('click', handlers.handleFolderClick);
        document.getElementById('new-folder-btn')?.addEventListener('click', handlers.handleNewFolder);
        document.getElementById('export-data-btn')?.addEventListener('click', handlers.handleExport);
        document.getElementById('import-data-btn')?.addEventListener('click', () => document.getElementById('import-data-input').click());
        document.getElementById('import-data-input')?.addEventListener('change', handlers.handleImport);
        
        ui.switchTab('creator');
        ui.updatePromptCount();
    }
    
    init();
});
