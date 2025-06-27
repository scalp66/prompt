document.addEventListener('DOMContentLoaded', () => {

    const state = {
        currentStep: 0,
        formData: { role: '', objective: '', context: '', structure: '', examples: '', constraints: '', category: 'général' },
        currentFolderId: 'all',
        editingPromptId: null,
    };

    const WIZARD_STEPS = [
        { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' }, { key: 'objective', title: 'Quel est votre objectif ?' },
        { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' }, { key: 'structure', title: 'Comment structurer la réponse ?' },
        { key: 'examples', title: 'Avez-vous des exemples ?' }, { key: 'constraints', title: 'Des contraintes spécifiques ?' }
    ];
    const PREDEFINED_ROLES = {
        'expert-dev': 'Tu es un expert développeur avec 10+ ans d\'expérience...', 'consultant': 'Tu es un consultant en stratégie d\'entreprise...',
        'professeur': 'Tu es un professeur pédagogue...', 'redacteur': 'Tu es un rédacteur professionnel...'
    };
    const MAX_VERSIONS = 5;

    const dom = {
        sidebarNav: document.querySelector('.sidebar nav'), mainContent: document.querySelector('.main-content'),
        promptCount: document.getElementById('prompt-count'), toastContainer: document.getElementById('toast-container'),
        creatorSection: document.getElementById('creator-section'), stepsIndicator: document.querySelector('.steps-indicator'),
        stepTitle: document.getElementById('step-title'), prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'), roleSuggestions: document.getElementById('role-suggestions'),
        qualityAnalyzer: document.getElementById('quality-analyzer'), scoreCircle: document.getElementById('score-circle'),
        scoreLabel: document.getElementById('score-label'), suggestionsContainer: document.getElementById('suggestions-container'),
        suggestionsList: document.getElementById('suggestions-list'), saveFreeformBtn: document.getElementById('save-freeform-btn'),
        freeformContent: document.getElementById('freeform-prompt-content'), freeformTitle: document.getElementById('freeform-prompt-title'),
        freeformCategory: document.getElementById('freeform-prompt-category'), libraryContainer: document.getElementById('library-section'),
        folderList: document.getElementById('folder-list'), promptLibraryList: document.getElementById('prompt-library-list'),
        newFolderBtn: document.getElementById('new-folder-btn'), searchInput: document.getElementById('search-input'),
        sortSelect: document.getElementById('sort-select'), exportDataBtn: document.getElementById('export-data-btn'),
        importDataBtn: document.getElementById('import-data-btn'), importDataInput: document.getElementById('import-data-input'),
        promptModal: document.getElementById('prompt-modal'), modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'), modalCloseBtn: document.getElementById('modal-close-btn'),
        saveApiKeyBtn: document.getElementById('save-api-key-btn'), apiKeyInput: document.getElementById('api-key-input'),
    };

    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [],
        savePrompts: (prompts) => localStorage.setItem('prompts', JSON.stringify(prompts)),
        getFolders: () => JSON.parse(localStorage.getItem('prompt_folders')) || [],
        saveFolders: (folders) => localStorage.setItem('prompt_folders', JSON.stringify(folders)),
        getApiKey: () => localStorage.getItem('user_api_key'),
        saveApiKey: (key) => localStorage.setItem('user_api_key', key),

        savePrompt(promptData) {
            const prompts = this.getPrompts();
            prompts.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), folderId: null, versions: [], ...promptData });
            this.savePrompts(prompts);
            ui.updatePromptCount();
        },
        updatePrompt(promptId, updatedData) {
            let prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index === -1) return false;
            const originalPrompt = prompts[index];
            if (originalPrompt.content !== updatedData.content || originalPrompt.title !== updatedData.title) {
                if (!originalPrompt.versions) originalPrompt.versions = [];
                originalPrompt.versions.unshift({ content: originalPrompt.content, title: originalPrompt.title, savedAt: originalPrompt.updatedAt || new Date().toISOString() });
                if (originalPrompt.versions.length > MAX_VERSIONS) originalPrompt.versions.pop();
            }
            prompts[index] = { ...originalPrompt, ...updatedData, updatedAt: new Date().toISOString() };
            this.savePrompts(prompts);
            return true;
        },
        deletePrompt(id) { this.savePrompts(this.getPrompts().filter(p => p.id !== id)); ui.updatePromptCount(); },
        saveFolder(folderName) { const folders = this.getFolders(); folders.push({ id: Date.now().toString(), name: folderName }); this.saveFolders(folders); },
        deleteFolder(folderId) {
            this.saveFolders(this.getFolders().filter(f => f.id !== folderId));
            this.savePrompts(this.getPrompts().map(p => { if (p.folderId === folderId) p.folderId = null; return p; }));
        },
        updatePromptFolder(promptId, folderId) {
            const prompts = this.getPrompts();
            const index = prompts.findIndex(p => p.id === promptId);
            if (index > -1) { prompts[index].folderId = folderId === 'null' ? null : folderId; this.savePrompts(prompts); }
        },
    };

    const ui = {
        showToast(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            let icon = 'ℹ️'; if (type === 'success') icon = '✔️'; if (type === 'error') icon = '❌';
            toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;
            dom.toastContainer.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove()); }, duration);
        },
        updatePromptCount() { dom.promptCount.textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`; },
        switchTab(tabName) {
            dom.mainContent.querySelectorAll('.main-content > div[id$="-section"]').forEach(section => section.classList.add('hidden'));
            const sectionToShow = document.getElementById(`${tabName}-section`);
            if (sectionToShow) sectionToShow.classList.remove('hidden');
            dom.sidebarNav.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.tab === tabName));
            if (tabName === 'library') { this.renderFolders(); this.renderPromptLibrary(); }
            if (tabName === 'freeform') { this.resetFreeformForm(); }
        },
        updateStepDisplay() {
            dom.creatorSection.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`step-${state.currentStep}`).classList.remove('hidden');
            dom.stepTitle.textContent = WIZARD_STEPS[state.currentStep].title;
            dom.stepsIndicator.querySelectorAll('.step').forEach((el, idx) => {
                el.classList.remove('active', 'completed');
                if (idx === state.currentStep) el.classList.add('active'); else if (idx < state.currentStep) el.classList.add('completed');
            });
            dom.prevBtn.classList.toggle('hidden', state.currentStep === 0);
            dom.nextBtn.textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant';
        },
        resetWizardForm() {
            state.currentStep = 0;
            state.formData = { role: '', objective: '', context: '', structure: '', examples: '', constraints: '', category: 'général' };
            ['role', 'objective', 'context', 'structure', 'examples', 'constraints', 'category', 'role-suggestions'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });
            this.updateStepDisplay();
            this.updateQualityAnalyzer();
        },
        renderFolders() {
            const folders = storage.getFolders();
            dom.folderList.innerHTML = `<li class="folder-item ${state.currentFolderId === 'all' ? 'active' : ''}" data-id="all">Tous les prompts</li><li class="folder-item ${state.currentFolderId === 'uncategorized' ? 'active' : ''}" data-id="uncategorized">Non classés</li>`;
            folders.forEach(folder => { dom.folderList.innerHTML += `<li class="folder-item ${state.currentFolderId === folder.id ? 'active' : ''}" data-id="${folder.id}"><span>${folder.name}</span><button class="delete-folder-btn" data-id="${folder.id}">×</button></li>`; });
        },
        renderPromptLibrary() {
            let prompts = storage.getPrompts();
            const searchTerm = dom.searchInput.value.toLowerCase();
            const sortValue = dom.sortSelect.value;
            if (state.currentFolderId === 'uncategorized') prompts = prompts.filter(p => !p.folderId);
            else if (state.currentFolderId !== 'all') prompts = prompts.filter(p => p.folderId === state.currentFolderId);
            if (searchTerm) prompts = prompts.filter(p => p.title.toLowerCase().includes(searchTerm) || p.content.toLowerCase().includes(searchTerm));
            prompts.sort((a,b)=>{ /* ... logique de tri ... */ });
            dom.promptLibraryList.innerHTML = prompts.length === 0 ? '<p style="text-align: center; color: #64748b; padding: 40px 0;">Aucun prompt trouvé.</p>' : '';
            prompts.forEach(p => {
                const card = document.createElement('div'); card.className = 'prompt-card'; card.dataset.id = p.id;
                const folderOptions = storage.getFolders().map(f => `<option value="${f.id}" ${p.folderId === f.id ? 'selected' : ''}>${f.name}</option>`).join('');
                const selectHTML = `<select class="form-select btn-sm" data-action="move"><option value="null" ${!p.folderId ? 'selected' : ''}>Non classé</option>${folderOptions}</select>`;
                card.innerHTML = `<div class="prompt-card-header"><h4 class="prompt-card-title">${p.title}</h4><span class="prompt-card-category">${p.category}</span></div><p class="prompt-card-content">${p.content}</p><div class="prompt-card-footer"><small class="prompt-card-date">Modifié : ${new Date(p.updatedAt).toLocaleDateString('fr-FR')}</small><div class="prompt-card-actions">${selectHTML}<button class="btn btn-secondary btn-sm" data-action="edit">Modifier</button><button class="btn btn-secondary btn-sm" data-action="copy">Copier</button><button class="btn btn-secondary btn-sm" data-action="delete" style="background-color:#fee2e2;color:#ef4444;">Supprimer</button></div></div>`;
                dom.promptLibraryList.appendChild(card);
            });
        },
        updateQualityAnalyzer() {
            const promptPreview = [state.formData.role, state.formData.objective, state.formData.context, state.formData.structure, state.formData.examples, state.formData.constraints].filter(Boolean).join('\n\n');
            dom.qualityAnalyzer.classList.toggle('hidden', !promptPreview); if (!promptPreview) return;
            const analysis = { score: 5, suggestions: [] }; /* ... logique d'analyse ... */
            dom.scoreCircle.textContent = `${analysis.score}/5`;
            const scoreClass = ['score-poor','score-poor','score-average','score-average','score-good','score-excellent'][analysis.score];
            dom.scoreCircle.className = `score-circle ${scoreClass}`;
            dom.scoreLabel.textContent = ['Très Faible','Faible','Moyenne','Bonne','Très Bonne','Excellente'][analysis.score];
            dom.suggestionsContainer.classList.toggle('hidden', analysis.suggestions.length === 0);
            dom.suggestionsList.innerHTML = '';
            analysis.suggestions.forEach(s => { const li=document.createElement('li'); li.className='suggestion-item'; li.textContent=s; dom.suggestionsList.appendChild(li); });
        },
        resetFreeformForm() { dom.freeformContent.value=''; dom.freeformTitle.value=''; dom.freeformCategory.value='général'; dom.saveFreeformBtn.textContent='Sauvegarder le Prompt'; state.editingPromptId=null; },
        openPromptModal(id) { const p=storage.getPrompts().find(p=>p.id===id); if(p){dom.modalTitle.textContent=p.title;dom.modalBody.textContent=p.content;dom.promptModal.classList.remove('hidden');} },
        closePromptModal() { dom.promptModal.classList.add('hidden'); },
    };

    function handleNavClick(e) { const btn = e.target.closest('.nav-item'); if(btn) ui.switchTab(btn.dataset.tab); }
    function handleWizardNav(e) {
        if(e.target===dom.nextBtn){if(state.currentStep<WIZARD_STEPS.length-1){state.currentStep++;ui.updateStepDisplay();}else{const p=Object.values(state.formData).filter(Boolean).join('\n\n');storage.savePrompt({title:(state.formData.objective||'Nouveau Prompt').substring(0,40),content:p,category:state.formData.category});ui.showToast('Prompt créé !','success');ui.resetWizardForm();}}
        else if(e.target===dom.prevBtn){if(state.currentStep>0){state.currentStep--;ui.updateStepDisplay();}}
    }
    function handleWizardInput(e) {
        if(e.target.id in state.formData) state.formData[e.target.id]=e.target.value;
        else if(e.target.id==='role-suggestions'&&e.target.value){const t=PREDEFINED_ROLES[e.target.value];document.getElementById('role').value=t;state.formData.role=t;}
        ui.updateQualityAnalyzer();
    }
    function handleFreeformSave() {
        const content=dom.freeformContent.value.trim(); let title=dom.freeformTitle.value.trim(); const category=dom.freeformCategory.value;
        if(!content){ui.showToast('Contenu vide.','error');return;} if(!title)title=content.substring(0,40)+(content.length>40?'...':'');
        if(state.editingPromptId){storage.updatePrompt(state.editingPromptId,{title,content,category});ui.showToast('Prompt mis à jour !','success');ui.switchTab('library');}
        else{storage.savePrompt({title,content,category});ui.showToast('Prompt sauvegardé !','success');}
        ui.resetFreeformForm();
    }
    function handleLibraryEvents(e) {
        const card = e.target.closest('.prompt-card'); if (!card) return; const id=card.dataset.id;
        const target = e.target.closest('[data-action]');
        if(target){ const action=target.dataset.action;
            if(action==='delete'){if(confirm('Supprimer ce prompt ?')){storage.deletePrompt(id);ui.renderPromptLibrary();ui.showToast('Prompt supprimé.','info');}}
            else if(action==='edit'){ state.editingPromptId=id; const p=storage.getPrompts().find(p=>p.id===id); ui.switchTab('freeform'); dom.freeformContent.value=p.content; dom.freeformTitle.value=p.title; dom.freeformCategory.value=p.category; dom.saveFreeformBtn.textContent='Mettre à jour le Prompt';}
            else if(action==='copy'){ const p=storage.getPrompts().find(p=>p.id===id); if(p) navigator.clipboard.writeText(p.content).then(()=>ui.showToast('Copié !','success'));}
            else if(action==='move'){ storage.updatePromptFolder(id, target.value); if(state.currentFolderId!=='all')ui.renderPromptLibrary();}
        } else { ui.openPromptModal(id); }
    }
    function handleFolderEvents(e) {
        const item = e.target.closest('.folder-item'); if(!item)return; const delBtn = e.target.closest('.delete-folder-btn');
        if(delBtn){e.stopPropagation();if(confirm('Supprimer dossier ?')){storage.deleteFolder(delBtn.dataset.id);state.currentFolderId='all';ui.renderFolders();ui.renderPromptLibrary();ui.showToast('Dossier supprimé.','info');}}
        else{state.currentFolderId=item.dataset.id;ui.renderFolders();ui.renderPromptLibrary();}
    }
    function handleSettingsSave() { const key=dom.apiKeyInput.value;if(key&&key.trim()){storage.saveApiKey(key.trim());ui.showToast('Clé API sauvegardée !','success');dom.apiKeyInput.value='';dom.apiKeyInput.placeholder="Clé enregistrée.";}else{ui.showToast('Veuillez entrer une clé.','error');} }
    function exportData() {
        const data={prompts:storage.getPrompts(),folders:storage.getFolders()}; const s=JSON.stringify(data,null,2); const b=new Blob([s],{type:'application/json'});
        const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`prompt_export_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
    }
    function importData(e) {
        const file = e.target.files[0]; if(!file)return; const reader=new FileReader();
        reader.onload=function(ev){try{const data=JSON.parse(ev.target.result);if(data.prompts&&data.folders){if(confirm('Remplacer données ?')){storage.savePrompts(data.prompts);storage.saveFolders(data.folders);ui.showToast('Import réussi !','success');ui.updatePromptCount();ui.renderFolders();ui.renderPromptLibrary();}}}catch(err){ui.showToast('Fichier invalide.','error');}};
        reader.readAsText(file);
    }
    
    function setupEventListeners() {
        const listeners = {
            [dom.sidebarNav]: { click: handleNavClick },
            [dom.creatorSection]: { click: handleWizardNav, input: handleWizardInput },
            [dom.saveFreeformBtn]: { click: handleFreeformSave },
            [dom.libraryContainer]: { click: handleLibraryEvents, change: handleLibraryEvents },
            [dom.searchInput]: { input: ui.renderPromptLibrary },
            [dom.sortSelect]: { change: ui.renderPromptLibrary },
            [dom.folderList]: { click: handleFolderEvents },
            [dom.newFolderBtn]: { click: () => { const n=prompt('Nom du dossier:'); if(n&&n.trim()){storage.saveFolder(n.trim());ui.renderFolders();ui.showToast('Dossier créé.','success');} } },
            [dom.exportDataBtn]: { click: exportData },
            [dom.importDataBtn]: { click: () => dom.importDataInput.click() },
            [dom.importDataInput]: { change: importData },
            [dom.promptModal]: { click: e => { if(e.target===dom.promptModal)ui.closePromptModal(); } },
            [dom.modalCloseBtn]: { click: ui.closePromptModal },
            [dom.saveApiKeyBtn]: { click: handleSettingsSave },
        };
        for (const element in listeners) {
            if (Object.hasOwnProperty.call(listeners, element) && element !== 'null') {
                for (const event in listeners[element]) {
                    document.getElementById(element.id)?.addEventListener(event, listeners[element][event]);
                }
            }
        }
    }

    function init() {
        setupEventListeners();
        ui.switchTab('creator');
        ui.updatePromptCount();
        if (storage.getApiKey()) dom.apiKeyInput.placeholder = "Clé enregistrée.";
    }
    init();
});
