(function(){
  // email is never in the HTML: links carry data-k = reverse(base64(reverse(address))); rebuilt here into mailto links
  function dk(k){try{return atob(k.split('').reverse().join('')).split('').reverse().join('')}catch(x){return ''}}
  var EM=dk('==QZtFWasBkY1NXauV2cz12b2Vmcz5CdlNGa');
  document.querySelectorAll('a[data-k]').forEach(function(a){var e=dk(a.getAttribute('data-k'));if(!e)return;a.href='mailto:'+e;a.textContent=e;a.removeAttribute('data-k');});
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
  // contact form anti-spam (no third-party account needed). Layers, in order:
  //  1. JS-only: the form has no action and its button starts disabled, so a bot reading the HTML never sees the endpoint;
  //     the FormSubmit URL is assembled here only at send time.
  //  2. Two honeypots (website, _honey) hidden off-screen: if filled, show success but send nothing.
  //  3. Human signals: a real key/pointer/touch event in the form and >=5s on the page; otherwise (or if the browser is
  //     automated) a simple sum appears and must be answered.
  //  4. Content rules with inline, friendly errors: blocked/disposable email domains (.ru etc.), links/BBCode/HTML,
  //     spam phrases, non-Latin scripts, name checks, message length, name==message, phone format.
  //  5. Per-browser rate limit: 1 message per 60s, 3 per 24h (localStorage).
  //  6. FormSubmit server side: _blacklist phrases + _honey, table template, subject, reply-to.
  var form=document.getElementById('contact-form');
  if(form){
    var t0=Date.now(), note=document.getElementById('form-note'), btn=form.querySelector('button[type=submit]'), busy=false, human=0;
    var hc=document.getElementById('hcheck'), hq=document.getElementById('hq'), hql=document.getElementById('hq-label'), ans=null;
    var CONTACT='<a class="link" href="mailto:'+EM+'">'+EM+'</a> or call <a class="link" href="tel:+442039098200">020 3909 8200</a>';
    var FALLBACK=' Please email us at '+CONTACT+'.';
    var BAD_TLD=/\.(ru|su|xyz|top|click|icu|buzz|cfd|sbs|cyou|monster|rest|bid|loan|win)$/i;
    var TEMP=['mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org','sharklasers.com','grr.la','10minutemail.com','temp-mail.org','tempmail.com','tempmail.net','yopmail.com','trashmail.com','getnada.com','dispostable.com','throwawaymail.com','maildrop.cc','fakeinbox.com','mailnesia.com','emailondeck.com','tempail.com','mohmal.com','mintemail.com','spamgourmet.com','moakt.com','tempr.email','discard.email','burnermail.io','1secmail.com','mail.tm','mailpoof.com','tempinbox.com','emailfake.com'];
    var SPAM=/\b(seo|search engine optimi[sz]ation|backlinks?|link ?building|guest ?posts?|domain authority|first page (of|on) google|rank(ing)? (higher|first|#?1) on google|(website|web|site) traffic|(crypto|bitcoin|btc|forex) (investment|investing|profits?|signals|recovery|wallet|mining|trading account)|earn (bitcoin|crypto|btc)|cryptocurrency investment|nfts?|online casinos?|casino bonus|viagra|cialis|porn|adult (content|dating)|dating site|payday loans?|loan offer|investment opportunit(y|ies)|binary options|lottery win(ner)?|weight loss|buy followers|(instagram|tiktok|youtube) (followers|views)|unsubscribe|telegram|web design services|app development services|virtual assistants?|lead generation services|cold email(ing)?)\b/i;
    var LINK=/(https?:\/\/|\bwww\.|\[\/?(url|link|img)\b|<\s*a\s|href\s*=|\.(com|net|org|ru|info|xyz|top|biz)\/)/i;
    var FOREIGN=/[\u0400-\u052F\u2DE0-\u2DFF\uA640-\uA69F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\u0E00-\u0E7F]/g;
    var BLACKLIST='seo services,backlinks,guest post,link building,domain authority,first page of google,online casino,viagra,cialis,crypto investment,bitcoin investment,forex signals,porn,payday loan,binary options,buy followers,increase your traffic,[url=,href=,.ru/';
    function endpoint(){return atob('aHR0cHM6Ly9mb3Jtc3VibWl0LmNvL2FqYXgv')+dk('=QTOjBzMxETO0kTOykzN0EzMkBzNkZGMiBDMxcjYzYGO');}   // FormSubmit private form key (no email in the endpoint)
    function mark(e){if(e.isTrusted) human++;}
    ['keydown','pointerdown','touchstart','input'].forEach(function(t){form.addEventListener(t,mark,{passive:true})});
    btn.disabled=false;
    function say(h,kind){note.innerHTML=kind?'<span class="form-'+kind+'">'+h+'</span>':h;}
    function fieldErr(id,msg){var f=document.getElementById(id),p=document.getElementById(id+'-err');if(!f||!p)return;p.innerHTML=msg||'';if(msg)f.setAttribute('aria-invalid','true');else f.removeAttribute('aria-invalid');}
    form.addEventListener('input',function(e){if(e.target.id&&e.target.getAttribute('aria-invalid'))fieldErr(e.target.id,'');});
    function rateKey(){try{return JSON.parse(localStorage.getItem('bmt_form_sent')||'[]').filter(function(t){return typeof t==='number'&&Date.now()-t<864e5});}catch(x){return [];}}
    function showCheck(){
      if(ans===null){var a=2+Math.floor(Math.random()*7),b=1+Math.floor(Math.random()*8);ans=a+b;hql.textContent='Quick check: what is '+a+' + '+b+'? *';hc.hidden=false;}
      hq.focus();
    }
    var WORDS={two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17};
    function validate(v){
      var E={},name=v.name,email=v.email,phone=v.phone,msg=v.message;
      if(!name) E.name='Please enter your first name.';
      else if(LINK.test(name)||/@|\.(com|net|org|co|uk|io)\b/i.test(name)||(name.match(/\d/g)||[]).length>1||/[<>{}\[\]]/.test(name)) E.name='Please enter just your first name (no links, emails or numbers).';
      else if((name.match(FOREIGN)||[]).length) E.name='Please enter your name using English (Latin) letters.';
      else if(/^\S{9,}$/.test(name)&&(name.slice(1).match(/[A-Z]/g)||[]).length>=3) E.name='Please check your first name.';
      var m=/^[^\s@]+@([^\s@]+\.[a-z]{2,})$/i.exec(email), dom=m?m[1].toLowerCase():'';
      if(!email) E.email='Please enter your email address so we can reply.';
      else if(!m||email.length>120) E.email='Please enter a valid email address, like name@company.co.uk.';
      else if(BAD_TLD.test(dom)) E.email='Sorry, we can’t accept enquiries from this email domain. Please use another email address, or email us at '+CONTACT+'.';
      else if(TEMP.some(function(d){return dom===d||dom.slice(-d.length-1)==='.'+d})) E.email='Please use a permanent email address rather than a temporary inbox.';
      if(phone&&(!/^[0-9+()\-.\s]+$/.test(phone)||(phone.match(/\d/g)||[]).length<7||(phone.match(/\d/g)||[]).length>15)) E.phone='Please enter a valid phone number, e.g. 020 3909 8200 or 07700 900123, or leave it blank.';
      var words=msg.split(/\s+/).filter(Boolean).length, fc=(msg.match(FOREIGN)||[]).length;
      if(!msg) E.message='Please tell us briefly how we can help.';
      else if(fc>=3) E.message='Please write your message in English.';
      else if(msg.length<15||words<3) E.message='Please tell us a little more about your enquiry (at least a few words).';
      else if(msg.length>3000) E.message='Your message is too long. Please keep it under 3,000 characters.';
      else if(LINK.test(msg)) E.message='Please remove web links from your message (anything starting with http or www). We’ll ask for any details we need when we reply.';
      else if(SPAM.test(msg)||SPAM.test(name)) E.message='Sorry, your message looks like a promotional or marketing message, so we can’t send it. If this is a genuine enquiry, please email us at '+CONTACT+'.';
      else if(name&&msg.toLowerCase()===name.toLowerCase()) E.message='Please write a message about your enquiry.';
      else if(/\S{45,}/.test(msg.replace(/\S+@\S+/g,''))) E.message='Please check your message. It contains a very long string with no spaces.';
      return E;
    }
    form.addEventListener('submit',function(e){
      e.preventDefault(); if(busy) return;
      var get=function(n){var el=form.elements[n];return el?String(el.value||'').trim():''};
      // 1) honeypots: bots get a fake success and nothing is sent
      if(get('website')||get('_honey')){form.reset();say('Thank you. Your message has been sent and our team will be in touch shortly.','ok');return;}
      var v={name:get('name'),email:get('email'),phone:get('phone'),message:get('message')};
      ['name','email','phone','message','hq'].forEach(function(id){fieldErr(id,'')});
      // 2) content rules: friendly inline errors for humans
      var E=validate(v),keys=Object.keys(E);
      if(keys.length){keys.forEach(function(k){fieldErr(k,E[k])});say(keys.length>1?'Please correct the '+keys.length+' highlighted fields.':'Please correct the highlighted field.','err');document.getElementById(keys[0]).focus();return;}
      // 3) human signals: too fast, no real interaction, or an automated browser -> ask the quick sum
      if(ans===null&&(Date.now()-t0<5000||!human||navigator.webdriver)){showCheck();say('Please answer the quick check below, then press Submit again.','err');return;}
      if(ans!==null){var g=get('hq').toLowerCase(),n=/^\d+$/.test(g)?+g:WORDS[g];
        if(n!==ans){fieldErr('hq',g?'That’s not quite right. Please try the sum again.':'Please answer the quick check.');say('Please answer the quick check, then press Submit again.','err');hq.focus();return;}}
      // 4) per-browser rate limit
      var sent=rateKey();
      if(sent.length&&Date.now()-sent[sent.length-1]<6e4){say('You’ve just sent us a message. Please wait a minute before sending another.','err');return;}
      if(sent.length>=3){say('You’ve already sent us 3 messages today, thank you. For anything else, please email us at '+CONTACT+'.','err');return;}
      var obj={name:v.name,email:v.email,phone:v.phone||'Not given',message:v.message,
        _subject:'Website enquiry from '+v.name,_replyto:v.email,_template:'table',_blacklist:BLACKLIST,_honey:''};
      busy=true; btn.disabled=true; btn.textContent='Sending…';
      fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(obj)})
        .then(function(r){return r.json().catch(function(){return {success:r.ok}})})
        .then(function(j){
          if(j && (j.success===true || j.success==='true')){
            sent.push(Date.now());try{localStorage.setItem('bmt_form_sent',JSON.stringify(sent))}catch(x){}
            form.reset();hc.hidden=true;ans=null;say('Thank you. Your message has been sent and our team will be in touch shortly.','ok');}
          else say('Sorry, your message could not be sent just now.'+FALLBACK,'err');
        })
        .catch(function(){say('Sorry, your message could not be sent just now.'+FALLBACK,'err');})
        .then(function(){busy=false;btn.disabled=false;btn.textContent='Submit';});
    });
  }
})();
