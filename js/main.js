/* LEVEL | SET · main.js
   Vanilla JS. No dependencies. Handles: header state, mobile nav, hero slider,
   scroll reveals, word-split headlines, subtle parallax, contact form. */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Header ---------------- */
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero, .page-hero');
  function updateHeader() {
    if (!header) return;
    const threshold = hero ? Math.max(80, hero.offsetHeight - 90) : 40;
    header.classList.toggle('is-solid', window.scrollY > threshold);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);

  /* ---------------- Mobile nav ---------------- */
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (burger && mobileNav) {
    const toggle = (open) => {
      const isOpen = open ?? !mobileNav.classList.contains('is-open');
      mobileNav.classList.toggle('is-open', isOpen);
      burger.classList.toggle('is-open', isOpen);
      header.classList.toggle('menu-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle());
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------------- Hero slider ---------------- */
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    const slides = [...heroEl.querySelectorAll('.slide')];
    const texts = [...heroEl.querySelectorAll('.hero__text-item')];
    const dots = [...heroEl.querySelectorAll('.dot')];
    const counter = heroEl.querySelector('.hero__meta .num');
    const DUR = 5500;
    heroEl.style.setProperty('--slide-dur', DUR + 'ms');
    let i = 0, timer = null, paused = false, userPaused = false;
    const pauseBtn = heroEl.querySelector('.hero__pause');

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      texts.forEach((t, k) => t.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => {
        d.classList.remove('is-active');
        // restart the fill animation
        void d.offsetWidth;
        if (k === i) d.classList.add('is-active');
        d.setAttribute('aria-selected', String(k === i));
      });
      if (counter) counter.textContent = String(i + 1).padStart(2, '0');
    }
    function next() { show(i + 1); }
    function start() {
      stop();
      if (reduceMotion || slides.length < 2) return;
      if (userPaused) return;
      timer = setInterval(() => { if (!paused && !document.hidden) next(); }, DUR);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    dots.forEach((d, k) => d.addEventListener('click', () => { show(k); start(); }));
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        userPaused = !userPaused;
        pauseBtn.setAttribute('aria-pressed', String(userPaused));
        pauseBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
        heroEl.classList.toggle('is-paused', userPaused);
        if (userPaused) stop(); else { show(i); start(); }
      });
    }
    heroEl.addEventListener('mouseenter', () => { paused = true; });
    heroEl.addEventListener('mouseleave', () => { paused = false; });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !userPaused) start(); });

    // touch swipe
    let x0 = null;
    heroEl.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    heroEl.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { show(dx < 0 ? i + 1 : i - 1); start(); }
      x0 = null;
    });

    show(0);
    start();
  }

  /* ---------------- Word-split headlines ---------------- */
  document.querySelectorAll('.reveal-lines').forEach(el => {
    if (reduceMotion) return;
    // Wrap each word (preserving inline markup like <span class="serif">)
    const walk = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'word';
            const inner = document.createElement('span'); inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    // stagger
    el.querySelectorAll('.word > span').forEach((s, k) => { s.style.transitionDelay = (k * 40) + 'ms'; });
  });

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger, .reveal-lines, .formula');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------------- Level-tool eyebrow marks ---------------- */
  // Replays each time an eyebrow enters the viewport; resets once it has fully left.
  if (document.body.classList.contains('levels')) {
    const eyebrows = document.querySelectorAll('.eyebrow, .level-mark');
    if ('IntersectionObserver' in window && !reduceMotion) {
      const lio = new IntersectionObserver((entries) => {
        entries.forEach(en => en.target.classList.toggle('is-leveled', en.isIntersecting));
      }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
      eyebrows.forEach(el => lio.observe(el));
    } else {
      eyebrows.forEach(el => el.classList.add('is-leveled'));
    }
  }

  /* ---------------- FAQ decode ---------------- */
  // Each question resolves from scrambled glyphs, staggered, the first time the
  // list scrolls into view. Screen readers get the real text via .sr-only.
  const faq = document.querySelector('.faq');
  if (faq) {
    const GLYPHS = '01<>/_#*+=:;[]{}';
    const items = [...faq.querySelectorAll('summary')].map(sm => {
      const node = [...sm.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      if (!node) return null;
      const text = node.textContent.trim();
      const real = document.createElement('span'); real.className = 'sr-only'; real.textContent = text;
      const vis = document.createElement('span'); vis.className = 'faq__q'; vis.setAttribute('aria-hidden', 'true'); vis.textContent = text;
      node.replaceWith(real, vis);
      return { vis, text };
    }).filter(Boolean);
    const decode = ({ vis, text }, delay) => {
      const D = 650, t0 = performance.now() + delay;
      vis.classList.add('is-decoding');
      const tick = (t) => {
        const k = Math.max(0, Math.min(1, (t - t0) / D));
        const n = Math.floor(text.length * k);
        vis.textContent = text.slice(0, n) + [...text.slice(n)].map(c => c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
        if (k < 1) requestAnimationFrame(tick); else { vis.textContent = text; vis.classList.remove('is-decoding'); }
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window && !reduceMotion) {
      const fio = new IntersectionObserver((entries) => {
        if (!entries.some(en => en.isIntersecting)) return;
        items.forEach((it, k) => decode(it, k * 90));
        fio.disconnect();
      }, { threshold: 0.2 });
      fio.observe(faq);
    }

    // Opened answers type out one line at a time: words are grouped by the
    // line they render on, each line sweeps in left to right, then the next.
    const LINE = 420;
    faq.querySelectorAll('details').forEach(d => {
      const p = d.querySelector('p');
      if (!p || reduceMotion) return;
      const wrap = (node) => {
        [...node.childNodes].forEach(child => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(part => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              const w = document.createElement('span'); w.className = 'faq__w'; w.textContent = part; frag.appendChild(w);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === 1 && !child.classList.contains('faq__w')) {
            child.classList.add('faq__w');
          }
        });
      };
      wrap(p);
      const words = [...p.querySelectorAll('.faq__w')];
      d.addEventListener('toggle', () => {
        if (!d.open) { p.classList.remove('is-typing'); return; }
        p.classList.remove('is-typing');
        words.forEach(w => { w.style.transitionDelay = ''; });
        const rows = [];
        words.forEach(w => {
          const top = w.offsetTop;
          let row = rows.find(r => Math.abs(r.top - top) < 4);
          if (!row) rows.push(row = { top, words: [] });
          row.words.push(w);
        });
        rows.sort((a, b) => a.top - b.top);
        const pw = p.clientWidth || 1;
        rows.forEach((r, i) => r.words.forEach(w => {
          w.style.transitionDelay = Math.round(i * LINE + (w.offsetLeft / pw) * LINE) + 'ms';
        }));
        void p.offsetWidth;
        p.classList.add('is-typing');
      });
    });
  }

  /* ---------------- Subtle parallax on section backgrounds ---------------- */
  const px = [...document.querySelectorAll('.bg-parallax')];
  if (px.length && !reduceMotion && window.innerWidth > 900) {
    let ticking = false;
    const run = () => {
      const vh = window.innerHeight;
      px.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        el.style.transform = 'translate3d(0,' + (p * -40).toFixed(1) + 'px,0) scale(1.12)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(run); ticking = true; } }, { passive: true });
    run();
  }

  /* ---------------- Count-up stats ---------------- */
  const nums = document.querySelectorAll('[data-count]');
  if (nums.length && 'IntersectionObserver' in window && !reduceMotion) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target, target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '';
        const t0 = performance.now(), D = 1400;
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(target * e) + suffix;
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io2.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach(n => io2.observe(n));
  }

  /* ---------------- Contact form ---------------- */
  const form = document.querySelector('form[data-form]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      // Formspree accepts the POST natively. We enhance with fetch (JSON accept
      // header) so the page does not reload; if fetch fails we fall back to a
      // native submit, which lands on Formspree's own confirmation page.
      if (!window.fetch) return;
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = 'Sending…';
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error('bad status');
        form.hidden = true;
        const ok = document.querySelector('.form-success');
        if (ok) { ok.classList.add('is-shown'); ok.tabIndex = -1; ok.focus(); }
      } catch (err) {
        btn.disabled = false; btn.innerHTML = orig;
        form.submit();
      }
    });
  }

  /* ---------------- Footer year ---------------- */
  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
