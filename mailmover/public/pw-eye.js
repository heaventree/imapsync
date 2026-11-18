/* Rail and Console: a show/hide eye inside each password field. Wraps the existing input, so ids and handlers still work. */
(function(){
  var EYE='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var OFF='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.1 10.1 0 0 1 12 19c-6.5 0-10-7-10-7a17.6 17.6 0 0 1 4.1-5M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.2 3.2M1 1l22 22M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  var st=document.createElement('style');
  st.textContent='.pww{position:relative;display:block}.pww input{padding-right:36px!important}.pww .pwb{position:absolute;right:2px;top:50%;transform:translateY(-50%);width:30px;height:30px;display:grid;place-items:center;padding:0;border:0;background:transparent!important;color:var(--mute);cursor:pointer;border-radius:3px}.pww .pwb:hover{color:var(--ink)}';
  document.head.appendChild(st);
  document.querySelectorAll('input[type=password]').forEach(function(i){
    var w=document.createElement('span');w.className='pww';
    i.parentNode.insertBefore(w,i);w.appendChild(i);
    var b=document.createElement('button');b.type='button';b.className='pwb';b.tabIndex=-1;
    function paint(){var shown=i.type==='text';b.innerHTML=shown?OFF:EYE;b.title=b.ariaLabel=shown?'Hide password':'Show password';}
    b.onclick=function(){i.type=i.type==='password'?'text':'password';paint();i.focus();};
    paint();w.appendChild(b);
  });
})();
