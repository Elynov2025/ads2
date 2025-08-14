(function(){
  var CFG = {
    BLOCK_ID: 'R-A-14383531-11',
    SIZE: {w:300, h:250},
    WRAP_ID: 'ya-rtb-300x250-after-last-p',
    SOURCES: [
      'https://elynov2025.github.io/ads2/ad2.html',
      'https://cdn.jsdelivr.net/gh/elynov2025/ads2@main/ad2.html',
      'https://raw.githubusercontent.com/elynov2025/ads2/main/ad2.html'
    ],
    TIMEOUT_MS: 4500,
    DEBUG: true
  };
  function log(){ if(CFG.DEBUG) console.log.apply(console, arguments); }
  (function pre(hs){ (hs||[]).forEach(function(h){ try{
    var a=document.createElement('link'); a.rel='preconnect'; a.href=h;
    var b=document.createElement('link'); b.rel='dns-prefetch'; b.href=h;
    document.head.appendChild(a); document.head.appendChild(b);
  }catch(e){}}); })(['https://elynov2025.github.io','https://cdn.jsdelivr.net','https://raw.githubusercontent.com','https://yandex.ru']);

  function visible(el){ if(!el) return false;
    if(!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)) return false;
    var cs=getComputedStyle(el); return cs.visibility!=='hidden' && cs.display!=='none';
  }
  function contentRoot(){
    var sels=['[data-hook="post-content"]','[data-testid="richContentRenderer"]','article [data-hook*="content"]','article','main article','main'];
    for(var i=0;i<sels.length;i++){ var el=document.querySelector(sels[i]); if(el){ log('[root]', sels[i], el); return el; } }
    log('[root] fallback body'); return document.body;
  }
  function lastParagraphLike(root){
    // расширенный поиск «абзацев» для Wix/редакторов
    var qs='p, [data-attributes-key="paragraph"], div[role="paragraph"], .wixui-rich-text__text, [data-testid="richTextElement"], li, blockquote';
    var nodes=[].slice.call(root.querySelectorAll(qs));
    if(!nodes.length){ nodes=[].slice.call(document.querySelectorAll('p')); }
    log('[nodes]', nodes.length);
    for(var i=nodes.length-1;i>=0;i--){
      var el=nodes[i], txt=(el.textContent||'').trim();
      if(visible(el) && txt.length>=1){ log('[last]', el, txt.slice(0,40)+'…'); return el; }
    }
    log('[last] not found'); return null;
  }
  function buildAnchor(){
    var wrap=document.getElementById(CFG.WRAP_ID);
    if(wrap) return wrap;
    wrap=document.createElement('div'); wrap.id=CFG.WRAP_ID;
    wrap.style.cssText='width:100%;display:block;margin:16px 0 0;';
    var box=document.createElement('div');
    box.style.cssText=['width:'+CFG.SIZE.w+'px','height:'+CFG.SIZE.h+'px','max-width:100%','margin:12px auto 0','display:block','box-sizing:border-box','overflow:hidden'].join(';');
    wrap.appendChild(box); return wrap;
  }
  function placeAnchor(){
    var root=contentRoot(); var last=lastParagraphLike(root);
    if(!last) return null;
    var wrap=buildAnchor(); if(!wrap.parentNode){ last.insertAdjacentElement('afterend', wrap); log('[place] inserted after last paragraph'); }
    return wrap;
  }
  function buildSrcdoc(){
    var id='ya_rtb_root';
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;padding:0;background:transparent}#'+id+'{display:block;margin:0 auto;max-width:100%}</style></head><body><div id="'+id+'" style="width:'+CFG.SIZE.w+'px;height:'+CFG.SIZE.h+'px"></div><script src="https://yandex.ru/ads/system/context.js"><\\/script><script>window.yaContextCb=window.yaContextCb||[];yaContextCb.push(function(){try{Ya.Context.AdvManager.render({blockId:"'+CFG.BLOCK_ID+'",renderTo:"'+id+'",onRender:function(){function p(){var h=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);parent.postMessage({type:"ya-rtb-size",h:h},\"*\")}p();setTimeout(p,300);setTimeout(p,1200);setTimeout(p,3000);}});}catch(e){}});<\\/script></body></html>';
  }
  function mountIframe(wrap){
    var box=wrap.firstChild; box.innerHTML='';
    var iframe=document.createElement('iframe');
    iframe.width=CFG.SIZE.w; iframe.height=CFG.SIZE.h; iframe.loading='lazy';
    iframe.style.border='0'; iframe.style.display='block';
    box.appendChild(iframe);

    var current=-1, timer=null;
    function next(){
      current++;
      if(current<CFG.SOURCES.length){
        var u=CFG.SOURCES[current]+'?block='+encodeURIComponent(CFG.BLOCK_ID)+'&w='+CFG.SIZE.w+'&h='+CFG.SIZE.h;
        log('[try]', u);
        iframe.removeAttribute('srcdoc'); iframe.src=u;
        clearTimeout(timer); timer=setTimeout(function(){ log('[timeout] switch'); next(); }, CFG.TIMEOUT_MS);
      }else{
        log('[fallback] srcdoc');
        iframe.removeAttribute('src');
        if('srcdoc' in iframe) iframe.srcdoc=buildSrcdoc();
        else { var blob=new Blob([buildSrcdoc()],{type:'text/html'}); iframe.src=URL.createObjectURL(blob); }
      }
    }
    window.addEventListener('message', function(ev){
      if(ev.source!==iframe.contentWindow) return;
      var d=ev.data||{};
      if(d.type==='ya-rtb-size'){
        clearTimeout(timer);
        var h=+d.h||CFG.SIZE.h;
        if(h>0 && h<1500) iframe.style.height=h+'px';
        log('[size]', h);
      }
    });
    next();
  }
  function init(){
    var wrap=placeAnchor(); if(!wrap){ log('[init] no anchor, retry'); return; }
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ io.disconnect(); log('[observer] intersect → mount'); mountIframe(wrap); } }); },{root:null,rootMargin:'600px 0px',threshold:0});
      io.observe(wrap);
    } else { mountIframe(wrap); }
  }
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    init(); setTimeout(init,800); setTimeout(init,2000); setTimeout(init,4000);
    var mo=new MutationObserver(function(){ init(); });
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
