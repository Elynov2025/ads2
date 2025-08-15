(function(){
  var BLOCK_ID = 'R-A-14383531-11';
  var WRAP_ID  = 'ya-rtb-flex-after-last-p-direct';
  var DEBUG = false;
  function log(){ if(DEBUG) console.log.apply(console, arguments); }

  (function pre(hs){ (hs||[]).forEach(function(h){
    try{
      var a=document.createElement('link'); a.rel='preconnect'; a.href=h;
      var b=document.createElement('link'); b.rel='dns-prefetch'; b.href=h;
      document.head.appendChild(a); document.head.appendChild(b);
    }catch(e){}
  }); })(['https://yandex.ru']);

  // --- Поиск места вставки ---
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

  function buildAnchor(){
    var wrap=document.getElementById(WRAP_ID);
    if(wrap) return wrap;
    wrap=document.createElement('div');
    wrap.id=WRAP_ID;
    wrap.style.cssText='width:100%;display:block;margin:16px 0 0;';
    var contId='ya_rtb_'+Math.random().toString(36).slice(2);
    var cont=document.createElement('div');
    cont.id=contId; // уникальный renderTo
    // никаких width/height — пусть Яндекс сам управляет
    wrap.appendChild(cont);
    wrap.setAttribute('data-cont', contId);
    return wrap;
  }

  function placeAnchor(){
    var root=contentRoot(), last=lastParagraphLike(root);
    if(!last){ log('[ya-direct] last paragraph not found'); return null; }
    var wrap=buildAnchor(); if(!wrap.parentNode) last.insertAdjacentElement('afterend', wrap);
    return wrap;
  }

  function ensureContext(cb){
    window.yaContextCb = window.yaContextCb || [];
    if (window.Ya && Ya.Context && Ya.Context.AdvManager) { cb(); return; }
    var s=document.querySelector('script[src^="https://yandex.ru/ads/system/context.js"]');
    if(!s){
      s=document.createElement('script');
      s.src='https://yandex.ru/ads/system/context.js';
      s.async=true;
      s.onload=function(){ cb(); };
      document.head.appendChild(s);
    }
    window.yaContextCb.push(cb);
  }

  function renderOnce(wrap){
    var contId = wrap.getAttribute('data-cont');
    try{
      Ya.Context.AdvManager.render({
        blockId: BLOCK_ID,
        renderTo: contId
      });
      log('[ya-direct] rendered →', contId);
    }catch(e){ log('[ya-direct] render error', e); }
  }

  function init(){
    var wrap=placeAnchor(); if(!wrap) return;
    var run=function(){ ensureContext(function(){ renderOnce(wrap); }); };
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ io.disconnect(); run(); } });
      },{root:null,rootMargin:'600px 0px',threshold:0});
      io.observe(wrap);
    } else { run(); }
  }

  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    init(); setTimeout(init,800); setTimeout(init,2000);
    // SPA Wix — повторная проверка при подменах контента
    var mo=new MutationObserver(function(){ init(); });
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
