/* One provider list for all three layouts (Rail, Console, Advanced), including Custom IMAP. Rebuilds the preset chips, so each page keeps its own styling and handlers. Also shows a one-line "what you need" hint under the password when Gmail/Workspace or Microsoft 365 is chosen. */
(function(){
  var L=[['Gmail / Workspace','imap.gmail.com'],['Microsoft 365','outlook.office365.com'],['Custom IMAP','']];
  function pick(id,v){var h=document.getElementById(id);if(!h)return;if(v)h.value=v;else{h.value='';h.focus();}h.dispatchEvent(new Event('input',{bubbles:true}));}
  var st=document.createElement('style');
  st.textContent='body[data-layout=rail] .ah{flex-wrap:wrap}body[data-layout=rail] .presets{flex-basis:100%;margin-top:6px;gap:4px!important}body[data-layout=rail] .presets .pre{padding:0 5px;font-size:11px;white-space:nowrap}';
  document.head.appendChild(st);
  document.querySelectorAll('.presets').forEach(function(box){
    box.textContent='';
    L.forEach(function(p){
      var b=document.createElement('button');b.type='button';b.className='pre';b.textContent=p[0];
      b.onclick=function(){pick(box.dataset.t==='1'?'host1':'host2',p[1]);};box.appendChild(b);
    });
  });
  document.querySelectorAll('.prov').forEach(function(box){
    box.textContent='';
    L.forEach(function(p){
      var b=document.createElement('button');b.type='button';b.textContent=p[0];b.dataset.h=p[1];
      b.className='px-space-xs py-1 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container transition-colors';
      b.onclick=function(){pick(box.dataset.t==='1'?'host1':'host2',p[1]);};box.appendChild(b);
    });
  });
  ['host1','host2'].forEach(function(id){var h=document.getElementById(id);if(h)h.dispatchEvent(new Event('input',{bubbles:true}));});
  /* what-you-need hint under the password */
  var GOOGLE='<b>Google needs an app password</b>, not your normal one. <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener">Create one</a> · <a href="/help.html#google" target="_blank" rel="noopener">Step-by-step guide</a>';
  var MS='<b>Microsoft 365 usually blocks password sign-in.</b> <a href="/help.html#microsoft" target="_blank" rel="noopener">What works and what to do</a>';
  function kind(h){h=h.trim().toLowerCase();if(/(^|\.)(gmail|googlemail)\.com$/.test(h))return GOOGLE;if(/(^|\.)(office365|outlook|hotmail)\.com$/.test(h))return MS;return '';}
  [1,2].forEach(function(n){
    var h=document.getElementById('host'+n),p=document.getElementById('pass'+n);if(!h||!p)return;
    var flds=p.closest('.flds'),adv=!flds,box=flds?flds:p.closest('.space-y-space-xs');if(!box)return;
    var d=document.createElement('div');d.className=adv?'mmhint rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm px-space-sm py-1.5':'mmhint note';d.hidden=true;d.setAttribute('role','note');
    if(adv)box.appendChild(d);else box.parentNode.insertBefore(d,box.nextSibling);
    function upd(){var k=kind(h.value);d.innerHTML=k;d.hidden=!k;}
    h.addEventListener('input',upd);h.addEventListener('change',upd);upd();
  });
  var s2=document.createElement('style');
  s2.textContent='.mmhint a{color:inherit;font-weight:600;text-decoration:underline}.mmhint[hidden]{display:none!important}.mmhint{line-height:1.35}@media (min-width:768px){.mmhint.rounded{grid-column:1/-1}}';
  document.head.appendChild(s2);
})();
