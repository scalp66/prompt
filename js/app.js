document.addEventListener('DOMContentLoaded', () => {

    const state = { currentStep: 0, formData: {}, currentFolderId: 'all', editingPromptId: null, };
    const WIZARD_STEPS = [ { title: 'Qui est l\'IA ? (Persona)' }, { title: 'Quel est l\'objectif final ?' }, { title: 'Comment l\'IA doit-elle raisonner ?' }, { title: 'Quel contexte fournir ?' }, { title: 'Quelle est la structure de la réponse ?' }, { title: 'Quelles sont les contraintes ?' } ];
    
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        getFolders: () => JSON.parse(localStorage.getItem('prompt_folders')) || [],
        saveFolders: (folders) => localStorage.setItem('prompt_folders', JSON.stringify(folders)),
        saveNewPrompt(promptData) { const all = this.getPrompts(); all.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...promptData }); this.savePrompts(all); },
        updatePrompt(id, data) { let all = this.getPrompts(); const i = all.findIndex(p => p.id === id); if (i > -1) all[i] = { ...all[i], ...data }; this.savePrompts(all); },
        deletePrompt(id) { this.savePrompts(this.getPrompts().filter(p => p.id !== id)); },
        saveFolder(name) { const all = this.getFolders(); all.push({ id: Date.now().toString(), name: name }); this.saveFolders(all); },
        deleteFolder(id) { this.saveFolders(this.getFolders().filter(f => f.id !== id)); const all = this.getPrompts().map(p => { if (p.folderId === id) p.folderId = null; return p; }); this.savePrompts(all); },
        updatePromptFolder(pId, fId) { const all = this.getPrompts(); const i = all.findIndex(p => p.id === pId); if (i > -1) { all[i].folderId = fId === 'null' ? null : fId; this.savePrompts(all); } },
    };

    const ui = {
        showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✔️' : 'ℹ️'}</span> ${message}`;
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove()); }, 3000);
        },
        updatePromptCount: () => { const el = document.getElementById('prompt-count'); if (el) el.textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`; },
        switchTab: (tabName) => {
            document.querySelectorAll('.main-content > div[id$="-section"]').forEach(s => s.classList.add('hidden'));
            const section = document.getElementById(`${tabName}-section`);
            if (section) section.classList.remove('hidden');
            document.querySelectorAll('.sidebar .nav-item').forEach(i => i.classList.toggle('active', i.dataset.tab === tabName));
            if (tabName === 'library') { ui.renderFolders(); ui.renderPromptLibrary(); }
            if (tabName === 'freeform') { ui.resetFreeformForm(); }
        },
        updateStepDisplay: () => {
            const creatorSection = document.getElementById('creator-section');
            if(!creatorSection) return;
            creatorSection.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
            const currentStepEl = document.getElementById(`step-${state.currentStep}`);
            if(currentStepEl) currentStepEl.classList.remove('hidden');
            const stepTitleEl = document.getElementById('step-title');
            if(stepTitleEl) stepTitleEl.textContent = WIZARD_STEPS[state.currentStep].title;
            creatorSection.querySelectorAll('.steps-indicator .step').forEach((el, idx) => { el.classList.toggle('active', idx === state.currentStep); el.classList.toggle('completed', idx < state.currentStep); });
            document.getElementById('prev-btn').classList.toggle('hidden', state.currentStep === 0);
            document.getElementById('next-btn').textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        },
        resetWizardForm: () => {
            state.currentStep = 0; state.formData = {};
            document.querySelectorAll('#creator-section input:not([type=checkbox]), #creator-section textarea, #creator-section select').forEach(el => el.value = '');
            const checkbox = document.getElementById('use_chain_of_thought'); if(checkbox) checkbox.checked = true;
            ui.updateStepDisplay();
        },
        resetFreeformForm: () => {
            state.editingPromptId = null;
            const titleEl = document.getElementById('freeform-prompt-title'); if(titleEl) titleEl.value = '';
            const contentEl = document.getElementById('freeform-prompt-content'); if(contentEl) contentEl.value = '';
            const categoryEl = document.getElementById('freeform-prompt-category'); if(categoryEl) categoryEl.value = 'général';
            const saveBtn = document.getElementById('save-freeform-btn'); if(saveBtn) saveBtn.textContent = 'Sauvegarder le Prompt';
        },
        renderFolders: () => {
            const list = document.getElementById('folder-list');
            if(!list) return;
            list.innerHTML = `<li class="folder-item ${state.currentFolderId === 'all' ? 'active' : ''}" data-id="all">Tous</li><li class="folder-item ${state.currentFolderId === 'uncategorized' ? 'active' : ''}" data-id="uncategorized">Non classés</li>`;
            storage.getFolders().forEach(f => { list.innerHTML += `<li class="folder-item ${state.currentFolderId === f.id ? 'active' : ''}" data-id="${f.id}"><span>${f.name}</span><button class="delete-folder-btn" data-id="${f.id}">×</button></li>`; });
        },
        renderPromptLibrary: () => {
            const container = document.getElementById('prompt-library-list');
            if(!container) return;
            let prompts = storage.getPrompts();
            if (state.currentFolderId === 'uncategorized') prompts = prompts.filter(p => !p.folderId);
            else if (state.currentFolderId !== 'all') prompts = prompts.filter(p => p.folderId === state.currentFolderId);
            const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
            if (searchTerm) prompts = prompts.filter(p => (p.title + p.content).toLowerCase().includes(searchTerm));
            container.innerHTML = prompts.length === 0 ? '<p style="text-align: center; color: #718096; padding: 40px 0;">Aucun prompt.</p>' : '';
            prompts.forEach(p => {
                const card = document.createElement('div'); card.className = 'prompt-card'; card.dataset.id = p.id;
                const folderOptions = storage.getFolders().map(f => `<option value="${f.id}" ${p.folderId === f.id ? 'selected' : ''}>${f.name}</option>`).join('');
                const selectHTML = `<select class="form-select btn-sm" data-action="move"><option value="null" ${!p.folderId ? 'selected' : ''}>Non classé</option>${folderOptions}</select>`;
                card.innerHTML = `<div class="prompt-card-header"><h4 class="prompt-card-title">${p.title}</h4><span class="prompt-card-category">${p.category}</span></div><p class="prompt-card-content">${p.content}</p><div class="prompt-card-footer"><small class="prompt-card-date">Créé: ${new Date(p.createdAt).toLocaleDateString('fr-FR')}</small><div class="prompt-card-actions">${selectHTML}<button class="btn btn-secondary btn-sm" data-action="edit">Modifier</button><button class="btn btn-secondary btn-sm" data-action="copy">Copier</button><button class="btn btn-secondary btn-sm" data-action="delete" style="background-color:#fee2e2;color:#ef4444;">Suppr.</button></div></div>`;
                container.appendChild(card);
            });
        },
    };

    function init() {
        const appContainer = document.querySelector('.app');
        if (!appContainer) { return console.error("ERREUR : Conteneur .app introuvable."); }

        // --- GESTIONNAIRE DE CLICS GLOBAL ---
        appContainer.addEventListener('click', (e) => {
            const target = e.target;
            const navButton = target.closest('.nav-item');
            if (navButton) return ui.switchTab(navButton.dataset.tab);
            
            // Logique de l'assistant
            if (target.closest('#next-btn')) {
                if (state.currentStep < WIZARD_STEPS.length - 1) { state.currentStep++; ui.updateStepDisplay(); }
                else {
                    let promptParts = [];
                    if(state.formData.persona_role) promptParts.push(`**Persona:**\nTu es un ${state.formData.persona_role}, ${state.formData.persona_context || ''}. Ton style est ${state.formData.persona_style || 'clair'}.`);
                    if(state.formData.objective) promptParts.push(`**Objectif:**\n${state.formData.objective}`);
                    storage.saveNewPrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: promptParts.join('\n\n---\n\n'), category: state.formData.category || 'général' });
                    ui.showToast('Prompt créé !', 'success'); ui.resetWizardForm(); ui.updatePromptCount();
                }
            } else if (target.closest('#prev-btn')) { if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); } }
            // Logique de la Saisie Libre
            else if (target.closest('#save-freeform-btn')) {
                const content = document.getElementById('freeform-prompt-content').value.trim();
                let title = document.getElementById('freeform-prompt-title').value.trim();
                if (!content) return ui.showToast('Contenu vide.', 'error');
                if (!title) title = content.substring(0, 40) + '...';
                const promptData = { title, content, category: document.getElementById('freeform-prompt-category').value };
                if (state.editingPromptId) { storage.updatePrompt(state.editingPromptId, promptData); ui.showToast('Prompt mis à jour !', 'success'); }
                else { storage.saveNewPrompt(promptData); ui.showToast('Prompt sauvegardé !', 'success'); }
                ui.updatePromptCount(); ui.switchTab('library');
            }
            // Logique de la Bibliothèque
            else if (target.closest('#new-folder-btn')) { const name = prompt('Nom du dossier:'); if (name && name.trim()) { storage.saveFolder(name.trim()); ui.renderFolders(); } }
            else if (target.closest('.delete-folder-btn')) { const id = target.dataset.id; if (confirm('Supprimer ce dossier ?')) { storage.deleteFolder(id); state.currentFolderId = 'all'; ui.renderFolders(); ui.renderPromptLibrary(); } }
            else if (target.closest('.folder-item')) { state.currentFolderId = target.closest('.folder-item').dataset.id; ui.renderFolders(); ui.renderPromptLibrary(); }
            const cardAction = target.closest('.prompt-card [data-action]');
            if (cardAction) {
                const action = cardAction.dataset.action;
                const id = cardAction.closest('.prompt-card').dataset.id;
                if (action === 'delete') { if (confirm('Supprimer ce prompt ?')) { storage.deletePrompt(id); ui.renderPromptLibrary(); } }
                else if (action === 'copy') { const p = storage.getPrompts().find(p => p.id === id); if (p) navigator.clipboard.writeText(p.content).then(() => ui.showToast('Copié !', 'success')); }
                else if (action === 'edit') {
                    state.editingPromptId = id; const p = storage.getPrompts().find(p => p.id === id);
                    ui.switchTab('freeform');
                    document.getElementById('freeform-prompt-title').value = p.title; document.getElementById('freeform-prompt-content').value = p.content;
                    document.getElementById('freeform-prompt-category').value = p.category; document.getElementById('save-freeform-btn').textContent = 'Mettre à jour';
                }
            }
        });

        // --- GESTIONNAIRE D'INPUTS GLOBAL ---
        appContainer.addEventListener('input', (e) => {
            const target = e.target;
            const wizardInput = target.closest('#creator-section input, #creator-section textarea, #creator-section select');
            if (wizardInput) { state.formData[wizardInput.id] = wizardInput.type === 'checkbox' ? wizardInput.checked : wizardInput.value; }
            const libraryInput = target.closest('#library-section input, #library-section select');
            if (libraryInput) { ui.renderPromptLibrary(); }
            const moveSelect = target.closest('[data-action="move"]');
            if(moveSelect) { const pId=moveSelect.closest('.prompt-card').dataset.id; storage.updatePromptFolder(pId, moveSelect.value); if(state.currentFolderId!=='all') ui.renderPromptLibrary(); }
        });

        // --- Démarrage de l'application ---
        ui.switchTab('creator');
        ui.updatePromptCount();
    }
    
    init();
});
