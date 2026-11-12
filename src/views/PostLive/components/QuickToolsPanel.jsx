import { copyToClipboard } from '@/utils/clipboard'
import { Icon } from '@/components/ui/Icon'

export function QuickToolsPanel({ buildEmailText, buildEntriesText, form, handleDraft, isResumingDraft, isSC, onOpenFileNameGenerator, onStartBreak, onStartOpenHour, setBreakConfirmData, setModal, showToast }) {
  return (
    <div className="form-quick">
        <div className="quick-format-panel">
          <div className="quick-format-header">Quick Format &amp; Lyrics <button type="button" title="Add" style={{marginLeft:'auto',width:22,height:22,borderRadius:20,border:'1px solid var(--border)',background:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button></div>
          <button type="button" className="quick-format-row" onClick={()=>{copyToClipboard(isSC?buildEntriesText():buildEmailText());showToast('SR Format copied ✅');}}>
            <span>SR Format</span><Icon name="copy" size={13} color="var(--muted)"/>
          </button>
          <button type="button" className="quick-format-row" disabled title="Not yet configured for this case type">
            <span>AI Images Lyrics</span><Icon name="copy" size={13} color="var(--muted)"/>
          </button>
          <button type="button" className="quick-format-row" disabled title="Not yet configured for this case type">
            <span>No SC Lyrics</span><Icon name="copy" size={13} color="var(--muted)"/>
          </button>
          <div className="quick-format-header" style={{marginTop:10}}>Quick Tools</div>
          <button type="button" className="quick-format-row" style={{marginBottom:0}} onClick={()=>onOpenFileNameGenerator?onOpenFileNameGenerator():showToast('Open File Name Generator from the sidebar 📁')}>
            <span>File Name Generator</span><Icon name="download" size={13} color="var(--muted)"/>
          </button>
        </div>

        {onStartBreak && [{label:"15 MIN",mins:15,icon:"coffee"},{label:"30 MIN",mins:30,icon:"meditate"},{label:"1 HOUR",mins:60,icon:"lunch"}].map(({label,mins,icon})=>(
          <button key={mins} className="btn btn-ghost btn-noicon" style={{justifyContent:'center',gap:8}}
            onClick={() => {
              if(!form.caseNum){showToast("Enter a case number first","error");return;}
              setBreakConfirmData({label:label.toLowerCase(),mins});
              setModal("breakConfirm");
            }}>
            <Icon name={icon} size={14} color="var(--accent)"/>{label}
          </button>
        ))}
        {onStartOpenHour && (
          <button className="btn btn-ghost btn-noicon" style={{justifyContent:'center',gap:8}}
            onClick={() => {
              if(!form.caseNum){showToast("Enter a case number first","error");return;}
              setBreakConfirmData({label:"Open Hour",mins:0,isOpenHour:true});
              setModal("breakConfirm");
            }}>
            <Icon name="calendar" size={14} color="var(--accent)"/>Meeting
          </button>
        )}
        {!isResumingDraft&&<button className="btn btn-alert" style={{justifyContent:'center'}} onClick={handleDraft}>Suspend Case</button>}
      </div>
  )
}
