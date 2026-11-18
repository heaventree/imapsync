(function(){
  var wide=window.innerWidth>900;
  try{if(wide&&localStorage.getItem('mm-layout')==='stitch'){location.replace('/stitch.html');return;}}catch(e){}
  function go(){try{localStorage.setItem('mm-layout','stitch');}catch(e){}location.href='/stitch.html';}
  var seg=document.querySelector('.seg');
  if(seg){var b=document.createElement('button');b.type='button';b.id='lay-stitch';b.setAttribute('aria-pressed','false');b.textContent='Stitch';b.onclick=go;seg.appendChild(b);}
  var mt=document.querySelector('.mtabs');
  if(mt){var m=document.createElement('button');m.type='button';m.textContent='Stitch';m.onclick=go;mt.appendChild(m);}
})();
