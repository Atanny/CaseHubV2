import { useEffect, useRef } from 'react'
import { cls } from '@/utils/classNames'

// ── Wizard section — a single numbered card within the active wizard page.
// Unlike the old accordion StepCard, it has no click-to-toggle header: it is
// simply visible whenever the wizard page that contains it is the active one
// (isOpen is passed in by the parent, derived from activePage), and it never
// unmounts its children while open so in-progress input/uploads survive
// Back/Next navigation between pages.
export function StepCard({ num, title, subtitle, children, done, isOpen }) {
  const cardRef = useRef();
  useEffect(()=>{
    if(isOpen){
      setTimeout(()=>{
        const el=cardRef.current;
        const container=document.querySelector('.form-left');
        if(el && container){
          const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
          container.scrollTo({top: Math.max(0, offset-12), behavior:'smooth'});
        }
      },40);
    }
  },[isOpen]);
  if(!isOpen) return null;
  return (
    <div id={`step-${num}`} ref={cardRef} className={cls("wizard-section", done&&"done")}>
      <div className="wizard-section-header">
        <div className="wizard-section-num">{done ? <span style={{fontSize:14}}>✓</span> : <span>{num}</span>}</div>
        <div style={{flex:1,minWidth:0}}>
          <div className="wizard-section-title">{title}</div>
          {subtitle&&<div className="wizard-section-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="wizard-section-body">{children}</div>
    </div>
  );
}
