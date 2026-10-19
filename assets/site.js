(function(){
  var h=document.querySelector('.site-header'),sc=document.querySelector('.sticky-cta'),hasHero=document.querySelector('.hero,.proj-hero,.page-hero');
  function onScroll(){var y=window.scrollY;h.classList.toggle('solid', !hasHero || y>40); if(sc) sc.classList.toggle('on', y>window.innerHeight*0.8 && !document.body.classList.contains('open'));}
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  var b=document.querySelector('.burger');
  function setMenu(o){document.body.classList.toggle('open',o);b.setAttribute('aria-expanded',o);document.body.style.overflow=o?'hidden':'';h.classList.toggle('solid',o||!hasHero||window.scrollY>40);}
  b&&b.addEventListener('click',function(){setMenu(!document.body.classList.contains('open'))});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){setMenu(false);closeLb();}});
  document.querySelectorAll('.menu a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.08,rootMargin:'0px 0px -40px 0px'});els.forEach(function(e){io.observe(e)});}else els.forEach(function(e){e.classList.add('in')});
  document.querySelectorAll('.carousel').forEach(function(c){
    var t=c.querySelector('.track');
    function step(){var s=t.querySelector('.slide');return s?s.getBoundingClientRect().width+20:300;}
    var p=document.querySelector('[data-prev]'),n=document.querySelector('[data-next]');
    p&&p.addEventListener('click',function(){ if(t.scrollLeft<5) t.scrollTo({left:t.scrollWidth,behavior:'smooth'}); else t.scrollBy({left:-step(),behavior:'smooth'})});
    n&&n.addEventListener('click',function(){ if(t.scrollLeft+t.clientWidth>=t.scrollWidth-5) t.scrollTo({left:0,behavior:'smooth'}); else t.scrollBy({left:step(),behavior:'smooth'})});
  });
  var chips=document.querySelectorAll('.chip'),cnt=document.getElementById('pcount');
  chips.forEach(function(ch){ch.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});
    ch.classList.add('active');ch.setAttribute('aria-pressed','true');
    var f=ch.dataset.filter,n=0;
    document.querySelectorAll('.pcard').forEach(function(c){var show=f==='all'||(c.dataset.cat||'').split(' ').indexOf(f)>=0;c.classList.toggle('hide',!show);c.classList.toggle('pfeature',show&&f==='all'&&c===document.querySelector('.pcard'));if(show){n++;c.classList.add('in');}});
    if(cnt) cnt.textContent=n+(n===1?' project':' projects');
  });});
  // lightbox
  var lb=document.querySelector('.lightbox');
  function closeLb(){lb&&lb.classList.remove('on')}
  if(lb){document.querySelectorAll('.gallery img').forEach(function(i){i.addEventListener('click',function(){lb.querySelector('img').src=i.dataset.full||i.src;lb.querySelector('img').alt=i.alt;lb.classList.add('on')})});lb.addEventListener('click',function(e){if(e.target!==lb.querySelector('img'))closeLb()});}
  // contact form: honeypot + time trap + link limit, then mailto (free, no account)
  var form=document.getElementById('contact-form');
  if(form){
    var t0=Date.now(), note=document.getElementById('form-note');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(form.company_website.value){return;}                 // bot filled hidden field
      if(Date.now()-t0<3000){note.innerHTML='<span class="form-err">That was very quick. Please check your details and press Submit again.</span>';t0=0;return;}
      var d=new FormData(form),msg=String(d.get('message')||'');
      if((msg.match(/https?:\/\//g)||[]).length>2){note.innerHTML='<span class="form-err">Please remove the links from your message (max 2).</span>';return;}
      var body='Name: '+d.get('name')+'\nPhone: '+(d.get('phone')||'')+'\nEmail: '+d.get('email')+'\n\n'+msg;
      window.location.href='mailto:info@businessmovers.tech?subject='+encodeURIComponent('Website enquiry from '+d.get('name'))+'&body='+encodeURIComponent(body);
      note.textContent='Thanks. Your email app should now open with your message ready to send to info@businessmovers.tech. If nothing happens, email us directly or call 020 3909 8200.';
    });
  }
})();
// Theme switcher (presentation aid): data-theme on <html>, saved in localStorage, ?theme= links supported.
(function(){
  var root=document.documentElement, sw=document.getElementById('theme-switch'); if(!sw) return;
  var NAMES={neutral:'Neutral',classic:'Classic Blue',midnight:'Midnight'}, KEY='bmt-theme';
  var tog=sw.querySelector('.theme-toggle'), opts=sw.querySelectorAll('.theme-opt');
  function paint(t){
    opts.forEach(function(o){o.setAttribute('aria-pressed',String(o.getAttribute('data-theme-opt')===t))});
    sw.querySelector('.theme-name').textContent=NAMES[t]; tog.querySelector('.theme-sw').setAttribute('data-t',t);
    tog.setAttribute('aria-label','Theme: '+NAMES[t]+'. Change theme');
  }
  function setOpen(o){sw.classList.toggle('open',o);tog.setAttribute('aria-expanded',String(o));}
  function apply(t){
    if(!NAMES[t]) return; root.setAttribute('data-theme',t); try{localStorage.setItem(KEY,t)}catch(e){}
    try{var u=new URL(location.href); if(u.searchParams.has('theme')){u.searchParams.set('theme',t);history.replaceState(null,'',u)}}catch(e){}
    paint(t);
  }
  paint(NAMES[root.getAttribute('data-theme')]?root.getAttribute('data-theme'):'neutral');
  tog.addEventListener('click',function(e){e.stopPropagation();setOpen(!sw.classList.contains('open'))});
  opts.forEach(function(o){o.addEventListener('click',function(){apply(o.getAttribute('data-theme-opt'));setOpen(false);tog.focus()})});
  document.addEventListener('click',function(e){if(!sw.contains(e.target))setOpen(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false)});
})();
