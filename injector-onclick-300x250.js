/* injector-onclick-300x250.js
   Баннер Onclicka 300×250 после последнего абзаца.
   Прямая вставка + надёжный fallback в iframe srcdoc.
   Поддержка SPA (Wix), ленивый старт, авто-подстройка высоты. */

(function () {
  var CFG = {
    WIDTH: 300,
    HEIGHT: 250,
    WRAP_ID: 'oc-300x250-after-last-p',
    // код сети
    BANNER_ID: '6064015',
    ADMPID: '307391',
    SRC: 'https://js.onclckmn.com/static/onclicka.js',
    // поведение
    TIMEOUT_MS: 3500,
    DEBUG: false
  };
  function log(){ if(CFG.DEBUG) console.log.apply(console, arguments); }

  // ускорим соединение
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
    box.style.cssText=[
      'width:'+CFG.WIDTH+'px',
      'height:'+CFG.HEIGHT+'px',
      'max-width:100%',
      'margin:12px auto 0',
      'display:block',
      'box-sizing:border-box',
      'overflow:hidden'
    ].join(';');
    wrap.appendChild(box);
    return wrap;
  }
  function placeAnchor(){
    var root=contentRoot(), last=lastParagraphLike(root);
    if(!last){ log('[onclick] last paragraph not found'); return null; }
    var wrap=buildAnchor();
    if(!wrap.parentNode) last.insertAdjacentElement('afterend', wrap);
    return wrap;
  }

  // ---------- прямая вставка сети ----------
  function renderDirect(box, done){
    var holder=document.createElement('div');
    holder.setAttribute('data-banner-id', CFG.BANNER_ID);
    holder.style.width=CFG.WIDTH+'px';
    holder.style.height=CFG.HEIGHT+'px';

    var s=document.createElement('script');
    s.async=true;
    s.src=CFG.SRC;
    s.setAttribute('data-admpid', CFG.ADMPID);

    var ok=false, timer=null;

    function checkFilled(){
      // если сеть что-то вставила (обычно iframe) — считаем успехом
      if (holder.querySelector('iframe') || holder.childElementCount>0) {
        ok=true; clearTimeout(timer); if(done) done(true); return;
      }
    }
    s.onload=function(){
      // дадим время сети отрисоваться
      setTimeout(checkFilled, 700);
      timer=setTimeout(function(){ checkFilled(); if(!ok && done) done(false); }, CFG.TIMEOUT_MS);
    };
    s.onerror=function(){ if(done) done(false); };

    box.innerHTML='';
    box.appendChild(holder);
    box.appendChild(s);
  }

  // ---------- fallback: iframe srcdoc с тем же кодом ----------
  function buildSrcdoc(){
    var html='<!doctype html><html><head><meta charset="utf-8">'
      +'<meta name="referrer" content="no-referrer">'
      +'<style>html,body{margin:0;padding:0;background:transparent}#wrap{display:block;margin:0 auto;max-width:100%}</style>'
      +'</head><body>'
      +'<div id="wrap" style="width:'+CFG.WIDTH+'px;height:'+CFG.HEIGHT+'px">'
      +'<div data-banner-id="'+CFG.BANNER_ID+'"></div>'
      +'<script async src="'+CFG.SRC+'" data-admpid="'+CFG.ADMPID+'"><\\/script>'
      +'<script>(function(){function post(){parent.postMessage({type:"oc-size",h:'+CFG.HEIGHT+'},"*")}post();setTimeout(post,600);setTimeout(post,1500);})();<\\/script>'
      +'</div></body></html>';
    return html;
  }
  function renderIframe(box){
    var iframe=document.createElement('iframe');
    iframe.width=CFG.WIDTH; iframe.height=CFG.HEIGHT;
    iframe.style.border='0'; iframe.style.display='block'; iframe.loading='lazy';
    if('srcdoc' in iframe) iframe.srcdoc=buildSrcdoc();
    else { var blob=new Blob([buildSrcdoc()],{type:'text/html'}); iframe.src=URL.createObjectURL(blob); }
    box.innerHTML=''; box.appendChild(iframe);
    // авто-подстройка (на всякий случай)
    window.addEventListener('message', function(ev){
      var d=ev.data||{}; if(d.type==='oc-size'){ var h=+d.h||CFG.HEIGHT; if(h>0 && h<1500) iframe.style.height=h+'px'; }
    });
  }

  // ---------- запуск ----------
  function mount(wrap){
    var box=wrap.firstChild;
    renderDirect(box, function(success){
      if(success){ log('[onclick] direct render OK'); return; }
      log('[onclick] direct failed → iframe srcdoc');
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
    } else {
      mount(wrap);
    }
  }
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    init(); setTimeout(init,800); setTimeout(init,2000);
    // SPA Wix: реагируем на смену контента
    var mo=new MutationObserver(function(){ init(); });
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
