(function(){
  // === НАСТРОЙКИ ===
  var BLOCK_ID = 'R-A-14383531-11';      // ваш RTB-блок
  var WRAP_ID = 'ya-rtb-flex-after-last-p';
  var AD_PAGE = [
    // при желании можно добавить резервные источники
    'https://elynov2025.github.io/ads2/ad2.html',
    'https://cdn.jsdelivr.net/gh/elynov2025/ads2@main/ad2.html',
    'https://raw.githubusercontent.com/elynov2025/ads2/main/ad2.html'
  ];
  var TIMEOUT_MS = 3500;
  var DEBUG = false;

  function log(){ if(DEBUG) console.log.apply(console, arguments); }
  (function pre(hs){ (hs||[]).forEach(function(h){
    try{
      var a=document.createElement('link'); a.rel='preconnect'; a.href=h;
      var b=document.createElement('link'); b.rel='dns-prefetch'; b.href=h;
      document.head.appendChild(a); document.head.appendChild(b);
    }catch(e){}
  }); })(['https://elynov2025.github.io','https://cdn.jsdelivr.net','https://raw.githubusercontent.com','https://yandex.ru']);

  // --- Поиск места вставки (последний «абзац») ---
  function visible(el){
    if(!el) return false;
    if(!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)) return false;
    var cs=getComputedStyle(el);
    return cs.visibility!=='hidden' && cs.display!=='none';
  }
  function contentRoot(){
    var sels=['[data-hook="post-content"]','[data-testid="richContentRenderer"]','article [data-hook*="content"]','article','main article','main'];
    for(var i=0;i<sels.length;i++){ var el=document.querySelector(sels[i]); if(el) return el; }
    return document.body;
  }
  function lastParagraphLike(root){
    var q='p, [data-attributes-key="paragraph"], div[role="paragraph"], .wixui-rich-text__text, [data-testid="richTextElement"], li, blockquote';
    var nodes=[].slice.call(root.querySelectorAll(q));
    if(!nodes.length) nodes=[].slice.call(document.querySelectorAll('p'));
    for(var i=nodes.length-1;i>=0;i--){
      var el=nodes[i], txt=(el.textContent||'').trim();
      if(visible(el) && txt.length>=1) return el;
    }
    return null;
  }

  // --- Контейнер ---
  function buildAnchor(){
    var wrap=document.getElementById(WRAP_ID);
    if(wrap) return wrap;
    wrap=document.createElement('div');
    wrap.id=WRAP_ID;
    wrap.style.cssText='width:100%;display:block;margin:16px 0 0;';
    var box=document.createElement('div');
    // без фиксированных размеров
    box.style.cssText=['width:100%','max-width:100%','margin:12px auto 0','display:block','box-sizing:border-box','overflow:visible'].join(';');
    wrap.appendChild(box);
    return wrap;
  }
  function placeAnchor(){
    var root=contentRoot(), last=lastParagraphLike(root);
    if(!last){ log('[ya-iframe] last paragraph not found'); return null; }
    var wrap=buildAnchor(); if(!wrap.parentNode) last.insertAdjacentElement('afterend', wrap);
    return wrap;
  }

  // --- Вставка iframe с резервами и srcdoc-фолбэком ---
  function buildSrcdoc(){
    // Встроенная версия на случай недоступности всех источников ad2.html
    var id='ya_rt_container';
    var html='<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;padding:0;background:transparent}#wrap{display:block;width:100%;max-width:100%;margin:0 auto}</style></head><body><div id="wrap"><div id="'+id+'"></div></div><script src="https://yandex.ru/ads/system/context.js"><\\/script><script>window.yaContextCb=window.yaContextCb||[];yaContextCb.push(function(){try{Ya.Context.AdvManager.render({blockId:"'+BLOCK_ID+'",renderTo:"'+id+'",onRender:function(){function p(){var h=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight,document.documentElement.offsetHeight,document.body.offsetHeight);parent.postMessage({type:"ya-rtb-size",h:h},"*")}p();setTimeout(p,300);setTimeout(p,1200);setTimeout(p,3000);try{var mo=new MutationObserver(p);mo.observe(document.body,{childList:true,subtree:true});}catch(e){} }})}catch(e){}});<\\/script></body></html>';
    return html;
  }

  function mountIframe(wrap){
    var box=wrap.firstChild; box.innerHTML='';
    var iframe=document.createElement('iframe');
    iframe.style.border='0'; iframe.style.display='block';
    iframe.style.width='100%'; iframe.style.height='0px'; // высоту задаём по postMessage
    iframe.loading='lazy';
    box.appendChild(iframe);

    // авто-ресайз
    window.addEventListener('message', function(ev){
      if(ev.source!==iframe.contentWindow) return;
      var d=ev.data||{};
      if(d.type==='ya-rtb-size'){
        var h=+d.h||0; if(h>0 && h<4000){ iframe.style.height=h+'px'; }
      }
    });

    // перебор источников
    var i=-1, timer=null;
    function next(){
      i++;
      if(i<AD_PAGE.length){
        var u=AD_PAGE[i]+'?block='+encodeURIComponent(BLOCK_ID)+'&renderTo=ya_rt_container';
        iframe.removeAttribute('srcdoc'); iframe.src=u;
        log('[ya-iframe] try', u);
        clearTimeout(timer);
        timer=setTimeout(function(){ log('[ya-iframe] timeout, switch'); next(); }, TIMEOUT_MS);
      }else{
        // srcdoc-фолбэк
        log('[ya-iframe] using srcdoc fallback');
        iframe.removeAttribute('src');
        if('srcdoc' in iframe) iframe.srcdoc=buildSrcdoc();
        else {
          var blob=new Blob([buildSrcdoc()],{type:'text/html'});
          iframe.src=URL.createObjectURL(blob);
        }
      }
    }
    next();
  }

  function init(){
    var wrap=placeAnchor(); if(!wrap) return;
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ io.disconnect(); mountIframe(wrap); } });
      },{root:null,rootMargin:'600px 0px',threshold:0});
      io.observe(wrap);
    } else {
      mountIframe(wrap);
    }
  }

  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    init(); setTimeout(init,800); setTimeout(init,2000);
    // SPA Wix — реагируем на замены контента
    var mo=new MutationObserver(function(){ init(); });
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
