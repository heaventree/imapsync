(function(){
    var h=document.querySelector('header');if(!h)return;
    var d=document.createElement('details');d.className='mm-legal';
    d.innerHTML='<summary>Legal</summary><div><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a><a href="/security">Security</a><a href="/acceptable-use">Acceptable Use</a><a href="/legal">Legal Disclosure</a></div>';
    var st=document.createElement('style');
    st.textContent='.mm-legal{position:relative;font:500 13px/1.4 system-ui,sans-serif;flex-shrink:0}.mm-legal summary{cursor:pointer;list-style:none;padding:6px 8px;border-radius:6px;color:#5B636B}.mm-legal summary::-webkit-details-marker{display:none}.mm-legal summary:hover{background:rgba(0,0,0,.05)}.mm-legal div{position:absolute;right:0;top:100%;margin-top:4px;min-width:170px;background:#fff;border:1px solid #DEDCD3;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:4px;z-index:100}.mm-legal a{display:block;padding:7px 10px;border-radius:5px;color:#16191D;text-decoration:none;white-space:nowrap}.mm-legal a:hover{background:#F4F3EF}';
    document.head.appendChild(st);
    var anchor=h.querySelector('.seg');
    anchor?h.insertBefore(d,anchor):h.appendChild(d);
    document.addEventListener('click',function(e){if(!d.contains(e.target))d.removeAttribute('open');});
  })();
