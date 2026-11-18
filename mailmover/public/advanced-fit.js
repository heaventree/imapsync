/* Advanced (desktop): tabs, title and the three action buttons share one row. Moves existing elements, so every id and handler still works. */
(function(){
  var nav=document.getElementById('nav'),tc=document.querySelector('.titlecard'),v=document.getElementById('v-setup');
  if(!nav||!tc||!v)return;
  var parent=tc.parentNode,next=tc.nextSibling;
  var row=document.createElement('div');row.id='toprow';
  nav.parentNode.insertBefore(row,nav);row.appendChild(nav);
  var mq=window.matchMedia('(min-width:1024px)'),top=false;
  function sync(){if(top)tc.style.display=v.classList.contains('on')?'':'none';}
  function place(){
    if(mq.matches&&!top){row.appendChild(tc);top=true;row.classList.add('has');}
    else if(!mq.matches&&top){parent.insertBefore(tc,next);top=false;tc.style.display='';row.classList.remove('has');}
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
