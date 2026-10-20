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
    balance();
  });});
  // fill the last row of the projects grid (3-up desktop, 2-up tablet) so it never ends with an empty cell
  function balance(){var g=document.querySelector('.pgrid.three');if(!g)return;
    var v=[].filter.call(g.querySelectorAll('.pcard'),function(c){return !c.classList.contains('hide')&&!c.classList.contains('pfeature')}),k=v.length;
    g.querySelectorAll('.pcard').forEach(function(c){c.classList.remove('r3-1','r3-2','r2-1')});
    if(k%3===1) v[k-1].classList.add('r3-1'); if(k%3===2){v[k-2].classList.add('r3-2');v[k-1].classList.add('r3-2');}
    if(k%2===1) v[k-1].classList.add('r2-1');}
  balance();
  // lightbox
  var lb=document.querySelector('.lightbox');
  function closeLb(){lb&&lb.classList.remove('on')}
  if(lb){document.querySelectorAll('.gallery img').forEach(function(i){i.addEventListener('click',function(){lb.querySelector('img').src=i.dataset.full||i.src;lb.querySelector('img').alt=i.alt;lb.classList.add('on')})});lb.addEventListener('click',function(e){if(e.target!==lb.querySelector('img'))closeLb()});}
  // cookie consent (GA4 Consent Mode v2, defaults set in <head>): Accept/Reject store bmt_consent=granted|denied in localStorage
  // and update analytics_storage only (ad_storage, ad_user_data, ad_personalization stay denied). 'Cookie settings' reopens the banner.
  var R=document.documentElement,cc=document.getElementById('cc'),opener=null;
  function ccSet(v){
    try{localStorage.setItem('bmt_consent',v)}catch(e){}
    if(window.gtag) gtag('consent','update',{analytics_storage:v});
    if(v==='denied') document.cookie.split(';').forEach(function(c){var n=c.split('=')[0].trim();   // withdrawn: remove existing _ga / _ga_* cookies
      if(/^_ga(_|$)/.test(n)) ['',location.hostname,'.'+location.hostname.replace(/^www\./,'')].forEach(function(d){document.cookie=n+'=; Max-Age=0; path=/'+(d?'; domain='+d:'')});});
    R.classList.remove('cc-ask'); if(opener){opener.focus();opener=null;}
  }
  if(cc){
    cc.querySelectorAll('[data-cc]').forEach(function(x){x.addEventListener('click',function(){ccSet(x.getAttribute('data-cc'))})});
    document.querySelectorAll('.cookie-settings').forEach(function(x){x.addEventListener('click',function(){opener=x;R.classList.add('cc-ask');cc.querySelector('[data-cc]').focus();})});
  }
  // contact form: honeypot (_honey) + time trap + link limit, then POST to FormSubmit (free static-form relay -> info@businessmovers.tech).
  // Without JS the form still posts to FormSubmit directly (action attribute) and FormSubmit shows its own confirmation page.
  var form=document.getElementById('contact-form');
  if(form){
    var t0=Date.now(), note=document.getElementById('form-note'), btn=form.querySelector('button[type=submit]'), busy=false;
    var FALLBACK=' Please email us at <a class="link" href="mailto:info@businessmovers.tech">info@businessmovers.tech</a> or call <a class="link" href="tel:+442039098200">020 3909 8200</a>.';
    function say(h,err){note.innerHTML=err?'<span class="form-err">'+h+'</span>':h;}
    form.addEventListener('submit',function(e){
      e.preventDefault(); if(busy) return;
      if(form._honey && form._honey.value){say('Thank you. Your message has been sent.');form.reset();return;}   // bot filled hidden field: pretend success, send nothing
      if(Date.now()-t0<3000){say('That was very quick. Please check your details and press Submit again.',true);t0=0;return;}
      var d=new FormData(form),msg=String(d.get('message')||'');
      if((msg.match(/https?:\/\//g)||[]).length>2){say('Please remove the links from your message (max 2).',true);return;}
      d.set('_subject','Website enquiry from '+d.get('name')); d.set('_replyto',String(d.get('email')||''));
      var obj={}; d.forEach(function(v,k){obj[k]=v});
      busy=true; btn.disabled=true; btn.textContent='Sending…';
      fetch(form.action.replace('formsubmit.co/','formsubmit.co/ajax/'),{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(obj)})
        .then(function(r){return r.json().catch(function(){return {success:r.ok}})})
        .then(function(j){
          if(j && (j.success===true || j.success==='true')){form.reset();say('Thank you. Your message has been sent and our team will be in touch shortly.');}
          else say('Sorry, your message could not be sent just now.'+FALLBACK,true);
        })
        .catch(function(){say('Sorry, your message could not be sent just now.'+FALLBACK,true);})
        .then(function(){busy=false;btn.disabled=false;btn.textContent='Submit';});
    });
  }
})();
