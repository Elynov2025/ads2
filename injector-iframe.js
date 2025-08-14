/* injector-iframe.js
   Яндекс RTB 300x250 после последнего абзаца.
   Источники: GitHub Pages → jsDelivr → raw.githubusercontent; srcdoc-фолбэк.
   SPA Wix поддерживается (MutationObserver), ленивый старт (IntersectionObserver). */

(function(){
  // === НАСТРОЙКИ ===
  var BLOCK_ID = 'R-A-14383531-11';     // ваш RTB-блок (в кабинете должен быть 300×250)
  var SIZE = { w: 300, h: 250 };
  var WRAP_ID = 'ya-rtb-300x250-after-last-p';
  var SOURCES = [
    'https://elynov2025.github.io/ads2/ad2.html',
    'https://cdn.jsdelivr.net/gh/elynov2025/ads2@main/ad2.html',
    'https://raw.githubusercontent.com/elynov2025/ads2/main/ad2.html'
  ];
  var TIMEOUT_MS = 3500;     // ожидание ответа от источника
  var DEBUG = false;

  function log(){ if (DEBUG) console.log.apply(console, arguments); }
  function preconnect(hrefs){
    (hrefs||[]).forEach(function(h){
      var l1=document.createElement('link'); l1.rel='preconnect'; l1.href=h;
      var l2=document.createElement('link'); l2.rel='dns-prefetch'; l2.href=h;
      document.head.appendChild(l1); document.head.appendChild(l2);
    });
  }
  preconnect(['https://elynov2025.github.io','https://cdn.jsdelivr.net','https://raw.githubusercontent.com','https://yandex.ru']);

  // --- поиск места вставки ---
  function visible(el){
    if(!el) return false;
    if(!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)) return false;
    var cs=getComputedStyle(el);
    return cs.visibility!=='hidden' && cs.display!=='none';
  }
  function root(){
    var sels=['[data-hook="post-content"]','[data-testid="richContentRenderer"]','article [data-hook*="content"]','article','main article','main'];
    for(var i=0;i<sels.length;i++){ var el=document.querySelector(sels[i]); if(el) return el; }
    return document.body;
  }
  function lastTextBlock(r){
    var nodes=[].slice.call(r.querySelectorAll('p, li, blockquote, .wixui-rich-text__text, [data-testid="richTextElement"]'));
    for(var i=nodes.length-1;i>=0;i--){
      var el=nodes[i], txt=(el.textContent||'').trim();
      if(visible(el) && txt.length>=20) return el;
    }
    return null;
  }

  // --- контейнер ---
  function buildAnchor(){
    var wrap=document.getElementById(WRAP_ID);
    if(wrap) return wrap;
    wrap=document.createElement('div');
    wrap.id=WRAP_ID;
    wrap.style.cssText='width:100%;display:block;margin:16px 0 0;';
    var box=document.createElement('div');
    box.style.cssText=[
      'width:'+SIZE.w+'px','height:'+SIZE.h+'px','max-width:100%','margin:12px auto 0',
      'display:block','box-sizing:border-box','overflow:hidden'
    ].join(';');
    wrap.appendChild(box);
    return wrap;
  }
  function placeAnchor(){
    var r=root(), last=lastTextBlock(r);
    if(!last){ log('[ya-rtb] no last paragraph'); return null; }
    var wrap=buildAnchor();
    if(!wrap.parentNode) last.insertAdjacentElement('afterend', wrap);
    return wrap;
  }

  // --- html для srcdoc-фолбэка ---
  function buildSrcdoc(){
    var id='yandex_rtb_'+BLOCK_ID;
    var html='<!doctype html><html><head><meta charset="utf-8">'
      +'<meta name="referrer" content="no-referrer"><style>html,body{margin:0;padding:0;background:transparent}</style>'
      +'</head><body><div id="'+id+'"></div>'
      +'<script src="https://yandex.ru/ads/system/context.js"><\\/script>'
      +'<script>window.yaContextCb=window.yaContextCb||[];yaContextCb.push(function(){try{Ya.Context.AdvManager.render({blockId:"'+BLOCK_ID+'",renderTo:"'+id+'",onRender:function(){function p(){var h=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);parent.postMessage({type:"ya-rtb-size",h:h},"*")}p();setTimeout(p,300);setTimeout(p,1200);setTimeout(p,3000);}});}catch(e){});<\\/script>'
      +'</body></html>';
    return html;
  }

  // --- вставка iframe и перебор источников ---
  function mountIframe(wrap){
    var box=wrap.firstChild; box.innerHTML='';
    var iframe=document.createElement('iframe');
    iframe.width=SIZE.w; iframe.height=SIZE.h; iframe.loading='lazy';
    iframe.style.border='0'; iframe.style.display='block';
    box.appendChild(iframe);

    var current=-1, timer=null;
    function nextSource(){
      current++;
      if(current<SOURCES.length){
        var u=SOURCES[current]+'?block='+encodeURIComponent(BLOCK_ID)+'&w='+SIZE.w+'&h='+SIZE.h;
        log('[ya-rtb] try', u);
        iframe.removeAttribute('srcdoc'); iframe.src=u;
        clearTimeout(timer);
        timer=setTimeout(function(){ log('[ya-rtb] timeout, switch'); nextSource(); }, TIMEOUT_MS);
      }else{
        log('[ya-rtb] srcdoc fallback');
        iframe.removeAttribute('src');
        if('srcdoc' in iframe){ iframe.srcdoc=buildSrcdoc(); }
        else { var blob=new Blob([buildSrcdoc()],{type:'text/html'}); iframe.src=URL.createObjectURL(blob); }
      }
    }

    window.addEventListener('message', function(ev){
      if(ev.source!==iframe.contentWindow) return;
      var d=ev.data||{};
      if(d.type==='ya-rtb-size'){
        clearTimeout(timer);
        var h=+d.h||SIZE.h; if(h>0 && h<1500) iframe.style.height=h+'px';
      }
    });

    nextSource();
  }

  function init(){
    var wrap=placeAnchor(); if(!wrap) return;
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(arr){
        arr.forEach(function(e){ if(e.isIntersecting){ io.disconnect(); mountIframe(wrap); } });
      },{root:null,rootMargin:'600px 0px',threshold:0});
      io.observe(wrap);
    } else {
      mountIframe(wrap);
    }
  }

  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    init(); setTimeout(init,800); setTimeout(init,2000);
    var mo=new MutationObserver(function(){ init(); });
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
