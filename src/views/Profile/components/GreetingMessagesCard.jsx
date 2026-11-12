import { Icon } from '@/components/ui/Icon'
import { cls } from '@/utils/classNames'

export function GreetingMessagesCard({ form, saveProfile, saving, setForm }) {
  return (
    <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <h3 style={{fontSize:16,fontWeight:700,margin:0}}>Check-in Messages</h3>
          <button className="btn btn-primary" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>{
            const newMsg={id:Date.now().toString(),label:"New Message",base:"Hi po Ms. Tina, magpapacheck lang po",fillType:"caseNum"};
            setForm(f=>({...f,greetingMessages:[...(f.greetingMessages||[]),newMsg]}));
          }}>＋ Add Message</button>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Write your message base text. The radio button automatically appends what type to include when copying.</p>
        {(form.greetingMessages||[]).length===0&&(
          <div style={{fontSize:13,color:"var(--muted)",padding:"12px 0"}}>No messages yet. Click <b>＋ Add Message</b> to create one.</div>
        )}
        {(form.greetingMessages||[]).map((m,mi)=>{
          // Auto-build preview from base + fillType
          const buildPreview=(base,ft)=>{
            const b=base||"Hi po Ms. Tina, magpapacheck lang po";
            if(ft==="none")        return b;
            if(ft==="siteComment") return `${b} Site Comment #12345`;
            if(ft==="caseNum")     return `${b} Case #12345`;
            if(ft==="inbound")     return `${b} Inbound #67890`;
            return b;
          };
          const updateMsg=(patch)=>{
            const arr=[...(form.greetingMessages||[])];arr[mi]={...arr[mi],...patch};
            setForm(f=>({...f,greetingMessages:arr}));
          };
          return (
          <div key={m.id} style={{background:"var(--entry-bg)",border:"1.5px solid var(--border)",padding:"14px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <input className="inp" style={{flex:1,fontWeight:700,fontSize:13}} value={m.label||""} onChange={e=>updateMsg({label:e.target.value})} placeholder="Label (e.g. Site Comment)"/>
              <button className="entry-del" onClick={()=>{
                const arr=(form.greetingMessages||[]).filter((_,i)=>i!==mi);setForm(f=>({...f,greetingMessages:arr}));
              }}><Icon name="trash" size={13} color="var(--red)"/></button>
            </div>
            <div className="field" style={{marginBottom:10}}>
              <label>Message</label>
              <textarea className="inp" rows={3} value={m.base||""} onChange={e=>updateMsg({base:e.target.value})} placeholder="Hi po Ms. Tina, magpapacheck lang po" style={{resize:"vertical",minHeight:68,lineHeight:1.6}}/>
            </div>
            <div className="field" style={{marginBottom:8}}>
              <label style={{marginBottom:6,display:"block"}}>Append number <span style={{fontWeight:400,opacity:.6,textTransform:"none",fontSize:10}}>(optional)</span></label>
              <div className="radio-group">
                {[
                  {v:"none",        l:"None",             cls:""},
                  {v:"siteComment", l:"Site Comment #",   cls:"selected-complete"},
                  {v:"caseNum",     l:"Case #",            cls:"selected-clarif"},
                  {v:"inbound",     l:"Inbound #",         cls:"selected-complete"},
                ].map(({v,l,cls:sc})=>(
                  <label key={v} className={cls("radio-label",m.fillType===v&&sc)}>
                    <input type="radio" name={`fillType-${m.id}`} checked={m.fillType===v} onChange={()=>updateMsg({fillType:v})} style={{display:"none"}}/>
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:8,padding:"7px 10px",background:"var(--card)",border:"1px solid var(--border)"}}>
              <span style={{opacity:.6}}>Preview: </span>
              <span style={{color:"var(--accent)",fontWeight:600}}>{buildPreview(m.base,m.fillType)}</span>
            </div>
          </div>
          );
        })}
        <button className="btn btn-primary" style={{marginTop:4}} onClick={saveProfile} disabled={saving}>{saving?"Saving...":"Save Messages"}</button>
      </div>
  )
}
