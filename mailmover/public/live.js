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
  /* 1. live transfer is the default, not a dry run */
  setMode('sync');
  var e1=$('empty'),e2=$('termEmpty');
  if(e1)e1.textContent='Your transfer shows up here as it runs.';
  if(e2)e2.textContent='Your transfer shows up here as it runs.';

  /* toast */
  var st=document.createElement('style');
  st.textContent='#mmtoast{position:fixed;left:50%;bottom:44px;transform:translateX(-50%);z-index:9999;width:min(560px,calc(100vw - 24px));background:#101522;color:#f9fafb;border:1px solid #3b475b;border-left:4px solid #6ee7b7;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.35);padding:14px 16px;font:14px/1.45 Inter,system-ui,sans-serif}'+
  '#mmtoast.warn{border-left-color:#e9a96b}#mmtoast.err{border-left-color:#f87171}#mmtoast b{display:block;font-size:15px;margin-bottom:2px}#mmtoast p{margin:0;color:#c5ccd8}'+
  '#mmtoast .tb{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}#mmtoast button{font:inherit;font-weight:600;border-radius:8px;padding:7px 14px;cursor:pointer;border:1px solid #3b475b;background:#1f2937;color:#f9fafb}'+
  '#mmtoast button.p{background:#6ee7b7;border-color:#6ee7b7;color:#050814}#mmtoast .x{position:absolute;top:6px;right:8px;border:0;background:none;padding:2px 6px;font-size:18px;line-height:1;color:#b0b8c6}';
  document.head.appendChild(st);
  var box=null;
  function close(){if(box){box.remove();box=null;}}
  function toast(kind,title,text,btns){
    close();box=document.createElement('div');box.id='mmtoast';box.className=kind;box.setAttribute('role',btns&&btns.length>1?'alertdialog':'status');
    var h='<button class="x" type="button" aria-label="Close">×</button><b></b><p></p>';box.innerHTML=h;
    box.querySelector('b').textContent=title;box.querySelector('p').textContent=text;
    box.querySelector('.x').onclick=close;
    if(btns&&btns.length){var tb=document.createElement('div');tb.className='tb';btns.forEach(function(b){var el=document.createElement('button');el.type='button';el.textContent=b[0];if(b[2])el.className='p';el.onclick=function(){close();b[1]();};tb.appendChild(el);});box.appendChild(tb);}
    document.body.appendChild(box);var f=box.querySelector('.p');if(f&&btns&&btns.length>1)f.focus();
  }
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});

  /* 2. a live run asks first; the person can switch to a dry run */
  var ok=false;
  document.addEventListener('submit',function(e){
    if(e.target!==form)return;
    if(ok){ok=false;return;}
    if(mode()!=='sync')return;
    e.preventDefault();e.stopImmediatePropagation();
    toast('warn','This is a live transfer','Messages will be copied to the destination mailbox. If you would rather check first, run a dry run: it shows what would happen and copies nothing.',[
      ['Start live transfer',function(){ok=true;form.requestSubmit();},true],
      ['Dry run first',function(){setMode('dry');ok=true;form.requestSubmit();}]
    ]);
  },true);

  /* 3. a clear result when the run ends */
  var rf=window.fetch;
  window.fetch=function(u,o){
    var p=rf.apply(this,arguments);
    try{if(typeof u==='string'&&/^\/api\/(run|test)$/.test(u)&&o&&o.method==='POST'){var m=JSON.parse(o.body||'{}').mode;p.then(function(r){return r.clone().json();}).then(function(j){if(j&&j.id)watch(j.id,u==='/api/test'?'check':m);}).catch(function(){});}}catch(e){}
    return p;
  };
  function n(v){return Number(v).toLocaleString();}
  function watch(id,m){
    close();var moved=null,es=new EventSource('/api/jobs/'+id+'/stream'),fin=false;
    es.addEventListener('line',function(ev){try{var l=JSON.parse(ev.data),x=/^Messages transferred: (\d+)/.exec(l.m||'');if(x)moved=+x[1];}catch(e){}});
    es.addEventListener('state',function(ev){
      var s;try{s=JSON.parse(ev.data);}catch(e){return;}
      if(fin||['done','failed','stopped'].indexOf(s.status)<0)return;fin=true;es.close();
      var t=s.stats||{},md=s.mode||m,src=t.source||'the source',dst=t.dest||'the destination';
      if(s.status==='done'){
        if(md==='sync'){
          if(t.errors)toast('warn','Finished, but with '+n(t.errors)+' error'+(t.errors===1?'':'s'),'Some items may not have copied. Open the log and choose Errors before relying on this transfer.');
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
})();
