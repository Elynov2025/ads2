(function () {
  var CFG = {
    WRAP_ID: 'oc-flex-after-last-p',
    BANNER_ID: '6064015',
    ADMPID: '307391',
    SRC: 'https://js.onclckmn.com/static/onclicka.js',
    TIMEOUT_MS: 4000,
    DEBUG: false
  };
  function log(){ if(CFG.DEBUG) console.log.apply(console, arguments); }

  // preconnect
  (function pre(hs){
    (hs||[]).forEach(function(h){
      try{
        var a=document.createElement('link'); a.rel='preconnect'; a.href=h;
        var b=document.createElement('link'); b.rel='dns-prefetch'; b.href=h;
        document.head.appendChild(a); document.head.appendChild(b);
      }catch(e){}
    });
  })(['https://js.onclckmn.com']);

  // ---------- поиск места вставки ----------
  function visible(el){
    if(!el) return false;
    if(!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)) return false;
    var cs=getComputedStyle(el);
    return cs.visibility!=='hidden' && cs.display!=='none';
  }
  function contentRoot(){
    var sels=[
      '[data-hook="post-content"]',
      '[data-testid="richContentRenderer"]',
      'article [data-hook*="content"]',
      'article','main article','main'
    ];
    for(var i=0;i<sels.length;i++){ var el=document.querySelector(sels[i]); if(el) return el; }
    return document.body;
  }
  function lastParagraphLike(root){
    var qs='p, [data-attributes-key="paragraph"], div[role="paragraph"], .wixui-rich-text__text, [data-testid="richTextElement"], li, blockquote';
    var nodes=[].slice.call(root.querySelectorAll(qs));
    if(!nodes.length) nodes=[].slice.call(document.querySelectorAll('p'));
    for(var i=nodes.length-1;i>=0;i--){
      var el=nodes[i], txt=(el.textContent||'').trim();
      if(visible(el) && txt.length>=1) return el;
    }
    return null;
  }

  // ---------- контейнер ----------
  function buildAnchor(){
    var wrap=document.getElementById(CFG.WRAP_ID);
    if(wrap) return wrap;
    wrap=document.createElement('div');
    wrap.id=CFG.WRAP_ID;
    wrap.style.cssText='width:100%;display:block;margin:16px 0 0;';
    var box=document.createElement('div');
    // никаких фиксированных размеров
    box.style.cssText=[
      'width:100%','max-width:100%','margin:12px auto 0',
      'display:block','box-sizing:border-box','overflow:visible'
    ].join(';');
    wrap.appendChild(box);
    return wrap;
  }
  function placeAnchor(){
    var root=contentRoot(), last=lastParagraphLike(root);
    if(!last){ log('[onclick-flex] last paragraph not found'); return null; }
    var wrap=buildAnchor();
    if(!wrap.parentNode) last.insertAdjacentElement('afterend', wrap);
    return wrap;
  }

  // ---------- прямая вставка сети ----------
  function renderDirect(box, done){
    var holder=document.createElement('div');
    holder.setAttribute('data-banner-id', CFG.BANNER_ID);
    // без width/height — сеть сама задаст размеры
    var s=document.createElement('script');
    s.async=true; s.src=CFG.SRC; s.setAttribute('data-admpid', CFG.ADMPID);

    var ok=false, timer=null;
    function check(){
      // если сеть вставила iframe/контент или блок стал ненулевой высоты — успех
      if (holder.querySelector('iframe') || holder.childElementCount>0 || holder.offsetHeight>0) {
        ok=true; clearTimeout(timer); done && done(true); return;
      }
    }
    s.onload=function(){
      setTimeout(check, 700);
      timer=setTimeout(function(){ check(); if(!ok && done) done(false); }, CFG.TIMEOUT_MS);
    };
    s.onerror=function(){ done && done(false); };

    box.innerHTML='';
    box.appendChild(holder);
    box.appendChild(s);
  }

  // ---------- fallback: iframe srcdoc без фиксированных размеров ----------
  function buildSrcdoc(){
    var html='<!doctype html><html><head><meta charset="utf-8">'
      +'<meta name="referrer" content="no-referrer">'
      +'<style>html,body{margin:0;padding:0;background:transparent}#wrap{display:block;margin:0 auto;max-width:100%;width:100%}</style>'
      +'</head><body>'
      +'<div id="wrap">'
      +'<div data-banner-id="'+CFG.BANNER_ID+'"></div>'
      +'<script async src="'+CFG.SRC+'" data-admpid="'+CFG.ADMPID+'"><\\/script>'
      +'<script>(function(){function post(){var h=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);parent.postMessage({type:"oc-size",h:h},"*")}post();setTimeout(post,600);setTimeout(post,1500);try{var mo=new MutationObserver(post);mo.observe(document.body,{childList:true,subtree:true});}catch(e){}})();<\\/script>'
      +'</div></body></html>';
    return html;
  }
  function renderIframe(box){
    var iframe=document.createElement('iframe');
    iframe.style.border='0'; iframe.style.display='block';
    iframe.style.width='100%'; iframe.style.height='0px'; // установим по сообщению
    iframe.loading='lazy';
    if('srcdoc' in iframe) iframe.srcdoc=buildSrcdoc();
    else { var blob=new Blob([buildSrcdoc()],{type:'text/html'}); iframe.src=URL.createObjectURL(blob); }
    box.innerHTML=''; box.appendChild(iframe);

    window.addEventListener('message', function(ev){
      var d=ev.data||{}; if(d.type==='oc-size'){
        var h=+d.h||0; if(h>0 && h<4000){ iframe.style.height=h+'px'; }
      }
    });
  }

  // ---------- запуск ----------
  function mount(wrap){
    var box=wrap.firstChild;
    renderDirect(box, function(success){
      if(success){ log('[onclick-flex] direct render OK'); return; }
      log('[onclick-flex] direct failed → iframe srcdoc');
      renderIframe(box);
    });
  }
  function init(){
    var wrap=placeAnchor(); if(!wrap) return;
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ io.disconnect(); mount(wrap); } });
      },{root:null,rootMargin:'600px 0px',threshold:0});
      io.observe(wrap);
    } else { mount(wrap); }
  }
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    init(); setTimeout(init,800); setTimeout(init,2000);
    var mo=new MutationObserver(function(){ init(); });
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
