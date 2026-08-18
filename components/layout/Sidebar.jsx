import { useRouter } from 'next/router';
import Icon from '../icons/Icon';
import { cls } from '../../lib/helpers';
import { useApp } from '../../context/AppContext';

export default function Sidebar() {
  const router = useRouter();
  const {
    coreNav, page, handleNav, formActive, allCases, announcements, archivedDrafts,
    links, setLinks, sidebarDragRef, breakTimer, setCancelBreakConfirm, setBreakPending,
    timedIn, formInFields, setOpenHourPending, lightMode, setLightMode, dbStatus,
    logout, sidebarElRef,
  } = useApp();

  return (

        <aside ref={sidebarElRef} className="chd-sidebar">
          <div className="chd-sb-logo">CH</div>

          {(() => {
            const groups=[]; let current=null;
            coreNav.forEach(item=>{
              if(item.group){ current={label:item.group, items:[]}; groups.push(current); }
              else current.items.push(item);
            });
            return groups.map((g,gi)=>(
              <div className="chd-sb-group" key={gi}>
                {g.items.map(n=>{
                  const isRestricted = ["build","prelive"].includes(n.id);
                  const isDisabled = isRestricted && formActive && page !== n.id;
                  return (
                    <button key={n.id} className={cls("chd-sb-item", page===n.id && "active")}
                      onClick={()=> !isDisabled && handleNav(n.id)} disabled={isDisabled}
                      style={{opacity:isDisabled?0.4:1,cursor:isDisabled?"not-allowed":"pointer"}}>
                      <Icon name={n.icon} size={22} color={page===n.id?"var(--text)":"var(--muted)"}/>
                      {n.id==="history"&&allCases.length>0&&<span className="chd-sb-badge">{allCases.length}</span>}
                      {n.id==="announcements"&&announcements.length>0&&<span className="chd-sb-badge">{announcements.length}</span>}
                      {n.id==="archives"&&archivedDrafts.length>0&&<span className="chd-sb-badge">{archivedDrafts.length}</span>}
                      {n.id==="postlive"&&formActive&&page!=="postlive"&&<span className="chd-sb-dot"/>}
                      <span className="chd-sb-tip">{n.label}</span>
                    </button>
                  );
                })}
              </div>
            ));
          })()}

          {links.length>0&&(
            <div className="chd-sb-group">
              <p className="chd-sb-grouplabel">Links</p>
              {links.map((l,i)=>{
                const ref=sidebarDragRef;
                return(
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="chd-sb-item"
                    draggable
                    onDragStart={()=>{ref.current=i;}}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={()=>{
                      const from=ref.current;
                      if(from==null||from===i)return;
                      const arr=[...links];const[m]=arr.splice(from,1);arr.splice(i,0,m);
                      setLinks(arr);ref.current=null;
                    }}
                    onDragEnd={()=>{ref.current=null;}}
                    style={{cursor:"grab"}}>
                    <span style={{fontSize:18}}>{l.icon}</span>
                    <span className="chd-sb-tip">{l.title}</span>
                  </a>
                );
              })}
            </div>
          )}

          <div className="chd-sb-bottom">
            {[{label:"15 min",icon:"coffee",mins:15},{label:"30 min",icon:"meditate",mins:30},{label:"Lunch (1hr)",icon:"lunch",mins:60}].map(({label,icon,mins})=>{
              const isActiveBreak = breakTimer&&breakTimer.mins===mins;
              const isOtherBreak = breakTimer&&breakTimer.mins!==mins;
              const disabledByForm = formInFields && !isActiveBreak;
              const disabled = isOtherBreak || disabledByForm;
              return (
                <button key={mins} className={cls("chd-sb-item",isActiveBreak&&"active")} disabled={disabled}
                  style={{opacity:disabled?.35:1,cursor:disabled?"not-allowed":"pointer"}}
                  onClick={()=>isActiveBreak?setCancelBreakConfirm(true):setBreakPending({label,mins})}>
                  <Icon name={icon} size={20} color={isActiveBreak?"var(--text)":"var(--muted)"}/>
                  <span className="chd-sb-tip">{label}{isActiveBreak?" (active)":""}</span>
                </button>
              );
            })}
            {timedIn&&!breakTimer&&(
              <button className="chd-sb-item" style={{opacity:formInFields?.35:1,cursor:formInFields?"not-allowed":"pointer"}} disabled={!!formInFields} onClick={()=>!formInFields&&setOpenHourPending(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="chd-sb-tip">Open Hour/Meeting</span>
              </button>
            )}
            <button className="chd-sb-item" onClick={()=>setLightMode(l=>!l)}>
              <span style={{fontSize:18}}>{lightMode?"🌙":"☀️"}</span>
              <span className="chd-sb-tip">{lightMode?"Dark Mode":"Light Mode"}</span>
            </button>
            <button className="chd-sb-item" onClick={dbStatus.recheck} title={dbStatus.latency?`${dbStatus.latency}ms`:undefined}>
              <div className={cls("db-dot", dbStatus.status)} style={{position:"static"}}/>
              <span className="chd-sb-tip">
                {dbStatus.status==="connected"&&`DB Connected${dbStatus.latency?` · ${dbStatus.latency}ms`:""}`}
                {dbStatus.status==="connecting"&&"Connecting…"}
                {dbStatus.status==="error"&&"DB Offline — tap to retry"}
              </span>
            </button>
            <button className="chd-sb-logout" onClick={()=>logout()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span className="chd-sb-tip">Log Out</span>
            </button>
          </div>
        </aside>
  );
}
