/* ==================================================================
   SOPHIA — SITE BEHAVIOR
   Microinterações e transições descritas no Design System:
   scroll reveal, contadores, barras de dado, waveform, dissolução
   do currículo e sistema de partículas do hero.
   ================================================================== */
(function(){
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 760;

  /* ============ NAV scroll state ============ */
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function(){
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, {passive:true});

  /* ============ Menu component (dropdown toggle) ============ */
  document.querySelectorAll('.menu-trigger').forEach(function(trigger){
    trigger.addEventListener('click', function(){
      var menu = trigger.closest('.menu');
      var wasOpen = menu.classList.contains('is-open');
      document.querySelectorAll('.menu.is-open').forEach(function(m){ m.classList.remove('is-open'); });
      if(!wasOpen) menu.classList.add('is-open');
    });
  });
  document.addEventListener('click', function(e){
    if(!e.target.closest('.menu')){
      document.querySelectorAll('.menu.is-open').forEach(function(m){ m.classList.remove('is-open'); });
    }
  });

  /* ============ Scroll reveal ============ */
  var revealEls = document.querySelectorAll('.reveal, .step-card');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.18, rootMargin:'0px 0px -40px 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ============ Metric bars (data-panel) ============ */
  var bars = document.querySelectorAll('.metric-bar-fill');
  if('IntersectionObserver' in window && bars.length){
    var barIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.style.width = entry.target.dataset.width + '%';
          barIo.unobserve(entry.target);
        }
      });
    }, {threshold:.4});
    bars.forEach(function(b){ barIo.observe(b); });
  }

  /* ============ Count-up numbers (.stat-number) ============ */
  var counters = document.querySelectorAll('.stat-number');
  function animateCount(el){
    var target = parseFloat(el.dataset.target);
    var decimal = el.dataset.decimal;
    var suffix = el.dataset.suffix || '';
    var prefix = el.dataset.prefix || '';
    if(decimal){
      var dTarget = parseFloat(decimal);
      var dDur = 1400, dT0 = null;
      function stepD(ts){
        if(!dT0) dT0 = ts;
        var p = Math.min((ts - dT0) / dDur, 1);
        var val = (dTarget * p).toFixed(1).replace('.', ',');
        el.textContent = val;
        if(p < 1) requestAnimationFrame(stepD);
      }
      requestAnimationFrame(stepD);
      return;
    }
    var dur = 1400, t0 = null;
    function step(ts){
      if(!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var val = Math.floor(target * p);
      el.textContent = prefix + val + suffix;
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window && counters.length){
    var cIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          if(reduceMotion){
            var el = entry.target;
            el.textContent = (el.dataset.prefix||'') + (el.dataset.decimal ? el.dataset.decimal.replace('.',',') : el.dataset.target) + (el.dataset.suffix||'');
          } else {
            animateCount(entry.target);
          }
          cIo.unobserve(entry.target);
        }
      });
    }, {threshold:.5});
    counters.forEach(function(c){ cIo.observe(c); });
  }

  /* ============ Waveform bars ============ */
  function buildWave(container, count, minH, maxH){
    for(var i=0; i<count; i++){
      var bar = document.createElement('span');
      var h = Math.floor(Math.random() * (maxH - minH) + minH);
      bar.style.height = h + 'px';
      bar.style.animationDelay = (Math.random() * 1.2).toFixed(2) + 's';
      bar.style.animationDuration = (1.1 + Math.random() * 1).toFixed(2) + 's';
      container.appendChild(bar);
    }
  }
  var mainWave = document.getElementById('waveform');
  if(mainWave) buildWave(mainWave, isMobile ? 28 : 48, 16, 100);
  document.querySelectorAll('.versus-mini-wave').forEach(function(el){
    buildWave(el, 18, 6, 30);
  });

  /* ============ Doc lines dissolve (Impasse) ============ */
  var docLines = document.getElementById('doc-lines');
  if(docLines){
    var widths = [90, 70, 82, 55, 76, 64];
    widths.forEach(function(w){
      var line = document.createElement('div');
      line.className = 'doc-line';
      line.style.width = w + '%';
      docLines.appendChild(line);
    });
    var visualEl = document.getElementById('impasse-visual');
    if('IntersectionObserver' in window){
      var dIo = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting && !reduceMotion){
            var lines = docLines.querySelectorAll('.doc-line');
            lines.forEach(function(line, i){
              setTimeout(function(){
                line.style.transition = 'transform 1.1s cubic-bezier(.16,.84,.44,1), opacity 1.1s ease';
                line.style.transform = 'translateX(' + (i % 2 === 0 ? '' : '-') + (40 + i * 14) + 'px) translateY(-6px)';
                line.style.opacity = '0.15';
              }, i * 90);
            });
            dIo.unobserve(visualEl);
          }
        });
      }, {threshold:.5});
      dIo.observe(visualEl);
    }
  }

  /* ============ Particle system (hero canvas) ============ */
  var canvas = document.getElementById('particle-canvas');
  if(canvas && !reduceMotion){
    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = {x:null, y:null};
    var w, h, count;

    function resize(){
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      canvas.style.width = canvas.offsetWidth + 'px';
    }

    function init(){
      resize();
      count = isMobile ? 34 : 78;
      particles = [];
      for(var i=0; i<count; i++){
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - .5) * .35 * window.devicePixelRatio,
          vy: (Math.random() - .5) * .35 * window.devicePixelRatio,
          r: (Math.random() * 1.6 + .8) * window.devicePixelRatio
        });
      }
    }

    function draw(){
      ctx.clearRect(0,0,w,h);
      var linkDist = (isMobile ? 90 : 130) * window.devicePixelRatio;
      for(var i=0; i<particles.length; i++){
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if(p.x < 0 || p.x > w) p.vx *= -1;
        if(p.y < 0 || p.y > h) p.vy *= -1;

        if(mouse.x !== null && !isMobile){
          var dx = p.x - mouse.x, dy = p.y - mouse.y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 160 * window.devicePixelRatio){
            var force = (160 * window.devicePixelRatio - dist) / (160 * window.devicePixelRatio);
            p.x += (dx/dist) * force * 1.1;
            p.y += (dy/dist) * force * 1.1;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(196,181,253,.55)';
        ctx.fill();

        for(var j=i+1; j<particles.length; j++){
          var p2 = particles[j];
          var ddx = p.x - p2.x, ddy = p.y - p2.y;
          var d = Math.sqrt(ddx*ddx + ddy*ddy);
          if(d < linkDist){
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(124,58,237,' + ((1 - d/linkDist) * .35) + ')';
            ctx.lineWidth = 1 * window.devicePixelRatio;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', init);
    canvas.addEventListener('mousemove', function(e){
      var rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * window.devicePixelRatio;
      mouse.y = (e.clientY - rect.top) * window.devicePixelRatio;
    });
    canvas.addEventListener('mouseleave', function(){ mouse.x = null; mouse.y = null; });
  }

})();
