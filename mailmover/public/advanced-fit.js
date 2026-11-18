/* Advanced (desktop): tabs, title and the three action buttons share one row. Moves existing elements, so every id and handler still works. */
(function(){
  var nav=document.getElementById('nav'),tc=document.querySelector('.titlecard'),v=document.getElementById('v-setup');
  if(!nav||!tc||!v)return;
  var parent=tc.parentNode,next=tc.nextSibling;
  var row=document.createElement('div');row.id='toprow';
  nav.parentNode.insertBefore(row,nav);row.appendChild(nav);
  var mq=window.matchMedia('(min-width:1024px)'),top=false;
  var pause=document.getElementById('pause'),lg=pause?pause.parentNode:null,lgp=lg?lg.parentNode:null,lgn=lg?lg.nextSibling:null,inRow=false;
  function sync(){
    var setupOn=v.classList.contains('on');
    if(top)tc.style.display=setupOn?'':'none';
    /* Live monitor: Pause / Abort / Auto-scroll join the tab row so the status card shrinks */
    if(lg){
      if(top&&!setupOn&&!inRow){row.appendChild(lg);lg.classList.add('livegrp');inRow=true;}
      else if((!top||setupOn)&&inRow){lgp.insertBefore(lg,lgn);lg.classList.remove('livegrp');inRow=false;}
    }
  }
  var go=document.getElementById('go'),test=document.getElementById('test'),dry=document.getElementById('btnDryTop');
  var grp=dry?dry.parentNode:null,gp=go?go.parentNode:null,gn=go?go.nextSibling:null,tp=test?test.parentNode:null,tn=test?test.nextSibling:null;
  if(go)go.setAttribute('form','form');
  function place(){
    if(mq.matches&&!top){row.appendChild(tc);top=true;row.classList.add('has');
      if(grp&&go&&test){grp.appendChild(test);grp.appendChild(go);dry.style.display='none';}}
    else if(!mq.matches&&top){parent.insertBefore(tc,next);top=false;tc.style.display='';row.classList.remove('has');
      if(grp&&go&&test){tp.insertBefore(test,tn);gp.insertBefore(go,gn);dry.style.display='';}}
    sync();
  }
  new MutationObserver(sync).observe(v,{attributes:true,attributeFilter:['class']});
  (mq.addEventListener?mq.addEventListener('change',place):mq.addListener(place));
  place();
})();
/* Each mailbox card: sub-folder, delimiter and the Move / Strict switches sit behind an "Advanced" expander (closed by default). */
(function(){
  document.querySelectorAll('.card').forEach(function(card){
    var extra=card.querySelector(':scope > .pt-space-xs');if(!extra)return;
    var d=document.createElement('details');d.className='advopt';
    var s=document.createElement('summary');
    s.className='font-label-md text-label-md text-on-surface-variant cursor-pointer select-none';
    s.innerHTML='<span class="material-symbols-outlined text-[16px] chev">expand_more</span>Advanced<span class="advdot"></span>';
    d.appendChild(s);card.insertBefore(d,extra);d.appendChild(extra);
    function mark(){
      var set=false,danger=false;
      extra.querySelectorAll('input').forEach(function(i){
        if(i.type==='checkbox'){if(i.checked){set=true;danger=true;}}else if(i.value.trim())set=true;
      });
      d.classList.toggle('set',set);d.classList.toggle('danger',danger);
    }
    card.addEventListener('input',mark);card.addEventListener('change',mark);
    setInterval(mark,1000);mark();
  });
})();
