import { useState } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';

export default function TocPanel({ openStep, setOpenStep, isSC, page, doneMap={}, specialRequestors=[] }) {
  if(page!=="postlive") return null;
  const steps=[
    {num:1,label:"Case Info"},
    {num:2,label:"Before Name"},
    {num:3,label:"Extra Backups"},
    {num:4,label:isSC?"Amends Notepad":"Assumptions"},
    {num:5,label:"Device Check"},
    {num:6,label:"After Name"},
    {num:7,label:"B/A Backup"},
    {num:8,label:"Checklist"},
  ];
  return (
    <div className="toc-card">
      <div className="toc-card-header">
        <Icon name="dashboard" size={10} color="var(--muted)"/>Steps
      </div>
      {steps.map(s=>{
        const done=!!doneMap[s.num];
        return (
          <button key={s.num} className={cls("toc-item",done&&"done",openStep===s.num&&"active")}
            onClick={()=>{
              setOpenStep(s.num);
              setTimeout(()=>{
                const el=document.getElementById(`step-${s.num}`);
                const container=document.querySelector('.form-left');
                if(el && container){
                  const offset=el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
                  container.scrollTo({top: Math.max(0, offset - 12), behavior:'smooth'});
                } else if(el){
                  el.scrollIntoView({behavior:"smooth",block:"start"});
                }
              },50);
            }}>
            <span className="toc-num">{s.num}</span>
            <span style={{flex:'0 1 auto',textAlign:'center',minWidth:0}}>{s.label}</span>
            {done&&<span className="toc-check">✓</span>}
          </button>
        );
      })}
      {(specialRequestors||[]).length>0&&(
        <div className="toc-requestors">
          <div className="toc-req-title">Requestors</div>
          {(specialRequestors||[]).map((name,i)=>(
            <div key={i} className="toc-req-chip">
              <span className="toc-req-avatar">{(name||"").split(" ").map(w=>w&&w[0]).filter(Boolean).join("").slice(0,2).toUpperCase()}</span>
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

