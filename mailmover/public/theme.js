/* Light / dark toggle. Default follows the system; a click stores the choice in this browser only. */
(function(){
  var KEY='mm-theme',pref=null,mq=window.matchMedia('(prefers-color-scheme: dark)');
  try{pref=localStorage.getItem(KEY);}catch(e){}
  if(pref!=='dark'&&pref!=='light')pref=null;
  var link=document.getElementById('mm-dark');
  function isDark(){return pref==='dark'||(pref===null&&mq.matches);}
  function apply(){if(link)link.media=pref==='dark'?'all':pref==='light'?'not all':'(prefers-color-scheme: dark)';}
  apply();
  var SUN='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var st=document.createElement('style');
  st.textContent='.mmtheme{display:inline-flex;align-items:center;justify-content:center;width:30px;height:28px;flex-shrink:0;padding:0;border:1px solid #C9C6BB;border-radius:3px;background:#fff;color:#16191D;cursor:pointer}.mmtheme:hover{border-color:#0F766E}header .mmtheme{margin-left:2px}.bar .mmtheme{margin-left:auto}.bar .sp+.mmtheme{margin-left:0}';
  document.head.appendChild(st);
  function ready(){
    var b=document.createElement('button');b.type='button';b.className='mmtheme';
    function paint(){var d=isDark();b.innerHTML=d?SUN:MOON;b.title=b.ariaLabel=d?'Switch to light theme':'Switch to dark theme';}
    b.onclick=function(){pref=isDark()?'light':'dark';try{localStorage.setItem(KEY,pref);}catch(e){}apply();paint();};
    var seg=document.querySelector('header .seg'),app=document.querySelector('.bar .app');
    if(seg)seg.parentNode.insertBefore(b,seg);
    else if(app)app.parentNode.insertBefore(b,app);
    else{var h=document.querySelector('header');if(h)h.appendChild(b);else return;}
    paint();
    (mq.addEventListener?mq.addEventListener('change',paint):mq.addListener(paint));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
