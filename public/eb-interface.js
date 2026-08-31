(()=>{
  const $=s=>document.querySelector(s);
  const toast=t=>{const e=$('#toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__ebToast);window.__ebToast=setTimeout(()=>e.classList.remove('show'),2600)};
  const wire=()=>{
    const top=$('.topbar');
    if(top&&!$('#eb-mode-btn')){
      const b=document.createElement('button'); b.id='eb-mode-btn'; b.className='icon-btn'; b.title='Toggle EB interface mode'; b.textContent='EB'; b.style.fontSize='11px'; b.style.fontWeight='700';
      b.onclick=()=>{document.body.classList.toggle('eb-focus');toast('EB focus mode '+(document.body.classList.contains('eb-focus')?'enabled':'disabled'))};
      top.insertBefore(b,$('#notify-btn'));
    }
    const target=$('.assistant-card .text-link');
    if(target&&!document.querySelector('[data-eb-reference]')){
      const ref=document.createElement('button'); ref.className='text-link'; ref.dataset.ebReference='1'; ref.textContent='Open EB visual reference ›'; ref.style.marginLeft='10px';
      ref.onclick=()=>window.open('/assets/eb-interface.svg','_blank','noopener,noreferrer'); target.parentNode.insertBefore(ref,target.nextSibling);
    }
    document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='e'){e.preventDefault();document.body.classList.toggle('eb-focus');toast('EB focus mode '+(document.body.classList.contains('eb-focus')?'enabled':'disabled'))}});
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire); else wire();
})();
