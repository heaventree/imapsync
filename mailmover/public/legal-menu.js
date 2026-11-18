(function(){
  var f=document.createElement('footer');f.setAttribute('aria-label','Legal');
  f.innerHTML='<a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/security">Security</a><a href="/acceptable-use">Acceptable use</a><a href="/legal">Legal</a><span>© Heaventree Ltd.</span>';
  var st=document.createElement('style');
  st.textContent='.mm-foot,body>footer[aria-label=Legal]{flex:none;display:flex;align-items:center;justify-content:center;gap:4px 18px;height:26px;overflow:hidden;white-space:nowrap;background:#fff;border-top:1px solid #DEDCD3;font:500 11px/1 system-ui,sans-serif;color:#5B636B}body>footer[aria-label=Legal] a{color:#5B636B;text-decoration:none}body>footer[aria-label=Legal] a:hover{color:#16191D;text-decoration:underline}body>footer[aria-label=Legal] span{opacity:.8}@media (max-width:520px){body>footer[aria-label=Legal]{gap:4px 12px;font-size:10.5px}body>footer[aria-label=Legal] span{display:none}}';
  document.head.appendChild(st);document.body.appendChild(f);
})();
