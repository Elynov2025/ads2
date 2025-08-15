(function () {
  var CFG = {
    WRAP_ID: 'aclib-site-top',
    PAGES: [
      'https://elynov2025.github.io/ads2/ad-aclib.html',
      'https://cdn.jsdelivr.net/gh/elynov2025/ads2@main/ad-aclib.html',
      'https://raw.githubusercontent.com/elynov2025/ads2/main/ad-aclib.html'
    ],
    TIMEOUT_MS: 3500,
    DEBUG: false
  };
  function log(){ if(CFG.DEBUG) console.log.apply(console, arguments); }

  // ускоряем соединение
  (function pre(hs){
    (hs||[]).forEach(function(h){
      try{
        var a=document.createElement('link'); a.rel='preconnect'; a.href=h;
        var b=document.createElement('link'); b.rel='dns-prefetch'; b.href=h;
        document.head.appendChild(a); document.head.appendChild(b);
      }catch(e){}
    });
  })(['https://elynov2025.github.io','https://cdn.jsdelivr.net','https://raw.githubusercontent.com','https://acscdn.com']);

  // ---- Контейнер в самом верху ----
  function buildTopAnchor(){
    var wrap=document.getElementById(CFG.WRAP_ID);
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id=CFG.WRAP_ID;
      wrap.style.cssText=[
        'width:100%',
        'display:block',
        'margin:0 0 16px 0',
        'box-sizing:border-box'
      ].join(';');
      var box=document.createElement('div');
      box.style.cssText='width:100%;max-width:100%;display:block;overflow:visible';
      wrap.appendChild(box);
    }
    // сделать первым элементом в <body>
    var firstEl = document.body.firstElementChild;
    if (firstEl !== wrap) {
      document.body.insertAdjacentElement('afterbegin', wrap);
    }
    return wrap;
  }

  // ---- srcdoc-фолбэк ----
  function buildSrcdoc(){
    var html='<!doctype html><html><head><meta charset="utf-8">'
      +'<meta name="referrer" content="no-referrer">'
      +'<style>html,body{margin:0;padding:0;background:transparent}#wrap{display:block;width:100%;max-width:100%;margin:0 auto}</style>'
      +'</head><body>'
      +'<div id="wrap"><div><script data-cfasync="false" src="https://acscdn.com/script/atg.js" async><\\/script>'
      +'<script>(function(w){w.aclib=w.aclib||{};function go(){if(w.aclib&&typeof w.aclib.runBanner==="function"){w.aclib.runBanner({zoneId:"10287402"});}else{setTimeout(go,200);}}go();})(window);<\\/script>'
      +'</div></div>'
      +'<script>(function(){function p(){var h=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight,document.documentElement.offsetHeight,document.body.offsetHeight);try{parent.postMessage({type:"aclib-size",h:h},"*")}catch(e){}}p();setTimeout(p,300);setTimeout(p,1200);setTimeout(p,3000);try{var mo=new MutationObserver(p);mo.observe(document.body,{childList:true,subtree:true});}catch(e){}})();<\\/script>'
      +'</body></html>';
    return html;
  }

  // ---- Монтаж iframe вверху ----
  function mountIframe(wrap){
    var box=wrap.firstChild; box.innerHTML='';
    var iframe=document.createElement('iframe');
    iframe.style.border='0';
    iframe.style.display='block';
    iframe.style.width='100%';
    iframe.style.height='0px';  // установим по сообщению
    iframe.loading='eager';      // верх сайта → грузим сразу
    box.appendChild(iframe);

    // авто-ресайз
    window.addEventListener('message', function(ev){
      if(ev.source!==iframe.contentWindow) return;
      var d=ev.data||{};
      if(d.type==='aclib-size'){
        var h=+d.h||0;
        if(h>0 && h<5000) iframe.style.height=h+'px';
      }
    });

    // перебор источников
    var i=-1, timer=null;
    function next(){
      i++;
      if(i<CFG.PAGES.length){
        var u=CFG.PAGES[i];
        iframe.removeAttribute('srcdoc');
        iframe.src=u;
        log('[aclib-site-top] try', u);
        clearTimeout(timer);
        timer=setTimeout(function(){ log('[aclib-site-top] timeout → switch'); next(); }, CFG.TIMEOUT_MS);
      }else{
        log('[aclib-site-top] using srcdoc');
        iframe.removeAttribute('src');
        if('srcdoc' in iframe) iframe.srcdoc=buildSrcdoc();
        else { var blob=new Blob([buildSrcdoc()],{type:'text/html'}); iframe.src=URL.createObjectURL(blob); }
      }
    }
    next();
  }

  function init(){
    var wrap=buildTopAnchor();
    mountIframe(wrap);
  }

  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    init();
    // гарантируем, что баннер останется первым при SPA-перерисовках
    var mo=new MutationObserver(function(){
      var wrap=document.getElementById(CFG.WRAP_ID);
      if(!wrap){ init(); return; }
      var firstEl=document.body.firstElementChild;
      if(firstEl!==wrap){ document.body.insertAdjacentElement('afterbegin', wrap); }
    });
    mo.observe(document.body,{childList:true,subtree:false});
  });
})();
