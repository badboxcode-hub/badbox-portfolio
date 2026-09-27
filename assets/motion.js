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
    document.querySelectorAll('[data-framer-name="Timeline"]').forEach(track=>{
      const current=track.querySelector('[data-framer-name="Current"]');
      const past=track.querySelector('[data-framer-name="Past"]');
      if(!current||!past)return;
      const label=current.querySelector('p');
      const years=[...past.children].reverse();
      if(!label||years.length!==5)return;
      const original=label.textContent;
      const positions=()=>{
        const base=current.getBoundingClientRect();
        const trackRect=track.getBoundingClientRect();
        return years.map(el=>Math.min(el.getBoundingClientRect().left-base.left,trackRect.right-base.right));
      };
      const offsets=positions();
      const tl=gsap.timeline({scrollTrigger:trigger(track),onStart:()=>track.dataset.yearState='running',
        onComplete:()=>{label.textContent=original;track.dataset.yearState='settled';}});
      gsap.set(years,{opacity:0});
      gsap.set(current,{x:offsets[0]});
      label.textContent='2021';
      counters.push(()=>label.textContent=original);
      const progress={value:0};
      tl.from(current,{opacity:0,duration:.25},0);
      tl.to(current,{x:0,duration:2.6,ease:'power1.inOut'},0);
      tl.to(progress,{value:1,duration:2.6,ease:'power1.inOut',onUpdate:()=>{
        label.textContent=String(Math.min(2026,2021+Math.floor(progress.value*5.999)));
        const x=offsets[0]*(1-progress.value);
        years.forEach((year,index)=>{
          const distance=offsets[index]-x;
          gsap.set(year,{opacity:Math.max(0,Math.min(1,distance/38))});
        });
      }},0);
      tl.set(years,{opacity:1});
      tl.set(current,{clearProps:'transform'});

    });
    const steps=[];
    let nextStep=0, playingStep=false;
    const playNext=()=>{
      const step=steps[nextStep];
      if(playingStep || !step || !step.ready)return;
      playingStep=true;
      step.timeline.play();
    };
    document.querySelectorAll('[data-process-card]').forEach(card=>{
      const count=card.querySelector('[data-process-count]');
      if(!count)return;
      const final=count.dataset.processCount;
      if(final==='4'){
        const state={value:0};
        count.textContent='0';
        counters.push(()=>count.textContent=final);
        const tl=gsap.timeline({scrollTrigger:trigger(card)});
        tl.to(state,{value:4,duration:1.4,ease:'power1.inOut',onUpdate:()=>count.textContent=Math.round(state.value)},0);
        tl.from(card.querySelectorAll('h3,p'),{opacity:0,y:16,duration:.85,stagger:.15,ease:'power3.out',clearProps:'transform,opacity'},.1);
        return;
      }
      const number=card.querySelector('[data-framer-name="Number"]');
      const heading=card.querySelector('[data-framer-name="Heading"]');
      const description=card.querySelector('[data-framer-name="Description"]');
      const step={ready:false,timeline:null};
      steps.push(step);
      const tl=gsap.timeline({paused:true,defaults:{duration:.65,ease:'power3.out',clearProps:'transform,opacity'},
        onStart:()=>card.dataset.processState='running',
        onComplete:()=>{card.dataset.processState='settled';playingStep=false;nextStep++;playNext();}});
      tl.from(number,{opacity:0,y:12},0)
        .from(heading,{opacity:0,y:16},.22)
        .from(description,{opacity:0,y:16},.44);
      step.timeline=tl;
      ScrollTrigger.create({trigger:card,start:'top 88%',once:true,onEnter:()=>{step.ready=true;playNext();}});
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
