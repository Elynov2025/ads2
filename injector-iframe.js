(function(){
  var CFG = {
    SRC: 'https://elynov2025.github.io/ads2/ad2.html', // <-- ваш новый источник
    BLOCK_ID: 'R-A-14383531-11',
    WIDTH: 300, HEIGHT: 250,
    WRAP_ID: 'ya-rtb-300x250-after-last-p',
    DEBUG: false
  };

  function log(){ if(CFG.DEBUG) console.log.apply(console, arguments); }

  function selectContentRoot(){
    var sels = [
      '[data-hook="post-content"]',
      '[data-testid="richContentRenderer"]',
      'article [data-hook*="content"]',
      'article','main article','main'
    ];
    for (var i=0;i<sels.length;i++){
      var el = document.querySelector(sels[i]);
      if (el) return el;
    }
    return document.body;
  }

  function visible(el){
    if(!el) return false;
    if(!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)) return false;
    var cs=getComputedStyle(el);
    return cs.visibility!=='hidden' && cs.display!=='none';
  }

  function lastTextBlock(root){
    var nodes = Array.prototype.slice.call(root.querySelectorAll(
      'p, li, blockquote, .wixui-rich-text__text, [data-testid="richTextElement"]'
    ));
    for (var i=nodes.length-1;i>=0;i--){
      var el = nodes[i], txt=(el.textContent||'').trim();
      if (visible(el) && txt.length >= 20) return el;
    }
    return null;
  }

  function placeIframeOnce(){
    if (document.getElementById(CFG.WRAP_ID)) return true;

    var root = selectContentRoot();
    var last = lastTextBlock(root);
    if (!last) { log('[injector] last text block not found'); return false; }

    var wrap = document.createElement('div');
    wrap.id = CFG.WRAP_ID;
    wrap.style.cssText = 'width:100%;display:block;margin:16px 0 0;';

    var box = document.createElement('div');
    box.style.cssText = [
      'width:'+CFG.WIDTH+'px',
      'height:'+CFG.HEIGHT+'px',
      'max-width:100%',
      'margin:12px auto 0',
      'display:block',
      'box-sizing:border-box',
      'overflow:hidden'
    ].join(';');

    var iframe = document.createElement('iframe');
    iframe.width = CFG.WIDTH;
    iframe.height = CFG.HEIGHT;
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.loading = 'lazy';

    // пробрасываем параметры (если ad2.html их поддерживает)
    var u = CFG.SRC + '?block=' + encodeURIComponent(CFG.BLOCK_ID) +
            '&w=' + CFG.WIDTH + '&h=' + CFG.HEIGHT;
    iframe.src = u;

    // авто-резайз по сообщению из iframe
    window.addEventListener('message', function(ev){
      var d = ev && ev.data;
      if (!d || d.type !== 'ya-rtb-size') return;
      var h = +d.h || CFG.HEIGHT;
      if (h > 0 && h < 1200) iframe.style.height = h + 'px';
    });

    box.appendChild(iframe);
    wrap.appendChild(box);
    last.insertAdjacentElement('afterend', wrap);
    return true;
  }

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    placeIframeOnce();
    setTimeout(placeIframeOnce, 600);
    setTimeout(placeIframeOnce, 1500);

    // SPA-навигация Wix
    var mo = new MutationObserver(function(){ placeIframeOnce(); });
    mo.observe(document.body, {childList:true, subtree:true});
  });
})();
