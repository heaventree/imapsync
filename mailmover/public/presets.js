/* One provider list for all three layouts (Rail, Console, Advanced), including Custom IMAP. Rebuilds the preset chips, so each page keeps its own styling and handlers. */
(function(){
  var L=[['Gmail','imap.gmail.com'],['Microsoft 365','outlook.office365.com'],['Yahoo','imap.mail.yahoo.com'],['Hostinger','imap.hostinger.com'],['OVH','ssl0.ovh.net'],['Custom IMAP','']];
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
})();
