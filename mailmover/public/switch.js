(function(){
  var wide=window.innerWidth>900;
  try{if(wide&&localStorage.getItem('mm-layout')==='advanced'){location.replace('/advanced.html');return;}}catch(e){}
  function go(){try{localStorage.setItem('mm-layout','advanced');}catch(e){}location.href='/advanced.html';}
  var seg=document.querySelector('.seg');
  if(seg){var b=document.createElement('button');b.type='button';b.id='lay-advanced';b.setAttribute('aria-pressed','false');b.textContent='Advanced';b.onclick=go;seg.appendChild(b);}
  var mt=document.querySelector('.mtabs');
  if(mt){var m=document.createElement('button');m.type='button';m.textContent='Advanced';m.onclick=go;mt.appendChild(m);}
})();
