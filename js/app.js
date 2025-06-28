document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // ÉTAT GLOBAL DE L'APPLICATION
    // =================================================================================
    const state = {
        currentStep: 0,
        formData: { persona_role: '', persona_context: '', persona_style: '', objective: '', category: 'général', methodology: '', use_chain_of_thought: true, context: '', structure: '', constraints: '' },
        currentFolderId: 'all',
        editingPromptId: null,
    };

    // =================================================================================
    // CONSTANTES ET CONFIGURATION
    // =================================================================================
    const WIZARD_STEPS = [
        { title: 'Qui est l\'IA ? (Persona)' }, { title: 'Quel est l\'objectif final ?' },
        { title: 'Comment l\'IA doit-elle raisonner ?' }, { title: 'Quel contexte fournir ?' },
        { title: 'Quelle est la structure de la réponse ?' }, { title: 'Quelles sont les contraintes ?' }
    ];
    
    // =================================================================================
    // MODULE DE STOCKAGE (localStorage)
    // =================================================================================
    const storage = {
        get: (key) => JSON.parse(localStorage.getItem(key)) || [],
        set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        getPrompts: () => storage.get('prompts'),
        savePrompts: (p) => storage.set('prompts', p),
        getFolders: () => storage.get('prompt_folders'),
        saveFolders: (f) => storage.set('prompt_folders', f),
    };

    // =================================================================================
    // MODULE DE LOGIQUE MÉTIER
    // =================================================================================
    const logic = {
        saveNewPrompt: (d) => { const all = storage.getPrompts(); all.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...d }); storage.savePrompts(all); },
        updatePrompt: (id, d) => { let all = storage.getPrompts(); const i = all.findIndex(p => p.id === id); if (i > -1) all[i] = { ...all[i], ...d, updatedAt: new Date().toISOString() }; storage.savePrompts(all); },
        deletePrompt: (id) => { storage.savePrompts(storage.getPrompts().filter(p => p.id !== id)); },
        saveFolder: (n) => { const all = storage.getFolders(); all.push({ id: Date.now().toString(), name: n }); storage.saveFolders(all); },
        deleteFolder: (id) => { storage.saveFolders(storage.getFolders().filter(f => f.id !== id)); const all = storage.getPrompts().map(p => { if (p.folderId === id) p.folderId = null; return p; }); storage.savePrompts(all); },
        updatePromptFolder: (pId, fId) => { const all = storage.getPrompts(); const i = all.findIndex(p => p.id === pId); if (i > -1) { all[i].folderId = fId === 'null' ? null : fId; storage.savePrompts(all); } },
        buildFinalPrompt: () => {
            let parts = []; const d = state.formData; const useCoT = document.getElementById('use_chain_of_thought')?.checked ?? true;
            if (d.persona_role) { let s = `Tu es un ${d.persona_role}`; if (d.persona_context) s += `, ${d.persona_context}`; if (d.persona_style) s += `. Ton style est ${d.persona_style}.`; parts.push(`**Persona:**\n${s}`); }
            if (d.objective) parts.push(`**Objectif:**\n${d.objective}`);
            let mStr = useCoT ? "Réfléchis étape par étape. " : ""; if (d.methodology) mStr += d.methodology; if (mStr.trim()) parts.push(`**Méthodologie:**\n${mStr}`);
            if (d.context) parts.push(`**Contexte:**\n${d.context}`); if (d.structure) parts.push(`**Structure:**\n${d.structure}`); if (d.constraints) parts.push(`**Contraintes:**\n${d.constraints}`);
            return parts.join('\n\n---\n\n');
        }
    };

    // =================================================================================
    // MODULE UI (Manipulation du DOM)
    // =================================================================================
    const ui = {
        showToast: (m, t='info') => { const c=document.getElementById('toast-container'); if(!c)return; const e=document.createElement('div'); e.className=`toast ${t}`; e.innerHTML=`<span class="toast-icon">${t==='success'?'✔️':'ℹ️'}</span> ${m}`; c.appendChild(e); setTimeout(()=>e.classList.add('show'),10); setTimeout(()=>{e.classList.remove('show');e.addEventListener('transitionend',()=>e.remove());},3000); },
        updatePromptCount: () => { const el = document.getElementById('prompt-count'); if (el) el.textContent = `${storage.getPrompts().length} prompt(s)`; },
        switchTab: (t) => { document.querySelectorAll('.main-content>[id$="-section"]').forEach(s=>s.classList.add('hidden')); document.getElementById(`${t}-section`)?.classList.remove('hidden'); document.querySelectorAll('.sidebar .nav-item').forEach(i=>i.classList.toggle('active',i.dataset.tab===t)); if(t==='library'){ui.renderFolders();ui.renderPromptLibrary();}if(t==='freeform'){ui.resetFreeformForm();} },
        updateStepDisplay: () => { const cS=document.getElementById('creator-section'); if(!cS)return; cS.querySelectorAll('.step-content').forEach(e=>e.classList.add('hidden')); document.getElementById(`step-${state.currentStep}`)?.classList.remove('hidden'); document.getElementById('step-title').textContent=WIZARD_STEPS[state.currentStep].title; cS.querySelectorAll('.steps-indicator .step').forEach((e,i)=>{e.classList.toggle('active',i===state.currentStep);e.classList.toggle('completed',i<state.currentStep);}); document.getElementById('prev-btn').classList.toggle('hidden',state.currentStep===0); document.getElementById('next-btn').textContent=(state.currentStep===WIZARD_STEPS.length-1)?'Créer Prompt':'Suivant'; },
        resetWizardForm: () => { state.currentStep=0; state.formData={}; document.querySelectorAll('#creator-section input:not([type=checkbox]),#creator-section textarea,#creator-section select').forEach(e=>e.value=''); const c=document.getElementById('use_chain_of_thought');if(c)c.checked=true; ui.updateStepDisplay(); ui.updateQualityAnalyzer(); },
        resetFreeformForm: () => { state.editingPromptId=null; document.getElementById('freeform-prompt-title').value=''; document.getElementById('freeform-prompt-content').value=''; document.getElementById('freeform-prompt-category').value='général'; document.getElementById('save-freeform-btn').textContent='Sauvegarder'; },
        renderFolders: () => { const l=document.getElementById('folder-list'); if(!l)return; l.innerHTML=`<li class="folder-item ${state.currentFolderId==='all'?'active':''}" data-id="all">Tous</li><li class="folder-item ${state.currentFolderId==='uncategorized'?'active':''}" data-id="uncategorized">Non classés</li>`; storage.getFolders().forEach(f=>{l.innerHTML+=`<li class="folder-item ${state.currentFolderId===f.id?'active':''}" data-id="${f.id}"><span>${f.name}</span><button class="delete-folder-btn" data-id="${f.id}">×</button></li>`;}); },
        renderPromptLibrary: () => { const c=document.getElementById('prompt-library-list'); if(!c)return; let p=storage.getPrompts(); if(state.currentFolderId==='uncategorized')p=p.filter(p=>!p.folderId); else if(state.currentFolderId!=='all')p=p.filter(p=>p.folderId===state.currentFolderId); const sT=document.getElementById('search-input')?.value.toLowerCase()||''; if(sT)p=p.filter(pr=>(pr.title+pr.content).toLowerCase().includes(sT)); const sV=document.getElementById('sort-select')?.value||'newest'; p.sort((a,b)=>{switch(sV){case'oldest':return new Date(a.createdAt)-new Date(b.createdAt);default:return new Date(b.createdAt)-new Date(a.createdAt);}}); c.innerHTML=p.length===0?'<p style="text-align:center;padding:40px 0;">Aucun prompt.</p>':''; p.forEach(pr=>{const card=document.createElement('div');card.className='prompt-card';card.dataset.id=pr.id;const fO=storage.getFolders().map(f=>`<option value="${f.id}" ${pr.folderId===f.id?'selected':''}>${f.name}</option>`).join('');const sH=`<select class="form-select btn-sm" data-action="move"><option value="null" ${!pr.folderId?'selected':''}>Non classé</option>${fO}</select>`;card.innerHTML=`<div class="prompt-card-header"><h4 class="prompt-card-title">${pr.title}</h4><span class="prompt-card-category">${pr.category}</span></div><p class="prompt-card-content">${pr.content}</p><div class="prompt-card-footer"><small>Créé: ${new Date(pr.createdAt).toLocaleDateString('fr-FR')}</small><div class="prompt-card-actions">${sH}<button class="btn btn-sm" data-action="edit">Modifier</button><button class="btn btn-sm" data-action="copy">Copier</button><button class="btn btn-sm" data-action="delete">Suppr.</button></div></div>`;c.appendChild(card);}); },
        updateQualityAnalyzer: () => {
            const analyzerEl = document.getElementById('quality-analyzer'); if (!analyzerEl) return;
            let score = 0; const suggestions = []; const data = state.formData;
            if (data.persona_role) score += 2; else suggestions.push("Définir un rôle précis améliore la spécialisation.");
            if (data.objective) { score += 2; if (data.objective.length < 30) suggestions.push("Un objectif plus détaillé est souvent plus efficace."); } else { suggestions.push("L'Objectif est la partie la plus critique."); }
            if (document.getElementById('use_chain_of_thought')?.checked) score += 2; else suggestions.push("Cochez 'Réfléchis étape par étape' pour les tâches complexes.");
            if (data.context) score += 2; if (data.structure) score += 1; if (data.constraints) score += 1;
            const hasContent = Object.values(data).some(v => typeof v === 'string' && v.length > 0);
            analyzerEl.classList.toggle('hidden', !hasContent); if (!hasContent) return;
            const sC=document.getElementById('score-circle'), sL=document.getElementById('score-label'), sCo=document.getElementById('suggestions-container'), sLi=document.getElementById('suggestions-list');
            if(sC)sC.textContent=`${score}/10`; const sClass=score<4?'score-poor':score<7?'score-average':'score-good'; if(sC)sC.className=`score-circle ${sClass}`;
            if(sL)sL.textContent=score<4?'Qualité: Basique':score<7?'Qualité: Efficace':'Qualité: Experte';
            if(sCo)sCo.classList.toggle('hidden',suggestions.length===0); if(sLi){sLi.innerHTML=''; suggestions.forEach(s=>{const li=document.createElement('li');li.className='suggestion-item';li.textContent=s;sLi.appendChild(li);});}
        },
        openPromptModal(promptId) {
            const prompt = storage.getPrompts().find(p => p.id === promptId); if (!prompt) return;
            const modal = document.getElementById('prompt-modal'), title = document.getElementById('modal-title'), body = document.getElementById('modal-body');
            if (modal && title && body) { title.textContent = prompt.title; body.textContent = prompt.content; modal.classList.remove('hidden'); }
        },
        closePromptModal() { const modal = document.getElementById('prompt-modal'); if (modal) modal.classList.add('hidden'); },
    };

    const handlers = {
        init() {
            const app = document.querySelector('.app'); if (!app) return;
            app.addEventListener('click', handlers.globalClickHandler);
            app.addEventListener('input', handlers.globalInputHandler);
            document.getElementById('import-data-btn')?.addEventListener('click', () => document.getElementById('import-data-input').click());
            document.getElementById('import-data-input')?.addEventListener('change', handlers.importHandler);
            ui.switchTab('creator');
            ui.updatePromptCount();
        },
        globalClickHandler(e) {
            const target = e.target;
            if (target.closest('#modal-close-btn') || target.id === 'prompt-modal') { return ui.closePromptModal(); }
            if (target.closest('.nav-item')) return ui.switchTab(target.closest('.nav-item').dataset.tab);
            if (target.closest('#next-btn')) { if (state.currentStep < WIZARD_STEPS.length - 1) { state.currentStep++; ui.updateStepDisplay(); } else { const p = logic.buildFinalPrompt(); if (!p) return ui.showToast('Prompt vide.', 'error'); logic.saveNewPrompt({ title: (state.formData.objective || 'Nouveau Prompt').substring(0, 40), content: p, category: state.formData.category || 'général' }); ui.showToast('Prompt créé !', 'success'); ui.resetWizardForm(); ui.updatePromptCount(); } }
            else if (target.closest('#prev-btn')) { if (state.currentStep > 0) { state.currentStep--; ui.updateStepDisplay(); } }
            else if (target.closest('#save-freeform-btn')) { const c=document.getElementById('freeform-prompt-content').value.trim(); let t=document.getElementById('freeform-prompt-title').value.trim(); if(!c)return ui.showToast('Contenu vide.','error'); if(!t)t=c.substring(0,40)+'...'; const d={title:t,content:c,category:document.getElementById('freeform-prompt-category').value}; if(state.editingPromptId){logic.updatePrompt(state.editingPromptId,d);ui.showToast('Prompt mis à jour!','success');}else{logic.saveNewPrompt(d);ui.showToast('Prompt sauvegardé!','success');} ui.updatePromptCount(); ui.switchTab('library'); }
            else if (target.closest('#new-folder-btn')) { const n=prompt('Nom:'); if(n&&n.trim()){logic.saveFolder(n.trim());ui.renderFolders();} }
            else if (target.closest('.delete-folder-btn')) { const id=target.dataset.id; if(confirm('Supprimer dossier?')){logic.deleteFolder(id);state.currentFolderId='all';ui.renderFolders();ui.renderPromptLibrary();} }
            else if (target.closest('.folder-item')) { state.currentFolderId = target.closest('.folder-item').dataset.id; ui.renderFolders(); ui.renderPromptLibrary(); }
            else if (target.closest('#export-data-btn')) { const d={prompts:storage.getPrompts(),folders:storage.getFolders()}; const s=JSON.stringify(d,null,2); const b=new Blob([s],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`prompt_export.json`; a.click(); URL.revokeObjectURL(a.href); }
            const cardAction = target.closest('.prompt-card [data-action]');
            if (cardAction) { const a=cardAction.dataset.action, id=cardAction.closest('.prompt-card').dataset.id;
                if (a==='delete'){if(confirm('Supprimer?')){logic.deletePrompt(id);ui.renderPromptLibrary();}}
                else if (a==='copy'){const p=storage.getPrompts().find(p=>p.id===id);if(p)navigator.clipboard.writeText(p.content).then(()=>ui.showToast('Copié!','success'));}
                else if (a==='edit'){ state.editingPromptId=id; const p=storage.getPrompts().find(p=>p.id===id); ui.switchTab('freeform'); document.getElementById('freeform-prompt-title').value=p.title; document.getElementById('freeform-prompt-content').value=p.content; document.getElementById('freeform-prompt-category').value=p.category; document.getElementById('save-freeform-btn').textContent='Mettre à jour';}
                return;
            }
            const card = target.closest('.prompt-card');
            if (card) { ui.openPromptModal(card.dataset.id); }
        },
        globalInputHandler(e) {
            const target = e.target;
            const wizardInput = target.closest('#creator-section input, #creator-section textarea, #creator-section select');
            if (wizardInput) { state.formData[wizardInput.id] = wizardInput.type === 'checkbox' ? wizardInput.checked : wizardInput.value; ui.updateQualityAnalyzer(); }
            if (target.closest('#library-section')) { ui.renderPromptLibrary(); }
            const moveSelect=target.closest('[data-action="move"]');
            if(moveSelect) { const pId=moveSelect.closest('.prompt-card').dataset.id; logic.updatePromptFolder(pId,moveSelect.value); if(state.currentFolderId!=='all')ui.renderPromptLibrary(); ui.showToast('Déplacé.','info'); }
        },
        importHandler(e) {
            const file = e.target.files[0]; if(!file)return; const r=new FileReader();
            r.onload=function(ev){ try{const d=JSON.parse(ev.target.result); if(d.prompts&&d.folders&&confirm('Remplacer données?')){storage.savePrompts(d.prompts);storage.saveFolders(d.folders);ui.showToast('Import réussi!','success');ui.updatePromptCount();ui.switchTab('library');}}catch(err){ui.showToast('Fichier invalide.','error');}};
            r.readAsText(file);
        },
    };
    
    handlers.init();
});
