/* life heroes – static site interactions (replaces the former React runtime) */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function swap(el, add, remove) {
    remove.split(' ').forEach(function (c) { if (c) el.classList.remove(c); });
    add.split(' ').forEach(function (c) { if (c) el.classList.add(c); });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');
  var icon = document.querySelector('[data-menu-icon]');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('hidden', !open);
    if (icon) swap(icon, open ? 'ri-close-line' : 'ri-menu-line', open ? 'ri-menu-line' : 'ri-close-line');
    if (toggle) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    }
  }
  if (toggle && menu) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function () { setMenu(menu.classList.contains('hidden')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Same-page links (Home / #kontakt) ---------- */
  document.querySelectorAll('a[href^="/"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      var parts = href.split('#');
      var p = parts[0] || '/';
      if (p !== window.location.pathname) return;
      if (parts[1]) {
        var t = document.getElementById(parts[1]);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', href); }
      } else {
        e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  /* ---------- FAQ accordions ---------- */
  var ITEM_OPEN = 'border-primary-300', ITEM_CLOSED = 'hover:border-background-300';
  var ICON_OPEN = 'bg-primary-500 border-primary-500 text-white rotate-180';
  var ICON_CLOSED = 'bg-background-50 text-secondary-500 group-hover:border-primary-300 group-hover:text-primary-500';
  var PANEL_OPEN = 'max-h-96 opacity-100', PANEL_CLOSED = 'max-h-0 opacity-0';
  function setFaq(item, open) {
    var btn = item.querySelector('[data-faq-btn]');
    var ic = item.querySelector('[data-faq-icon]');
    var panel = item.querySelector('[data-faq-panel]');
    swap(item, open ? ITEM_OPEN : ITEM_CLOSED, open ? ITEM_CLOSED : ITEM_OPEN);
    if (ic) swap(ic, open ? ICON_OPEN : ICON_CLOSED, open ? ICON_CLOSED : ICON_OPEN);
    if (panel) { swap(panel, open ? PANEL_OPEN : PANEL_CLOSED, open ? PANEL_CLOSED : PANEL_OPEN); panel.setAttribute('aria-hidden', open ? 'false' : 'true'); }
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    item.dataset.open = open ? '1' : '';
  }
  document.querySelectorAll('[data-faq]').forEach(function (item) {
    var panel = item.querySelector('[data-faq-panel]');
    item.dataset.open = panel && panel.classList.contains('max-h-96') ? '1' : '';
    var btn = item.querySelector('[data-faq-btn]');
    if (btn) btn.setAttribute('aria-expanded', item.dataset.open ? 'true' : 'false');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var group = item.parentElement;
      var willOpen = !item.dataset.open;
      group.querySelectorAll(':scope > [data-faq]').forEach(function (o) { if (o !== item && o.dataset.open) setFaq(o, false); });
      setFaq(item, willOpen);
    });
  });

  /* ---------- Partner filter + reveal ---------- */
  var filterBtns = document.querySelectorAll('[data-filter]');
  var partnerItems = document.querySelectorAll('[data-cat]');
  var countEl = document.querySelector('[data-partner-count]');
  var F_ON = 'bg-primary-500 text-background-50 shadow-[0_0_20px_rgba(var(--primary-500),0.3)]';
  var F_OFF = 'bg-background-100 text-foreground-600 border border-background-200 hover:border-primary-300 hover:text-primary-600';
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var cat = b.getAttribute('data-filter');
      filterBtns.forEach(function (o) { swap(o, o === b ? F_ON : F_OFF, o === b ? F_OFF : F_ON); });
      var n = 0, idx = 0;
      partnerItems.forEach(function (it) {
        var show = cat === 'Alle' || it.getAttribute('data-cat') === cat;
        it.style.display = show ? '' : 'none';
        if (show) { it.style.transitionDelay = ((idx % 5) * 60 + Math.floor(idx / 5) * 40) + 'ms'; idx++; n++; }
      });
      if (countEl) countEl.textContent = n + ' Partner' + (cat !== 'Alle' ? ' in „' + cat + '"' : ' insgesamt');
    });
  });
  var P_SHOW = 'opacity-100 translate-y-0 scale-100', P_HIDE = 'opacity-0 translate-y-6 scale-95';
  if ('IntersectionObserver' in window && partnerItems.length && !reduced) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { swap(en.target, P_SHOW, P_HIDE); var im = en.target.querySelector('img'); if (im) swap(im, 'opacity-100', 'opacity-0'); pio.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    partnerItems.forEach(function (it) {
      var r = it.getBoundingClientRect();
      if (r.top > window.innerHeight) { swap(it, P_HIDE, P_SHOW); pio.observe(it); }
    });
  }

  /* ---------- Counters (Team-Vertrauen) ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function fmt(n) { return n.toLocaleString('de-DE'); }
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var section = counters[0].closest('section');
    var started = false;
    var r0 = section.getBoundingClientRect();
    if (r0.top > window.innerHeight) {
      counters.forEach(function (c) { c.textContent = '0' + (c.getAttribute('data-suffix') || ''); });
      var cio = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting || started) return;
        started = true; cio.disconnect();
        var t0 = performance.now(), dur = 1800;
        (function step(now) {
          var p = Math.min((now - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
          counters.forEach(function (c) {
            c.textContent = fmt(Math.round(eased * Number(c.getAttribute('data-count')))) + (c.getAttribute('data-suffix') || '');
          });
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, { threshold: 0.15 });
      cio.observe(section);
    }
  }

  /* ---------- Hero particles ---------- */
  var canvas = document.querySelector('[data-particles]');
  if (canvas && !reduced && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, frame = 0, raf = 0, running = false;
    var resize = function () {
      var rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width || window.innerWidth; h = rect.height || window.innerHeight;
      canvas.width = w; canvas.height = h;
    };
    resize(); window.addEventListener('resize', resize);
    var st = getComputedStyle(document.documentElement);
    var prim = st.getPropertyValue('--primary-500').trim(), acc = st.getPropertyValue('--accent-500').trim();
    var color = function (hue, o) {
      if (hue === 'primary') return 'oklch(' + prim + ' / ' + o + ')';
      if (hue === 'accent') return 'oklch(' + acc + ' / ' + o + ')';
      return 'rgba(255,255,255,' + o + ')';
    };
    var hues = ['white', 'white', 'white', 'white', 'primary', 'primary', 'accent'];
    var parts = [];
    for (var i = 0; i < 20; i++) {
      parts.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 2.5 + 0.8,
        speedY: Math.random() * 0.4 + 0.15, speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.35, targetOpacity: Math.random() * 0.35, hue: hues[Math.floor(Math.random() * hues.length)] });
    }
    var animate = function () {
      if (!running) return;
      frame++;
      if (frame % 2 !== 0) { raf = requestAnimationFrame(animate); return; }
      ctx.clearRect(0, 0, w, h);
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        p.y -= p.speedY; p.x += p.speedX + Math.sin(p.y * 0.01) * 0.15;
        p.opacity += (p.targetOpacity - p.opacity) * 0.008;
        if (Math.random() < 0.003) p.targetOpacity = Math.random() * 0.35;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; p.targetOpacity = Math.random() * 0.35; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = color(p.hue, p.opacity); ctx.fill();
        if (p.size > 1.8 && p.hue !== 'white') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2); ctx.fillStyle = color(p.hue, p.opacity * 0.12); ctx.fill();
        }
      }
      raf = requestAnimationFrame(animate);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (!running) { running = true; raf = requestAnimationFrame(animate); } }
        else if (running) { running = false; cancelAnimationFrame(raf); }
      }, { threshold: 0 }).observe(canvas);
    } else { running = true; raf = requestAnimationFrame(animate); }
  } else if (canvas && reduced) {
    canvas.style.display = 'none';
  }
})();
