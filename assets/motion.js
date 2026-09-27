(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  const ease = 'cubic-bezier(.22,1,.36,1)';
  function animate(el, frames, options) {
    if (reduced.matches || !el.animate) return null;
    const animation = el.animate(frames, {fill: 'backwards', ...options});
    active.add(animation);
    el.dataset.motionState = 'running';
    const cleanup = () => { active.delete(animation); el.dataset.motionState = 'settled'; };
    animation.finished.then(cleanup, cleanup);
    return animation;
  }
  reduced.addEventListener('change', () => {
    if (reduced.matches) for (const animation of active) animation.cancel();
  });
  // Recover the card entrance and strap swing recorded in the original Framer save.
  document.querySelectorAll('[data-entrance]').forEach(el => {
    if (innerWidth < 610 || reduced.matches) return;
    try {
      const spec = JSON.parse(el.dataset.entrance), start = spec.initial;
      const end = spec.animate, timing = end.transition || {};
      const base = getComputedStyle(el).transform;
      const prefix = spec.transformTemplate ? 'translateX(-50%) ' : (base === 'none' ? '' : base + ' ');
      const transform = `${prefix}perspective(1200px) translate3d(${start.x || 0}px,${start.y || 0}px,0) rotate(${start.rotate || 0}deg) rotateX(${start.rotateX || 0}deg) rotateY(${start.rotateY || 0}deg) scale(${start.scale || 1})`;
      animate(el, [{opacity: start.opacity, transform}, {opacity: 1, transform: base}], {
        duration: (timing.duration || 1.5) * 1000,
        delay: (timing.delay || 0) * 1000,
        easing: Array.isArray(timing.ease) ? `cubic-bezier(${timing.ease.join(',')})` : ease
      });
    } catch { /* The final visible layout remains usable if an entrance is invalid. */ }
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        if (reduced.matches) return;
        if (el.dataset.motion === 'text') {
          const letters = [...el.querySelectorAll('span')].filter(s => !s.children.length && s.style.display === 'inline-block');
          const step = Math.min(22, 420 / Math.max(letters.length, 1));
          letters.forEach((letter, i) => animate(letter, [
            {opacity: 0, transform: 'translateY(16px)'},
            {opacity: 1, transform: 'translateY(0)'}
          ], {duration: 700, delay: i * step, easing: ease}));
        } else {
          const base = getComputedStyle(el).transform;
          animate(el, [{opacity: 0, transform: `${base === 'none' ? '' : base} translateY(24px)`},
            {opacity: 1, transform: base}], {duration: 850, easing: ease});
        }
      });
    }, {threshold: 0, rootMargin: '0px 0px -24px 0px'});
    document.querySelectorAll('[data-motion]').forEach(el => observer.observe(el));
  }
  document.querySelectorAll('[data-satisfaction]').forEach(card => {
    const number = card.querySelector('[data-count-to]');
    const dots = [...card.querySelectorAll('.satisfaction-dots i')];
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    number.textContent = '0';
    dots.forEach(dot => dot.style.opacity = '0');
    let frame = 0;
    const settle = () => {
      cancelAnimationFrame(frame);
      number.textContent = '95';
      dots.forEach(dot => dot.style.opacity = '');
      card.dataset.counterState = 'settled';
    };
    reduced.addEventListener('change', () => { if (reduced.matches) settle(); });
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (reduced.matches) { settle(); return; }
      card.dataset.counterState = 'running';
      dots.forEach((dot, i) => {
        dot.style.opacity = '';
        animate(dot, [{opacity:0,transform:'scale(.5)'},{opacity:i<95?1:.3,transform:'scale(1)'}],
          {duration:420,delay:i*7,easing:ease});
      });
      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now-start)/1000,1);
        number.textContent = String(Math.round(95*(1-Math.pow(1-progress,3))));
        if (progress<1) frame=requestAnimationFrame(tick);
        else { number.textContent='95'; card.dataset.counterState='settled'; }
      };
      frame=requestAnimationFrame(tick);
    }, {threshold:.25});
    observer.observe(card);
  });
  document.querySelectorAll('[data-skill-meter]').forEach(row => {
    const number=row.querySelector('[data-meter-number]');
    const bar=row.querySelector('[data-meter-fill]');
    const target=Number(row.dataset.skillMeter);
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    let frame=0;
    number.textContent='0%';
    bar.style.transform='scaleX(0)';
    const settle=()=>{
      cancelAnimationFrame(frame);
      number.textContent=target+'%';
      bar.style.transform='scaleX(1)';
      row.dataset.counterState='settled';
    };
    reduced.addEventListener('change',()=>{if(reduced.matches)settle();});
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();
      if(reduced.matches){settle();return;}
      row.dataset.counterState='running';
      const start=performance.now();
      const tick=now=>{
        const progress=Math.min((now-start)/1100,1);
        const eased=1-Math.pow(1-progress,3);
        number.textContent=Math.round(target*eased)+'%';
        bar.style.transform='scaleX('+eased+')';
        if(progress<1)frame=requestAnimationFrame(tick);else settle();
      };
      frame=requestAnimationFrame(tick);
    },{threshold:.3});
    observer.observe(row);
  });
  // Native details remains the no-JavaScript/reduced-motion fallback.
  document.querySelectorAll('.skill-disclosure').forEach(details => {
    const summary = details.querySelector('summary');
    let running = null, desired = details.open;
    summary.addEventListener('click', event => {
      if (reduced.matches || !details.animate) return;
      event.preventDefault();
      desired = !desired;
      const from = details.getBoundingClientRect().height;
      if (running) running.cancel();
      details.style.height = '';
      details.open = desired;
      const to = details.getBoundingClientRect().height;
      details.open = true;
      details.style.overflow = 'hidden';
      running = animate(details, [{height: `${from}px`}, {height: `${to}px`}], {
        duration: 360, easing: ease, fill: 'both'
      });
      const own = running;
      const settle = () => {
        if (running !== own) return;
        details.open = desired;
        details.style.overflow = '';
        details.style.height = '';
        running = null;
        own.cancel();
      };
      own.finished.then(settle, settle);
    });
  });
})();
