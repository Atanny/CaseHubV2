import { useState, useRef } from 'react';
import { cls } from '../../lib/helpers';
import Icon from '../icons/Icon';

export default function StepCard({ num, title, children, done, locked, openStep, setOpenStep }) {
  const isOpen = openStep === num;
  const cardRef = useRef();
  const handleToggle = () => {
    if(locked) return;
    const opening = !isOpen;
    setOpenStep(opening ? num : null);
    if(opening){
      setTimeout(()=>{
        const el=cardRef.current||document.getElementById(`step-${num}`);
        const container=document.querySelector('.form-left');
        if(el && container){
          const elTop = el.getBoundingClientRect().top;
          const containerTop = container.getBoundingClientRect().top;
          const containerH = container.clientHeight;
          const elH = el.offsetHeight;
          // Center the card in the visible area
          const scrollOffset = container.scrollTop + (elTop - containerTop) - (containerH/2) + (elH/2);
          container.scrollTo({top: Math.max(0, scrollOffset), behavior:'smooth'});
        } else if(el){
          el.scrollIntoView({behavior:"smooth",block:"center"});
        }
      },40);
    }
  };
  return (
    <div id={`step-${num}`} ref={cardRef} className={cls("step-card", locked?"locked":"unlocked", done&&"done", isOpen&&!locked&&"open")}>
      <div className="step-header" onClick={handleToggle}>
        <div className="step-num" style={{position:"relative"}}>
          {done ? <span style={{fontSize:14}}>✓</span> : <span>{num}</span>}
          {!done&&!locked&&isOpen&&<span style={{position:"absolute",inset:-4,borderRadius:"50%",border:"2px solid var(--accent)",opacity:.4,animation:"pulse-ring 1.5s ease-in-out infinite"}}/>}
        </div>
        <div style={{flex:1}}>
          <div className="step-title">{title}</div>
          {done&&<div style={{fontSize:10,color:"var(--green)",fontWeight:600,marginTop:2,fontFamily:"'Poppins',sans-serif"}}>Complete ✓</div>}
          {locked&&<div style={{fontSize:10,color:"var(--muted)",marginTop:2,fontFamily:"'Poppins',sans-serif"}}>Complete previous step first</div>}
        </div>
        {locked
          ? <span className="step-lock-icon" style={{fontSize:14,opacity:.4}}>🔒</span>
          : <span className="step-chevron" style={{fontSize:11,background:"var(--card2)",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>▼</span>
        }
      </div>
      {isOpen&&!locked&&<div className="step-body" onClick={e=>e.stopPropagation()}>{children}</div>}
    </div>
  );
}

