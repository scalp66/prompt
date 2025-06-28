document.addEventListener('DOMContentLoaded', () => {

    const state = { currentStep: 0, formData: {}, currentFolderId: 'all', editingPromptId: null, };
    const WIZARD_STEPS = [ { key: 'role', title: 'Quel rôle doit jouer l\'IA ?' }, { key: 'objective', title: 'Quel est votre objectif ?' }, { key: 'context', title: 'Quel contexte l\'IA doit-elle connaître ?' }, { key: 'structure', title: 'Comment structurer la réponse ?' }, { key: 'examples', title: 'Avez-vous des exemples ?' }, { key: 'constraints', title: 'Des contraintes spécifiques ?' } ];
    const PREDEFINED_ROLES = { 'expert-dev': 'Tu es un expert développeur...', 'consultant': 'Tu es un consultant...', 'professeur': 'Tu es un professeur...', 'redacteur': 'Tu es un rédacteur...' };
    
    const storage = {
        getPrompts: () => JSON.parse(localStorage.getItem('prompts')) || [], savePrompts: (p) => localStorage.setItem('prompts', JSON.stringify(p)),
        getFolders: () => JSON.parse(localStorage.getItem('prompt_folders')) || [], saveFolders: (f) => localStorage.setItem('prompt_folders', JSON.stringify(f)),
        savePrompt(d) { const p = this.getPrompts(); p.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...d }); this.savePrompts(p); },
        updatePrompt(id, d) { let p = this.getPrompts(); const i = p.findIndex(p => p.id === id); if (i===-1) return; p[i] = { ...p[i], ...d, updatedAt: new Date().toISOString() }; this.savePrompts(p); },
        deletePrompt(id) { this.savePrompts(this.getPrompts().filter(p => p.id !== id)); },
        saveFolder(n) { const f = this.getFolders(); f.push({ id: Date.now().toString(), name: n }); this.saveFolders(f); },
        deleteFolder(id) { this.saveFolders(this.getFolders().filter(f => f.id !== id)); const p = this.getPrompts().map(p => { if (p.folderId === id) p.folderId = null; return p; }); this.savePrompts(p); },
        updatePromptFolder(pId, fId) { const p = this.getPrompts(); const i = p.findIndex(p => p.id === pId); if (i > -1) { p[i].folderId = fId === 'null' ? null : fId; this.savePrompts(p); } },
    };

    const ui = {
        showToast(m, t = 'info') { const e = document.createElement('div'); e.className = `toast ${t}`; e.innerHTML = `<span class="toast-icon">${t==='success'?'✔️':t==='error'?'❌':'ℹ️'}</span>${m}`; document.getElementById('toast-container').appendChild(e); setTimeout(()=>e.classList.add('show'),10); setTimeout(()=>{e.classList.remove('show');e.addEventListener('transitionend',()=>e.remove());},3000); },
        updatePromptCount: () => { document.getElementById('prompt-count').textContent = `${storage.getPrompts().length} prompt(s) sauvegardé(s)`; },
        switchTab: (t) => { document.querySelectorAll('.main-content>[id$="-section"]').forEach(s => s.classList.add('hidden')); document.getElementById(`${t}-section`)?.classList.remove('hidden'); document.querySelectorAll('.sidebar .nav-item').forEach(i => i.classList.toggle('active', i.dataset.tab === t)); if(t==='library'){ui.renderFolders();ui.renderPromptLibrary();}if(t==='freeform'){ui.resetFreeformForm();} },
        updateStepDisplay: () => { document.querySelectorAll('#creator-section .step-content').forEach(el => el.classList.add('hidden')); document.getElementById(`step-${state.currentStep}`)?.classList.remove('hidden'); document.getElementById('step-title').textContent = WIZARD_STEPS[state.currentStep].title; document.querySelectorAll('.steps-indicator .step').forEach((el, idx) => { el.classList.remove('active', 'completed'); if (idx === state.currentStep) el.classList.add('active'); else if (idx < state.currentStep) el.classList.add('completed'); }); document.getElementById('prev-btn').classList.toggle('hidden', state.currentStep === 0); document.getElementById('next-btn').textContent = (state.currentStep === WIZARD_STEPS.length - 1) ? 'Créer le Prompt' : 'Suivant'; },
        resetWizardForm: () => { state.currentStep = 0; state.formData = {}; ['role','objective','context','structure','examples','constraints','category','role-suggestions'].forEach(id => { const el=document.getElementById(id); if (el) el.value=''; }); ui.updateStepDisplay(); ui.updateQualityAnalyzer(); },
        resetFreeformForm: () => { document.getElementById('freeform-prompt-content').value=''; document.getElementById('freeform-prompt-title').value=''; document.getElementById('freeform-prompt-category').value='général'; document.getElementById('save-freeform-btn').textContent='Sauvegarder le Prompt'; state.editingPromptId=null; },
        renderFolders: () => { const fL=document.getElementById('folder-list'); const f=storage.getFolders(); fL.innerHTML=`<li class="folder-item ${state.currentFolderId==='all'?'active':''}" data-id="all">Tous</li><li class="folder-item ${state.currentFolderId==='uncategorized'?'active':''}" data-id="uncategorized">Non classés</li>`; f.forEach(fo=>{fL.innerHTML+=`<li class="folder-item ${state.currentFolderId===fo.id?'active':''}" data-id="${fo.id}"><span>${fo.name}</span><button class="delete-folder-btn" data-id="${fo.id}">×</button></li>`;}); },
        renderPromptLibrary: () => { const pLC=document.getElementById('prompt-library-list'); let p=storage.getPrompts(); const sT=document.getElementById('search-input').value.toLowerCase(); const sV=document.getElementById('sort-select').value; if(state.currentFolderId==='uncategorized')p=p.filter(p=>!p.folderId); else if(state.currentFolderId!=='all')p=p.filter(p=>p.folderId===state.currentFolderId); if(sT)p=p.filter(p=>(p.title.toLowerCase()+p.content.toLowerCase()).includes(sT)); p.sort((a,b)=>{switch(sV){case'oldest':return new Date(a.createdAt)-new Date(b.createdAt);case'title-asc':return a.title.localeCompare(b.title);case'title-desc':return b.title.localeCompare(a.title);default:return new Date(b.createdAt)-new Date(a.createdAt);}}); pLC.innerHTML=p.length===0?'<p style="text-align:center;color:#64748b;padding:40px 0;">Aucun prompt.</p>':''; p.forEach(pr=>{const c=document.createElement('div');c.className='prompt-card';c.dataset.id=pr.id; const fO=storage.getFolders().map(f=>`<option value="${f.id}" ${pr.folderId===f.id?'selected':''}>${f.name}</option>`).join(''); const sH=`<select class="form-select btn-sm" data-action="move"><option value="null" ${!pr.folderId?'selected':''}>Non classé</option>${fO}</select>`; c.innerHTML=`<div class="prompt-card-header"><h4 class="prompt-card-title">${pr.title}</h4><span class="prompt-card-category">${pr.category}</span></div><p class="prompt-card-content">${pr.content}</p><div class="prompt-card-footer"><small class="prompt-card-date">Modifié: ${new Date(pr.updatedAt).toLocaleDateString('fr-FR')}</small><div class="prompt-card-actions">${sH}<button class="btn btn-sm" data-action="edit">Modifier</button><button class="btn btn-sm" data-action="copy">Copier</button><button class="btn btn-sm" data-action="delete" style="background-color:#fee2e2;color:#ef4444;">Suppr.</button></div></div>`; pLC.appendChild(c);}); },
        updateQualityAnalyzer() {
            const getPromptPreview = () => [state.formData.role, state.formData.objective, state.formData.context, state.formData.structure, state.formData.examples, state.formData.constraints].filter(Boolean).join('\n\n');
            const promptPreview = getPromptPreview();
            const analyzerEl = document.getElementById('quality-analyzer');
            if (!analyzerEl) return;
            analyzerEl.classList.toggle('hidden', !promptPreview);
            if (!promptPreview) return;
            const analysis = { score: 5, suggestions: [] };
            if (!/\b(tu es|vous êtes|agis comme|joue le rôle|expert|spécialiste|professionnel)\b/i.test(promptPreview)) { analysis.suggestions.push('Définissez un rôle clair pour l\'IA.'); analysis.score--; }
            if (!/\b(je veux|génère|crée|écris|analyse|explique|aide|fais|objectif)\b/i.test(promptPreview)) { analysis.suggestions.push('Précisez l\'objectif de votre demande.'); analysis.score--; }
            if (promptPreview.length < 50) { analysis.suggestions.push('Ajoutez plus de contexte.'); analysis.score--; }
            if (/\b(chose|truc|quelque chose|bien|bon)\b/i.test(promptPreview)) { analysis.suggestions.push('Remplacez les termes vagues.'); analysis.score--; }
            analysis.score = Math.max(0, analysis.score);
            const scoreCircle = document.getElementById('score-circle'), scoreLabel = document.getElementById('score-label'), suggestionsContainer = document.getElementById('suggestions-container'), suggestionsList = document.getElementById('suggestions-list');
            scoreCircle.textContent = `${analysis.score}/5`;
            const scoreClass = ['score-poor','score-poor','score-average','score-average','score-good','score-excellent'][analysis.score];
            scoreCircle.className = `score-circle ${scoreClass}`;
            scoreLabel.textContent = 'Qualité : ' + ['Très Faible','Faible','Moyenne','Bonne','Très Bonne','Excellente'][analysis.score];
            suggestionsContainer.classList.toggle('hidden', analysis.suggestions.length === 0);
            suggestionsList.innerHTML = '';
            analysis.suggestions.forEach(s => { const li = document.createElement('li'); li.className = 'suggestion-item'; li.textContent = s; suggestionsList.appendChild(li); });
        },
    };

    const handlers = {
        handleWizardInput(e) {
            const target = e.target; if (target.id in state.formData) state.formData[target.id] = target.value;
            if (target.id === 'role-suggestions' && target.value) { const roleText = PREDEFINED_ROLES[target.value]; document.getElementById('role').value = roleText; state.formData.role = roleText; }
            ui.updateQualityAnalyzer();
        },
        // ... (autres handlers)
    };

    function init() {
        document.body.addEventListener('click', (e) => {
            const navButton = e.target.closest('.nav-item'); if (navButton) { ui.switchTab(navButton.dataset.tab); return; }
            if (e.target.closest('#next-btn')) { if (state.currentStep < WIZARD_STEPS.length - 1) { state.currentStep++; ui.updateStepDisplay(); } else { const p=Object.values(state.formData).filter(Boolean).join('\n\n'); storage.savePrompt({title:(state.formData.objective||'Nouveau Prompt').substring(0,40),content:p,category:state.formData.category||'général'}); ui.showToast('Prompt créé !','success'); ui.resetWizardForm(); ui.updatePromptCount(); } return; }
            if (e.target.closest('#prev-btn')) { if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); } return; }
            if (e.target.closest('#save-freeform-btn')) { const c=document.getElementById('freeform-prompt-content').value.trim(); let t=document.getElementById('freeform-prompt-title').value.trim(); if(!c)return ui.showToast('Contenu vide.','error'); if(!t)t=c.substring(0,40)+(c.length>40?'...':''); const d={title:t,content:c,category:document.getElementById('freeform-prompt-category').value}; if(state.editingPromptId){storage.updatePrompt(state.editingPromptId,d);ui.showToast('Prompt mis à jour !','success');}else{storage.savePrompt(d);ui.showToast('Prompt sauvegardé !','success');} ui.updatePromptCount(); ui.switchTab('library'); return; }
            if (e.target.closest('#new-folder-btn')) { const n=prompt('Nom:'); if(n&&n.trim()){storage.saveFolder(n.trim());ui.renderFolders();} return; }
            if (e.target.closest('#export-data-btn')) { const d={prompts:storage.getPrompts(),folders:storage.getFolders()};const s=JSON.stringify(d,null,2);const b=new Blob([s],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`prompt_export_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href); return; }
            if (e.target.closest('#import-data-btn')) { document.getElementById('import-data-input').click(); return; }
            const cardAction = e.target.closest('.prompt-card [data-action]');
            if (cardAction) { const a=cardAction.dataset.action; const id=cardAction.closest('.prompt-card').dataset.id; if(a==='delete'){if(confirm('Supprimer?')){storage.deletePrompt(id);ui.renderPromptLibrary();ui.showToast('Prompt supprimé.','info');}}else if(a==='edit'){state.editingPromptId=id;const p=storage.getPrompts().find(p=>p.id===id);ui.switchTab('freeform');document.getElementById('freeform-prompt-content').value=p.content;document.getElementById('freeform-prompt-title').value=p.title;document.getElementById('freeform-prompt-category').value=p.category;document.getElementById('save-freeform-btn').textContent='Mettre à jour';}else if(a==='copy'){const p=storage.getPrompts().find(p=>p.id===id);if(p)navigator.clipboard.writeText(p.content).then(()=>ui.showToast('Copié !','success'));} return; }
            const folderItem = e.target.closest('.folder-item');
            if (folderItem) { const id=folderItem.dataset.id; const delBtn=e.target.closest('.delete-folder-btn'); if(delBtn){e.stopPropagation();if(confirm('Supprimer dossier?')){storage.deleteFolder(id);state.currentFolderId='all';ui.renderFolders();ui.renderPromptLibrary();}}else{state.currentFolderId=id;ui.renderFolders();ui.renderPromptLibrary();} }
        });
        document.body.addEventListener('input', (e) => {
            const wizardInput=e.target.closest('#creator-section textarea, #creator-section select'); if(wizardInput){handlers.handleWizardInput(e);}
            if(e.target.closest('#search-input, #sort-select')){ui.renderPromptLibrary();}
            const moveSelect=e.target.closest('[data-action="move"]'); if(moveSelect){const pId=moveSelect.closest('.prompt-card').dataset.id;storage.updatePromptFolder(pId,moveSelect.value);if(state.currentFolderId!=='all')ui.renderPromptLibrary();ui.showToast('Prompt déplacé.','info');}
        });
        document.getElementById('import-data-input')?.addEventListener('change', (e) => {
            const file = e.target.files[0]; if(!file)return; const reader=new FileReader();
            reader.onload=function(ev){ try{const data=JSON.parse(ev.target.result); if(data.prompts&&data.folders&&confirm('Remplacer données?')){storage.savePrompts(data.prompts);storage.saveFolders(data.folders);ui.showToast('Import réussi !','success');ui.updatePromptCount();ui.switchTab('library');}}catch(err){ui.showToast('Fichier invalide.','error');}};
            reader.readAsText(file);
        });
        ui.switchTab('creator');
        ui.updatePromptCount();
    }
    init();
});
