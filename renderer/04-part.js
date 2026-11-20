/* ---------- drawer, modals, edits ---------- */
const L=()=>$('#layer');
const rec=id=>S.rfp.find(r=>r.id===id)||S.comm.find(r=>r.id===id)||S.ai.find(r=>r.id===id);
function closeLayer(){const wasDrawer=!!$('.drawer');L().innerHTML='';if(wasDrawer){const r=rec(U.open);U.open=null;if(r&&!r.client&&!r.refNo&&!r.notes&&!r.solutions&&!r.remarks){delRec(r.id)}render()}}
function modal(html){L().innerHTML=`<div class="ov mid" data-act="ovbg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`}
function askType(msg,word){return new Promise(res=>{modal(`<h3>Delete all data?</h3><p>${msg}</p><p>Type <b>${word}</b> to confirm.</p><input id="delw" class="cell" style="border:1px solid #c5d2e8;border-radius:8px;width:100%;height:36px" autocomplete="off"><div class="mf"><button class="btn" id="n">Cancel</button><button class="btn dng" id="y" disabled style="opacity:.5">Delete everything</button></div>`);const i=$('#delw'),y=$('#y');i.focus();i.oninput=()=>{const ok=i.value.trim()===word;y.disabled=!ok;y.style.opacity=ok?1:.5};$('#n').onclick=()=>{L().innerHTML='';res(false)};y.onclick=()=>{L().innerHTML='';res(true)}})}
function ask(msg,okLabel){return new Promise(res=>{modal(`<h3>Please confirm</h3><p>${msg}</p><div class="mf"><button class="btn" id="n">Cancel</button><button class="btn dng" id="y">${okLabel||'Confirm'}</button></div>`);$('#n').onclick=()=>{L().innerHTML='';res(false)};$('#y').onclick=()=>{L().innerHTML='';res(true)}})}
function openDrawer(id){const r=rec(id);if(!r)return;U.open=id;
const f=(k,l,type,w)=>`<label class="fld${w?' w':''}"><span>${l}</span><input data-f="${k}" type="${type||'text'}" value="${esc(r[k])}"></label>`;
const ta=(k,l)=>`<label class="fld w"><span>${l}</span><textarea data-f="${k}" rows="2">${esc(r[k])}</textarea></label>`;
const sel=(k,l,opts,blank)=>`<label class="fld"><span>${l}</span><select data-f="${k}">${blank?'<option value=""></option>':''}${opts.map(o=>`<option${o===r[k]?' selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
const kws=(r.keywords||'').split(',').map(x=>x.trim()).filter(Boolean);
if(MODE!=='rfp'){L().innerHTML=`<div class="ov" data-act="ovbg"><div class="drawer" role="dialog" aria-modal="true"><div class="dh"><div><h2 id="dt">${esc(r.client)||'New row'}</h2><small id="dsub">${r.type} · ${stOf(r)[1]}</small></div><button class="x" data-act="closeD" aria-label="Close">${ic('x')}</button></div>
<div class="ds"><h4>Commercials</h4><div class="fg">${f('client','Client name')}${sel('type','Type',TYPES)}${f('process','Process')}${f('location','Location')}${f('solution','Solution',null,1)}
<label class="fld"><span>Rate (₹ per FTE per month)</span><input data-f="rate" data-money="1" placeholder="NA" value="${r.rate==null?'':fmt(r.rate)}"></label>
<label class="fld"><span>FTE count</span><input data-f="fte" type="number" min="0" placeholder="NA" value="${r.fte==null?'':r.fte}"></label>
<label class="fld"><span>Monthly revenue (rate × FTE)</span><div class="ro" id="rvo">${fmt(val(r))||'–'}</div></label>${sel('consultant','Consultant (Y/N)',['Y','N'],1)}</div></div>
<div class="ds"><h4>Status and ownership</h4><div class="fg"><label class="fld"><span>Current status</span><select data-f="stage">${STAGES.map(s=>`<option value="${s[0]}"${s[0]==r.stage?' selected':''}>${s[0]} · ${s[1]} (${s[2]}%)</option>`).join('')}</select></label>
<label class="fld"><span id="plab">${r.type==='Farming'?'Win probability % (manual)':'Win probability (from status)'}</span>${r.type==='Farming'?`<input data-f="prob" type="number" min="0" max="100" value="${r.prob==null?'':r.prob}">`:`<div class="ro" id="pro">${probOf(r)}%</div>`}</label>${sel('owner','BD person',ownersAll())}${f('nextAction','Next action')}${f('nextDate','Next action date','date')}${ta('notes','Remarks')}</div></div>
${S.customCols.length?`<div class="ds"><h4>Custom fields</h4><div class="fg">${S.customCols.map(c=>custField(r,c)).join('')}</div></div>`:''}
<div class="ds" style="display:flex;justify-content:space-between;gap:10px"><button class="btn dng" data-act="delrec" data-id="${r.id}">${ic('tr')} Delete row</button><button class="btn pri" data-act="closeD">Done</button></div></div></div>`;$('.dh').insertAdjacentHTML('afterend',linkStrip(r));return}
L().innerHTML=`<div class="ov" data-act="ovbg"><div class="drawer" role="dialog" aria-modal="true"><div class="dh"><div><h2 id="dt">${esc(r.client)||'New record'}</h2><small id="dsub">${esc(r.refNo)} ${r.refNo?'·':''} ${r.type} · ${stOf(r)[1]}</small></div><button class="x" data-act="closeD" aria-label="Close">${ic('x')}</button></div>
<div class="ds"><h4>Opportunity</h4><div class="fg">${sel('type','Type',TYPES)}${f('client','Issuing organisation / client')}${f('refNo','Bid / Ref no')}${f('category','Category')}${sel('owner','BD person',ownersAll())}
<label class="fld"><span>Stage</span><select data-f="stage">${STAGES.map(s=>`<option value="${s[0]}"${s[0]==r.stage?' selected':''}>${s[0]} · ${s[1]} (${s[2]}%)</option>`).join('')}</select></label>
<label class="fld"><span id="plab">${r.type==='Farming'?'Probability % (manual)':'Probability (from stage)'}</span>${r.type==='Farming'?`<input data-f="prob" type="number" min="0" max="100" value="${r.prob==null?'':r.prob}">`:`<div class="ro" id="pro">${probOf(r)}%</div>`}</label>
<label class="fld"><span>Value (₹)</span><input data-f="value" data-money="1" value="${r.value==null?'':fmt(r.value)}"></label>
<label class="fld"><span>Fit score (0–100)</span><input data-f="fit" type="number" min="0" max="100" value="${r.fit==null?'':r.fit}"></label>${f('nextAction','Next action')}${f('nextDate','Next action date','date')}</div></div>
<div class="ds"><h4>Current vendor and commercials</h4><p class="note">The incumbent arrangement and what the client expects. Use this to price the bid.</p><div class="fg">${f('vendor','Current vendor')}${f('vendorLoc','Location of vendor')}<label class="fld"><span>Current rate (₹)</span><input data-f="curRate" data-money="1" value="${r.curRate==null?'':fmt(r.curRate)}"></label><label class="fld"><span>Rate expected by client (₹)</span><input data-f="expRate" data-money="1" value="${r.expRate==null?'':fmt(r.expRate)}"></label>${f('curFte','Current FTE / headcount','number')}${f('incEnd','Current contract end','date')}<label class="fld"><span>Current agent salary (₹ per month)</span><input data-f="agentSal" data-money="1" value="${r.agentSal==null?'':fmt(r.agentSal)}"></label><label class="fld"><span>Current support salary (₹ per month)</span><input data-f="supportSal" data-money="1" value="${r.supportSal==null?'':fmt(r.supportSal)}"></label>${ta('curScope','Current scope of work')}</div></div>
<div class="ds"><h4>Source and dates</h4><div class="fg">${f('portal','Source portal')}${sel('sourceType','Source type',SRC,1)}${f('published','Published','date')}${f('closing','Closing date','date')}${f('closingTime','Closing time','time')}${f('firstSeen','First seen')}</div></div>
<div class="ds"><h4>Fit and scope</h4><div class="fg">${ta('fitReason','Why it fits us')}<label class="fld w"><span>Matched keywords (comma separated)</span><input data-f="keywords" value="${esc(r.keywords)}"><div class="kw" id="kw">${kws.map(k=>`<span>${esc(k)}</span>`).join('')}</div></label>${ta('scope','Scope')}${f('link','Link (tender listing)','url',1)}${f('rfpDoc','RFP document link','url',1)}${f('rfpDocNote','RFP document note',null,1)}${ta('notes','Notes')}</div></div>
<div class="ds"><h4>RFP requirements</h4><p class="note">Filled from the tender notice where it says so. A dash means the notice doesn't say; check the RFP document.</p><div class="rq">${REQ.map(q=>`<label for="rq-${q[0]}">${q[1]}</label><textarea id="rq-${q[0]}" data-rq="${q[0]}" rows="2">${esc((r.req||{})[q[0]])}</textarea>`).join('')}</div></div>
${S.customCols.length?`<div class="ds"><h4>Custom fields</h4><div class="fg">${S.customCols.map(c=>custField(r,c)).join('')}</div></div>`:''}
<div class="ds" style="display:flex;justify-content:space-between;gap:10px"><button class="btn dng" data-act="delrec" data-id="${r.id}">${ic('tr')} Delete record</button><button class="btn pri" data-act="closeD">Done</button></div></div></div>`;
$('.dh').insertAdjacentHTML('afterend',linkStrip(r));
L().querySelectorAll('textarea').forEach(t=>{t.style.height='auto';t.style.height=Math.min(240,t.scrollHeight+2)+'px'})}
function linkStrip(r){let h;
if(MODE==='rfp'){const c=r.commId&&S.comm.find(x=>x.id===r.commId);h=`<label class="fld w"><span>Bid decision</span><select data-f="decision">${DECS.map(d=>`<option${d===r.decision?' selected':''}>${d}</option>`).join('')}</select></label>${c?`<div style="margin-top:10px"><button class="btn" data-act="gocomm" data-id="${r.id}">Open linked commercials row ↗</button> <button class="btn" data-act="unlink" data-id="${r.id}">Unlink</button></div>`:`<p class="note" style="margin:8px 0 0">Choose Selected to apply to add a linked row to the Commercials tracker, or link an existing row below.</p><div class="lkrow"><select id="lk" data-lk="${r.id}"><option value="">Link to existing commercials row…</option>${S.comm.filter(x=>!x.rfpId).map(x=>`<option value="${x.id}">${esc(x.client||'(no client)')}${x.process?' – '+esc(x.process):''}</option>`).join('')}</select></div>`}`}
else{const p=r.rfpId&&S.rfp.find(x=>x.id===r.rfpId);h=p?`<p class="note">Linked to RFP <b>${esc(p.client)}</b> ${esc(p.refNo)}</p><button class="btn" data-act="gorfp" data-id="${r.id}">Open RFP evaluation ↗</button> <button class="btn" data-act="unlink" data-id="${r.id}">Unlink</button>`:`<p class="note" style="margin:0 0 8px">Not linked to an RFP.</p><div class="lkrow"><select id="lk" data-lk="${r.id}"><option value="">Link to an RFP…</option>${S.rfp.filter(x=>!x.commId).map(x=>`<option value="${x.id}">${esc(x.client||'(no client)')} ${esc(x.refNo||'')}</option>`).join('')}</select></div>`}
return`<div class="ds"><h4>${MODE==='rfp'?'Bid decision and link':'Link to RFP'}</h4>${h}</div>`}
function delRec(id){if(S.ai.some(x=>x.id===id)){S.ai=S.ai.filter(x=>x.id!==id);gone.add('ai/'+id);sched();return}if(S.rfp.some(x=>x.id===id)){S.rfp=S.rfp.filter(x=>x.id!==id);gone.add(id);S.comm.forEach(c=>{if(c.rfpId===id){c.rfpId='';touch(c.id)}})}else{S.comm=S.comm.filter(x=>x.id!==id);gone.add('commercials/'+id);S.rfp.forEach(r=>{if(r.commId===id){r.commId='';if(r.decision==='Selected to apply')r.decision='Under evaluation';touch(r.id)}})}sched()}
function refreshAfterLink(){const o=U.open;if(o&&$('.drawer'))openDrawerKeep(o);else U.open=null;render()}
async function decisionChanged(r,old){
if(r.decision==='Selected to apply'){let c=r.commId&&S.comm.find(x=>x.id===r.commId);if(!c){c=blank('RFP');Object.assign(c,{client:r.client,process:(r.req||{}).process||r.category||'',location:(r.req||{}).location||'',owner:r.owner,stage:r.stage,nextDate:r.closing||'',nextAction:'Prepare commercial bid',notes:`Linked to RFP ${r.refNo||''}. Rate and FTE to be priced.`,rfpId:r.id,ts:Date.now()});S.comm.push(c);r.commId=c.id;touch(c.id);toast('Linked row added to the Commercials tracker')}}
else if(old==='Selected to apply'&&r.commId){const c=S.comm.find(x=>x.id===r.commId);if(c){const rm=await ask('This RFP is no longer selected to apply. Remove its linked row from the Commercials tracker?','Remove row');if(rm)delRec(c.id);else{c.rfpId='';touch(c.id);r.commId=''}}else r.commId=''}
touch(r.id);refreshAfterLink()}
/* generic commit */
function setVal(r,k,v){if(k.startsWith('c:')){r.custom=r.custom||{};r.custom[k.slice(2)]=v}else r[k]=v}
function commitValue(r,k,el,final){let v=el.value;
if(k==='decision'){const old=r.decision;r.decision=v;setTimeout(()=>decisionChanged(r,old),0);return true}
if(k.startsWith('c:')&&el.dataset.cfmt){const f=el.dataset.cfmt,ck=k.slice(2);r.custom=r.custom||{};
if(f==='currency'){if(!final)return false;const m=parseMoney(v);if(Number.isNaN(m)){toast('Enter an amount in rupees, e.g. 1,50,000');el.value=fmt(r.custom[ck])||'';return false}r.custom[ck]=m;el.value=m==null?'':fmt(m);return true}
if(f==='number'||f==='percent'){v=v===''?null:+v;if(f==='percent'&&v!=null)v=Math.max(0,Math.min(100,v))}
r.custom[ck]=v;return true}
if(el.dataset.money){if(!final)return false;const m=parseMoney(v);if(Number.isNaN(m)){toast('Enter an amount in rupees, e.g. 60,000');el.value=r[k]==null?'':fmt(r[k]);return false}r[k]=m;el.value=m==null?'':fmt(m);return true}
if(k==='stage')v=+v;else if(k==='fte'||k==='curFte')v=v===''?null:Math.max(0,+v);else if(k==='fit'||k==='prob')v=v===''?null:Math.max(0,Math.min(100,+v));
setVal(r,k,v);return true}
function afterChange(r,k,fromDrawer){touch(r.id);
if(MODE==='rfp'&&r.commId&&(k==='client'||k==='owner'||k==='closing')){const c=S.comm.find(x=>x.id===r.commId);if(c){if(k==='client')c.client=r.client;if(k==='owner')c.owner=r.owner;if(k==='closing')c.nextDate=r.closing;touch(c.id)}}
if(U.view==='pipeline'){const tb=$('#tb');const tr=tb&&tb.querySelector(`tr[data-id="${r.id}"]`);
if(tr){if(k==='type'||k==='stage'||k==='decision'||(fromDrawer&&k==='prob')||(fromDrawer&&k!=='client')&&false){tr.outerHTML=rowHTML(r,[...tb.children].indexOf(tr))}else refreshRow(tr,r,fromDrawer,k)}
$('#kpis').innerHTML=kpiHTML(S.records);$('#chips').innerHTML=chipsHTML();$('#tfoot').innerHTML=footHTML()}
if(fromDrawer){$('#dt').textContent=r.client||'New record';$('#dsub').textContent=MODE==='rfp'?`${r.refNo||''} ${r.refNo?'·':''} ${r.type} · ${stOf(r)[1]}`:`${r.type} · ${stOf(r)[1]}`;const po=$('#pro');if(po)po.textContent=probOf(r)+'%';const rv=$('#rvo');if(rv)rv.textContent=fmt(val(r))||'–';
if(k==='type'){openDrawerKeep(r.id)}if(k==='keywords'){$('#kw').innerHTML=(r.keywords||'').split(',').map(x=>x.trim()).filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}}}
function openDrawerKeep(id){const sc=$('.drawer').scrollTop;openDrawer(id);$('.drawer').scrollTop=sc}
function refreshRow(tr,r,fromDrawer,k){const cs=visCols();const tds=[...tr.children].slice(2);
if(fromDrawer){cs.forEach((c,j)=>{const td=tds[j];if(!td||td.contains(document.activeElement))return;td.innerHTML=cellHTML(r,c)})}
else{['days','weighted','prob','fit','rev'].forEach(n=>{const e=tr.querySelector(`[data-cell="${n}"]`);if(!e)return;const c=cs.find(x=>x.t===(n==='days'?'days':n));if(!c)return;const tmp=document.createElement('div');tmp.innerHTML=cellHTML(r,c);const ne=tmp.querySelector(`[data-cell="${n}"]`);if(ne)e.replaceWith(ne)})}}
/* events */
document.addEventListener('input',e=>{const el=e.target;
if(el.dataset.ai){if(el.tagName!=='SELECT'&&!el.dataset.money)aiEdit(el,false);return}
if(el.id==='q'&&MODE==='ai'){U.q=el.value;$('#aitw').innerHTML=aiTableHTML();$('#aif').innerHTML=aiFootHTML();return}
if(el.id==='q'){U.q=el.value;$('#tw').innerHTML=tableHTML();$('#tfoot').innerHTML=footHTML();return}
if(el.dataset.k&&el.closest('#tb')){const r=rec(el.dataset.id);if(!r||el.tagName==='SELECT'||el.type==='date'||el.dataset.money)return;if(commitValue(r,el.dataset.k,el,false))afterChange(r,el.dataset.k,false)}
else if(el.dataset.f&&el.closest('.drawer')){const r=rec(U.open);if(!r||el.tagName==='SELECT'||el.dataset.money||el.type==='date'||el.type==='time')return;if(commitValue(r,el.dataset.f,el,false))afterChange(r,el.dataset.f,true)}
else if(el.dataset.rq){const r=rec(U.open);r.req=r.req||{};r.req[el.dataset.rq]=el.value;touch(r.id);el.style.height='auto';el.style.height=Math.min(240,el.scrollHeight+2)+'px'}
else if(el.dataset.cu){const r=rec(U.open);r.custom=r.custom||{};r.custom[el.dataset.cu]=el.value;touch(r.id)}});
document.addEventListener('change',e=>{const el=e.target;
if(el.dataset.ai){aiEdit(el,true);return}
if(el.dataset.k&&el.closest('#tb')){const r=rec(el.dataset.id);if(r&&commitValue(r,el.dataset.k,el,true))afterChange(r,el.dataset.k,false)}
else if(el.dataset.f&&el.closest('.drawer')){const r=rec(U.open);if(r&&commitValue(r,el.dataset.f,el,true))afterChange(r,el.dataset.f,true)}
else if(el.id==='cf'){const H={text:'Example entry: any free text.',number:'Example entry: 25 or 12.5',currency:'Example entry: 1,50,000 (amount in rupees)',percent:'Example entry: 40 (a value from 0 to 100)',date:'Example entry: pick a date',yesno:'Entry is a Yes / No dropdown.',list:'Entry is a dropdown of the options you list above.'};$('#cow').style.display=el.value==='list'?'flex':'none';$('#chint').textContent=H[el.value]}
else if(el.id==='colchk'||el.dataset.colk){const k=el.dataset.colk;S.hidden=el.checked?S.hidden.filter(x=>x!==k):S.hidden.concat(k);saveHidden()}
else if(el.dataset.lk!==undefined){if(el.value){const me=rec(el.dataset.lk),o=rec(el.value);if(me&&o){const r=S.rfp.includes(me)?me:o,c=r===me?o:me;r.commId=c.id;c.rfpId=r.id;if(r.decision!=='Selected to apply')r.decision='Selected to apply';touch(r.id);touch(c.id);toast('Linked');refreshAfterLink()}}}
else if(el.id==='fileIn'&&el.files[0])handleFile(el.files[0])});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');
if(!e.target.closest('.acts'))$('#exm')&&($('#exm').hidden=true);if(!b)return;const a=b.dataset.act,v=b.dataset.v,id=b.dataset.id;
if(a==='ovbg'){if(e.target===b){if($('.drawer'))closeLayer();else L().innerHTML=''}return}
switch(a){
case'tab':U.view=v;location.hash=MODE+'-'+v;render();break;
case'nav':{const m=b.dataset.m;if(m!==MODE){L().innerHTML='';U.open=null;setMode(m)}U.view=v;location.hash=m+'-'+v;render();break}
case'unlink':{const me=rec(id);if(!me)break;const isR=S.rfp.includes(me),o=isR?S.comm.find(x=>x.id===me.commId):S.rfp.find(x=>x.id===me.rfpId);if(isR)me.commId='';else me.rfpId='';if(o){if(isR)o.rfpId='';else o.commId=''}touch(me.id);o&&touch(o.id);toast('Unlinked');refreshAfterLink();break}
case'bkexport':if(window.desk){const r=await desk.exportBackup();if(r&&r.ok)toast('Backup exported')}break;
case'bkimport':if(window.desk)await desk.importBackup();break;
case'bkfolder':if(window.desk)desk.openBackupFolder();break;
case'chkupd':if(window.desk)desk.checkUpdates();break;
case'resetall':{if(await askType('This permanently deletes ALL RFPs, Commercials rows, AI solutions, people and custom columns, and starts a blank tracker. Export to Excel first if you need a copy. This cannot be undone.','DELETE')){try{await window.__flushNow();if(window.desk)await desk.safetyBackup('before-delete-all')}catch(e){}S.rfp.forEach(r=>gone.add(r.id));S.comm.forEach(c=>gone.add('commercials/'+c.id));S.ai.forEach(a=>gone.add('ai/'+a.id));dirty.clear();S.rfp=[];S.comm=[];S.ai=[];S.people=[];S.ccols={rfp:[],comm:[],ai:[]};if(U.db){U.remote=true;S.commInit=true}metaDirty=true;try{localStorage.removeItem('rpt-data2')}catch(e){}L().innerHTML='';U.open=null;U.view='pipeline';location.hash=MODE+'-pipeline';sched();render();toast('All data deleted. Ready for a fresh start.')}break}
case'mode':L().innerHTML='';U.open=null;setMode(v);location.hash=v+'-pipeline';render();break;
case'gocomm':{const r=S.rfp.find(x=>x.id===id),c=r&&S.comm.find(x=>x.id===r.commId);if(c){L().innerHTML='';U.open=null;setMode('comm');location.hash='comm-pipeline';render();openDrawer(c.id)}break}
case'gorfp':{const r=S.comm.find(x=>x.id===id),p=r&&S.rfp.find(x=>x.id===r.rfpId);if(p){L().innerHTML='';U.open=null;setMode('rfp');location.hash='rfp-pipeline';render();openDrawer(p.id)}break}
case'chip':U.chip=v;$('#chips').innerHTML=chipsHTML();$('#tw').innerHTML=tableHTML();$('#tfoot').innerHTML=footHTML();break;
case'sort':if(U.sort===v)U.dir=-U.dir;else{U.sort=v;U.dir=1}$('#tw').innerHTML=tableHTML();break;
case'open':openDrawer(id);break;
case'closeD':closeLayer();break;
case'aichip':U.chip=v;$('#aichips').innerHTML=aiChipsHTML();$('#aitw').innerHTML=aiTableHTML();$('#aif').innerHTML=aiFootHTML();break;
case'aiopen':openAIDrawer(id);break;
case'aidel':if(await ask('Delete this row permanently? This cannot be undone.','Delete row')){delRec(id);U.open=null;L().innerHTML='';render();toast('Row deleted')}break;
case'addrow':{if(MODE==='ai'){const a=blankA();S.ai.push(a);touch(a.id);$('#aitw').innerHTML=aiTableHTML();$('#aif').innerHTML=aiFootHTML();$('#aik').innerHTML=aiKpiHTML();$('#aichips').innerHTML=aiChipsHTML();openAIDrawer(a.id);break}const r=blank(TYPES.includes(U.chip)?U.chip:DEFT);if(S.people[0]&&U.view==='person'&&U.person)r.owner=U.person;S.records.push(r);touch(r.id);if(U.view==='pipeline'){const tb=$('#tb');if(tb)tb.insertAdjacentHTML('beforeend',rowHTML(r,tb.children.length))}openDrawer(r.id);break}
case'delrec':if(await ask('Delete this record permanently? This cannot be undone.','Delete record')){delRec(id);U.open=null;L().innerHTML='';render();toast('Record deleted')}break;
case'person':U.view='person';U.person=v;location.hash=MODE+'-person-'+encodeURIComponent(v).replace(/[^a-zA-Z0-9]/g,'');render();break;
case'addperson':modal(`<h3>Add BD person</h3><p>Each person gets a performance page with win rate, pipeline and stage mix.</p><label class="fld"><span>Name</span><input id="pn" autofocus></label><div class="mf"><button class="btn" data-act="cancel">Cancel</button><button class="btn pri" data-act="savep">Add person</button></div>`);setTimeout(()=>$('#pn')&&$('#pn').focus(),30);break;
case'savep':{const n=$('#pn').value.trim();if(!n)return;if(!S.people.some(p=>p.toLowerCase()===n.toLowerCase())&&n!=='Unassigned'){S.people.push(n);metaDirty=true;sched()}U.view='person';U.person=n;L().innerHTML='';render();break}
case'cancel':L().innerHTML='';break;
case'rmperson':if(await ask(`Remove ${esc(v)} from the team? Their records stay and move to Unassigned.`,'Remove person')){S.rfp.concat(S.comm).forEach(r=>{if(r.owner===v){r.owner='Unassigned';touch(r.id)}});S.people=S.people.filter(p=>p!==v);metaDirty=true;sched();U.view='team';render()}break;
case'cols':modal(`<h3>Columns</h3><p>Choose which columns appear in the pipeline register.</p>${allCols().map(c=>`<div class="cr"><label><input type="checkbox" data-colk="${c.k}"${S.hidden.includes(c.k)?'':' checked'}> ${esc(c.l)}</label>${c.custom?`<button class="btn dng" data-act="delcol" data-v="${c.k.slice(2)}">Remove</button>`:''}</div>`).join('')}<div class="mf"><button class="btn pri" data-act="colsdone">Apply</button></div>`);break;
case'colsdone':L().innerHTML='';render();break;
case'delcol':if(await ask('Remove this custom column and its values?','Remove column')){S.customCols=S.customCols.filter(c=>c.key!==v);S.records.forEach(r=>{if(r.custom)delete r.custom[v];touch(r.id)});metaDirty=true;sched();L().innerHTML='';render()}break;
case'addcol':modal(`<h3>Add column</h3><p>Adds a column to every row in this register and to each record's details. Choose the entry format so values are checked and shown consistently.</p><label class="fld"><span>Column name</span><input id="cn"></label><label class="fld" style="margin-top:10px"><span>Entry format</span><select id="cf">${Object.keys(FMTN).map(k=>`<option value="${k}">${FMTN[k]}</option>`).join('')}</select></label><label class="fld" id="cow" style="margin-top:10px;display:none"><span>Dropdown options (comma separated)</span><input id="co" placeholder="e.g. Hot, Warm, Cold"></label><p id="chint" style="margin-top:10px">Example entry: any free text.</p><div class="mf"><button class="btn" data-act="cancel">Cancel</button><button class="btn pri" data-act="savecol">Add column</button></div>`);setTimeout(()=>$('#cn')&&$('#cn').focus(),30);break;
case'savecol':{const n=$('#cn').value.trim();if(!n)return;const f=$('#cf').value,col={key:'x'+Date.now().toString(36),label:n,fmt:f};if(f==='list'){col.opts=$('#co').value.split(',').map(s=>s.trim()).filter(Boolean);if(!col.opts.length){toast('Add at least one dropdown option');return}}S.customCols.push(col);metaDirty=true;sched();L().innerHTML='';render();break}
case'exmenu':$('#exm').hidden=!$('#exm').hidden;break;
case'exall':$('#exm').hidden=true;if(MODE==='ai')exportAI();else exportReport(S.records,null);break;
case'excsv':$('#exm').hidden=true;if(MODE==='ai')exportAICSV();else exportCSV();break;
case'tpl':$('#exm').hidden=true;if(MODE==='ai')aiTemplate();else downloadTemplate();break;
case'exportperson':exportReport(S.records.filter(r=>r.owner===v),v);break;
case'bulk':bulkModal();break;
}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('.drawer'))closeLayer();else if(L().innerHTML)L().innerHTML=''}});
function route(){const hh=location.hash.slice(1),m=hh.split('-')[0];let h=hh;if(m==='rfp'||m==='comm'||m==='ai'){if(m!==MODE)setMode(m);h=hh.slice(m.length+1)}if(['pipeline','overview','team'].includes(h))U.view=h;else if(h.startsWith('person-')){const k=h.slice(7);const p=ownersAll().find(n=>n.replace(/[^a-zA-Z0-9]/g,'')===k);if(p){U.view='person';U.person=p}}}
window.addEventListener('hashchange',()=>{route();render()});
