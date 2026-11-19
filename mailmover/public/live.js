/* Live transfer by default, a clear "this is live" prompt, and a plain-language result message. Same behaviour in Rail, Console and Advanced. */
(function(){
  var form=document.getElementById('form');if(!form)return;
  function $(i){return document.getElementById(i);}
  function modeEl(v){return document.querySelector('input[name=mode][value='+v+']');}
  function mode(){var c=document.querySelector('input[name=mode]:checked');return c?c.value:'';}
  function setMode(v){var r=modeEl(v);if(r&&!r.checked)r.click();}
  /* 0. keep what was typed for this browser tab (sessionStorage: gone when the tab closes, never sent to the server), so a test run or a layout switch does not wipe the form */
  var KEEP=['host1','user1','pass1','host2','user2','pass2','sub1','sub2','sep1','extra'],SK='mm-fields';
  function load(){try{return JSON.parse(sessionStorage.getItem(SK)||'{}');}catch(e){return {};}}
  function save(){var o={};KEEP.forEach(function(k){var el=$(k);if(el&&el.value)o[k]=el.value;});try{sessionStorage.setItem(SK,JSON.stringify(o));}catch(e){}}
  var kept=load();
  KEEP.forEach(function(k){var el=$(k);if(!el)return;if(kept[k]&&!el.value){el.value=kept[k];el.dispatchEvent(new Event('input',{bubbles:true}));}el.addEventListener('input',save);el.addEventListener('change',save);});
  $('swap')&&$('swap').addEventListener('click',function(){setTimeout(save,0);});
  /* Transfer / Move instead of Sync: Transfer copies and keeps the old mailbox, Move copies and then deletes from the old one */
  var base=modeEl('sync'),adv=!!$('goTxt'),mvBox=$('move'),stBox=$('strict');
  function setText(l,title,desc,icon){
    var a=l.querySelector('.font-label-md')||l.querySelector('b'),d=l.querySelector('.hide-short')||l.querySelector('.d'),ic=l.querySelector('.material-symbols-outlined');
    if(a)a.textContent=title;if(d)d.textContent=desc;l.title=desc;if(ic&&icon)ic.textContent=icon;
  }
  var TR='Copy everything to the new mailbox. The old one is kept.',MV='Copy everything, then delete it from the old mailbox.';
  if(base){
    var bl=base.closest('label'),mc=bl.cloneNode(true),mi=mc.querySelector('input');
    mi.checked=false;mi.setAttribute('data-move','1');bl.parentNode.insertBefore(mc,bl.nextSibling);
    setText(bl,'Transfer',TR,'send');setText(mc,'Move',MV,'drive_file_move');
  }
  function curMode(){return document.querySelector('input[name=mode]:checked');}
  function relabel(){
    var c=curMode();if(!c||c.value!=='sync')return;var mv=c.hasAttribute('data-move');
    var g=$('goTxt')||$('go');if(g)g.textContent=adv?(mv?'Start Move':'Start Transfer'):(mv?'Start move':'Start transfer');
    var n=$('modeNote');if(n)n.textContent='Selected: '+(mv?'Move copies every message, then deletes it from the source':'Transfer copies every message to the destination and keeps the source');
    var ml=$('modelbl');if(ml)ml.textContent=mv?'Move':'Transfer';
  }
  document.addEventListener('change',function(e){
    var t=e.target;
    if(t&&t.name==='mode'){if(mvBox)mvBox.checked=t.hasAttribute('data-move');setTimeout(relabel,0);}
    else if(t===mvBox){var c=curMode();if(c&&c.value==='sync'){var want=document.querySelector('input[name=mode][value=sync]'+(mvBox.checked?'[data-move]':':not([data-move])'));if(want&&!want.checked)want.click();}}
  },true);
  var lm=document.querySelector('label[for=move]');if(lm&&adv)lm.textContent='Move (deletes source messages after they are copied)';
  var ls=document.querySelector('label[for=strict]');if(ls&&adv)ls.textContent='Strict (purge target messages absent from source)';
  var wm=$('w-move'),ws=$('w-strict');
  if(wm){var b1=wm.querySelector('b');if(b1)b1.textContent='Move.';}
  if(ws){var b2=ws.querySelector('b');if(b2)b2.textContent='Strict.';}
  /* live view wording */
  function fix(id,fn){var el=$(id);if(!el)return;var ob=new MutationObserver(function(){var t=el.textContent,v=fn(t);if(v!==t){ob.disconnect();el.textContent=v;ob.observe(el,{childList:true,characterData:true,subtree:true});}});ob.observe(el,{childList:true,characterData:true,subtree:true});}
  var word=function(){return mvBox&&mvBox.checked?'Move':'Transfer';};
  fix('dMode',function(t){return t==='Full Sync'?word():t;});
  fix('pillTxt',function(t){return t.replace(/\bSYNC\b/,word().toUpperCase());});
  fix('fsync',function(t){return t.replace('SYNCHRONIZING','TRANSFERRING');});
  /* 1. live transfer is the default, not a dry run */
  setMode('sync');relabel();
  var e1=$('empty'),e2=$('termEmpty');
  if(e1)e1.textContent='Your transfer shows up here as it runs.';
  if(e2)e2.textContent='Your transfer shows up here as it runs.';

  /* toast */
  var st=document.createElement('style');
  st.textContent='#mmtoast{position:fixed;left:50%;bottom:44px;transform:translateX(-50%);z-index:9999;width:min(560px,calc(100vw - 24px));background:#101522;color:#f9fafb;border:1px solid #3b475b;border-left:4px solid #6ee7b7;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.35);padding:14px 16px;font:14px/1.45 Inter,system-ui,sans-serif}'+
  '#mmtoast.warn{border-left-color:#e9a96b}#mmtoast.err{border-left-color:#f87171}#mmtoast b{display:block;font-size:15px;margin-bottom:2px}#mmtoast p{margin:0;color:#c5ccd8}'+
  '#mmtoast .tb{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}#mmtoast button{font:inherit;font-weight:600;border-radius:8px;padding:7px 14px;cursor:pointer;border:1px solid #3b475b;background:#1f2937;color:#f9fafb}'+
  '#mmtoast button.p{background:#6ee7b7;border-color:#6ee7b7;color:#050814}#mmtoast .x{position:absolute;top:6px;right:8px;border:0;background:none;padding:2px 6px;font-size:18px;line-height:1;color:#b0b8c6}'+
  '#mmov{position:fixed;inset:0;z-index:9998;background:rgba(5,8,20,.72);display:flex;align-items:center;justify-content:center;padding:16px}#mmov #mmtoast{position:relative;left:auto;bottom:auto;transform:none;width:min(480px,100%);padding:20px 22px;font-size:15px}#mmov #mmtoast b{font-size:17px;margin-bottom:6px}#mmov #mmtoast .tb{margin-top:16px}';
  document.head.appendChild(st);
  var box=null;
  function close(){if(box){box.remove();box=null;}}
  function toast(kind,title,text,btns){
    close();var t=document.createElement('div'),modal=btns&&btns.length>1;t.id='mmtoast';t.className=kind;t.setAttribute('role',modal?'alertdialog':'status');
    t.innerHTML='<button class="x" type="button" aria-label="Close">×</button><b></b><p></p>';
    t.querySelector('b').textContent=title;t.querySelector('p').textContent=text;
    t.querySelector('.x').onclick=close;
    if(btns&&btns.length){var tb=document.createElement('div');tb.className='tb';btns.forEach(function(b){var el=document.createElement('button');el.type='button';el.textContent=b[0];if(b[2])el.className='p';el.onclick=function(){close();b[1]();};tb.appendChild(el);});t.appendChild(tb);}
    if(modal){box=document.createElement('div');box.id='mmov';box.appendChild(t);box.addEventListener('mousedown',function(e){if(e.target===box)close();});}
    else box=t;
    document.body.appendChild(box);var f=t.querySelector('.p');if(f&&modal)f.focus();
  }
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});

  /* 2. a live run asks first; the person can switch to a dry run */
  var ok=false;
  document.addEventListener('submit',function(e){
    if(e.target!==form)return;
    if(ok){ok=false;return;}
    if(mode()!=='sync')return;
    e.preventDefault();e.stopImmediatePropagation();
    var mv=mvBox&&mvBox.checked,sx=stBox&&stBox.checked;
    var go=function(){ok=true;if(mv||sx){var oc=window.confirm;window.confirm=function(){return true;};try{form.requestSubmit();}finally{window.confirm=oc;}}else form.requestSubmit();};
    var txt=mv||sx?'Messages will be copied to the new mailbox'+(mv?' and then deleted from the old one':'')+(sx?', and messages missing from the old mailbox will be deleted from the new one':'')+'. Deleted messages cannot be recovered through MailMover. If you are not sure, run a dry run first: it shows what would happen and changes nothing.':'Messages will be copied to the new mailbox. Nothing is deleted from the old one. If you would rather check first, run a dry run: it shows what would happen and copies nothing.';
    toast('warn',mv||sx?'This will delete mail':'This is a live transfer',txt,[
      [mv?'Move my mail':sx?'Start and delete':'Start live transfer',go,true],
      ['Dry run first',function(){setMode('dry');ok=true;form.requestSubmit();}]
    ]);
  },true);

  /* 3. a clear result when the run ends */
  var rf=window.fetch;
  window.fetch=function(u,o){
    var p=rf.apply(this,arguments);
    try{if(typeof u==='string'&&/^\/api\/(run|test)$/.test(u)&&o&&o.method==='POST'){var bd=JSON.parse(o.body||'{}'),m=bd.mode;p.then(function(r){return r.clone().json();}).then(function(j){if(j&&j.id)watch(j.id,u==='/api/test'?'check':m,!!bd.move);}).catch(function(){});}}catch(e){}
    return p;
  };
  function n(v){return Number(v).toLocaleString();}
  function watch(id,m,mv){
    close();var moved=null,es=new EventSource('/api/jobs/'+id+'/stream'),fin=false;
    es.addEventListener('line',function(ev){try{var l=JSON.parse(ev.data),x=/^Messages transferred: (\d+)/.exec(l.m||'');if(x)moved=+x[1];}catch(e){}});
    es.addEventListener('state',function(ev){
      var s;try{s=JSON.parse(ev.data);}catch(e){return;}
      if(fin||['done','failed','stopped'].indexOf(s.status)<0)return;fin=true;es.close();
      var t=s.stats||{},md=s.mode||m,src=t.source||'the source',dst=t.dest||'the destination';
      if(s.status==='done'){
        if(md==='sync'){
          if(t.errors)toast('warn',(mv?'Move':'Transfer')+' finished, but with '+n(t.errors)+' error'+(t.errors===1?'':'s'),'Some items may not have copied. Open the log and choose Errors before relying on this transfer.');
          else if(mv)toast('ok','Move complete',(moved?'Moved '+n(moved)+' message'+(moved===1?'':'s')+' from '+src+' to '+dst+' and removed them from the old mailbox. ':'Nothing new to move: '+dst+' already has everything from '+src+'. ')+'No errors. Open the new mailbox to check.');
          else toast('ok','Transfer complete',(moved?'Copied '+n(moved)+' message'+(moved===1?'':'s')+' from '+src+' to '+dst+'. ':'Nothing new to copy: '+dst+' already matches '+src+'. ')+'No errors. Open the destination mailbox to check. You can run this again any time to copy anything new.');
        }else if(md==='dry'){
          toast('ok','Dry run finished: nothing was copied','The log shows what a live transfer would do. When you are ready, switch to a live transfer.',[['Switch to live transfer',function(){setMode('sync');},true]]);
        }else if(md==='check'){
          toast('ok','Both logins work','You can start the transfer now.');
        }else toast('ok','Finished','See the log for the details.');
      }else if(s.status==='failed'){
        toast('err','The transfer stopped with an error',(t.hint?t.hint+' ':'')+'Open the log for the details.');
      }else toast('warn','Transfer stopped','Messages already copied stay on the destination. Starting again continues from where it left off.');
    });
    es.onerror=function(){if(fin)es.close();};
  }
  /* browser errors go to the master log (no field values) */
  function report(msg,src,line){try{navigator.sendBeacon('/api/clientlog',new Blob([JSON.stringify({page:location.pathname,msg:String(msg).slice(0,300),src:String(src||'').slice(-80),line:line||0})],{type:'application/json'}));}catch(e){}}
  window.addEventListener('error',function(e){report(e.message,e.filename,e.lineno);});
  window.addEventListener('unhandledrejection',function(e){report('promise: '+(e.reason&&e.reason.message||e.reason),'',0);});
})();
