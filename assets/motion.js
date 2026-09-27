(() => {
  'use strict';
  const {gsap, ScrollTrigger} = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.dataset.animationEngine = 'gsap';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mm = gsap.matchMedia();
  const refresh = () => ScrollTrigger.refresh();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const counters = [];
    const trigger = el => ({trigger:el,start:'top 90%',once:true});
    document.querySelectorAll('[data-entrance]').forEach(el => {
      if (innerWidth < 610) return;
      try {
        const spec=JSON.parse(el.dataset.entrance), start=spec.initial;
        gsap.from(el,{opacity:start.opacity??0,y:start.y||0,x:start.x||0,
          rotation:start.rotate||0,rotationX:start.rotateX||0,rotationY:start.rotateY||0,
          scale:start.scale||1,duration:1.4,ease:'power3.out',clearProps:'transform,opacity'});
      } catch { /* Static content is the fallback. */ }
    });
    document.querySelectorAll('[data-motion]').forEach(el => {
      const letters=el.dataset.motion==='text' ? [...el.querySelectorAll('span')].filter(s=>!s.children.length&&s.style.display==='inline-block') : [];
      gsap.from(letters.length?letters:el,{opacity:0,y:letters.length?14:24,duration:.8,
        stagger:letters.length?{amount:.35}:0,ease:'power3.out',scrollTrigger:trigger(el),
        onStart:()=>el.dataset.motionState='running',
        onComplete:()=>el.dataset.motionState='settled',clearProps:'transform,opacity'});
    });
    document.querySelectorAll('[data-satisfaction], [data-skill-meter]').forEach(card => {
      const skill=card.hasAttribute('data-skill-meter');
      const number=card.querySelector(skill?'[data-meter-number]':'[data-count-to]');
      const target=Number(skill?card.dataset.skillMeter:number.dataset.countTo);
      const suffix=skill?'%':'';
      const state={value:0};
      number.textContent='0'+suffix;
      counters.push(()=>number.textContent=target+suffix);
      const tl=gsap.timeline({scrollTrigger:trigger(card),defaults:{ease:'power3.out'},
        onStart:()=>card.dataset.counterState='running',
        onComplete:()=>card.dataset.counterState='settled'});
      tl.to(state,{value:target,duration:1.1,onUpdate:()=>number.textContent=Math.round(state.value)+suffix},0);
      if(skill) tl.from(card.querySelector('[data-meter-fill]'),{scaleX:0,transformOrigin:'left center',duration:1.1},0);
      else tl.from(card.querySelectorAll('.satisfaction-dots i'),{opacity:0,scale:.4,duration:.45,stagger:{amount:.65},clearProps:'transform,opacity'},0);
    });
    document.querySelectorAll('[data-process-card]').forEach(card=>{
      const count=card.querySelector('[data-process-count]');
      if(!count)return;
      const final=count.dataset.processCount, state={value:0};
      const format=value=>String(Math.round(value)).padStart(final.length,'0');
      count.textContent=format(0);
      counters.push(()=>count.textContent=final);
      const tl=gsap.timeline({scrollTrigger:trigger(card)});
      tl.to(state,{value:Number(final),duration:1.2,ease:'power2.out',onUpdate:()=>count.textContent=format(state.value)},0);
      const text=[...card.querySelectorAll('p,h3')].filter(el=>el!==count);
      tl.from(text,{opacity:0,y:16,duration:.85,stagger:.12,ease:'power3.out',clearProps:'transform,opacity'},0);
    });
    document.querySelectorAll('[data-portrait-scroll]').forEach(frame=>{
      gsap.fromTo(frame,{y:10,rotation:-.8},{y:-10,rotation:.8,ease:'none',
        scrollTrigger:{trigger:frame.parentElement,start:'top bottom',end:'bottom top',scrub:.7}});
    });
    return () => counters.forEach(settle=>settle());
  });
  document.querySelectorAll('.skill-disclosure').forEach(details => {
    let tween=null, desired=details.open;
    const settle=()=>{
      details.open=desired;
      gsap.set(details,{clearProps:'height,overflow'});
      tween=null;
      refresh();
    };
    details.querySelector('summary').addEventListener('click',event=>{
      if(reduced.matches){requestAnimationFrame(refresh);return;}
      event.preventDefault();
      desired=!details.open || (tween && !desired);
      const from=details.getBoundingClientRect().height;
      if(tween)tween.kill();
      gsap.set(details,{clearProps:'height'});
      details.open=desired;
      const to=details.getBoundingClientRect().height;
      details.open=true;
      gsap.set(details,{height:from,overflow:'hidden'});
      tween=gsap.to(details,{height:to,duration:.4,ease:'power2.inOut',onComplete:settle});
    });
    reduced.addEventListener('change',()=>{if(reduced.matches&&tween){tween.kill();settle();}});
    window.addEventListener('resize',()=>{if(tween){tween.kill();settle();}});
  });
  document.fonts?.ready.then(refresh);
  window.addEventListener('load',refresh,{once:true});
})();
