import { FngPageDropzone } from './FngPageDropzone'
import { EMPTY, san } from '../fngConfig'
import { Icon } from '@/components/ui/Icon'
import { storage } from '@/services/storage'
import { useFng } from '../useFng'

export function FngCaseInfoPanel() {
  const {
    addItem, form, format, listCfg, removeItem, setDraftFmt, setEditingFormat, setForm, setItem,
    setTab, setUploadFor, showToast, tab, tabs, uploads,
  } = useFng()

  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'20px 20px 20px',borderRadius:12,boxShadow:'var(--shadow-sm)',width:418,flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Case Information</div>
        <div style={{height:3,background:'var(--border)',margin:'12px 0 18px',borderRadius:2}}/>

        <div className="field">
          <label style={{display:"flex",alignItems:"center",gap:6}}>
            Business Name (Auto-fill)* {form.bizFilename&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(76,138,86,.12)",border:"1px solid rgba(76,138,86,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}
          </label>
          <input className="inp" placeholder="e.g. Fire Force" value={form.bizFilename} onChange={e=>setForm(f=>({...f,bizFilename:e.target.value,bizAlt:[e.target.value,f.entityDesignation].filter(Boolean).join(' ')}))}/>
        </div>
        <div className="field">
          <label style={{display:"flex",alignItems:"center",gap:6}}>Entity Designations (Auto-fill)* {form.entityDesignation&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(76,138,86,.12)",border:"1px solid rgba(76,138,86,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}</label>
          <input className="inp" placeholder="e.g. Inc, LLC" value={form.entityDesignation} onChange={e=>setForm(f=>({...f,entityDesignation:e.target.value,bizAlt:[f.bizFilename,e.target.value].filter(Boolean).join(' ')}))}/>
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label style={{display:"flex",alignItems:"center",gap:6}}>Account Number (Auto-fill)* {form.accountNum&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(76,138,86,.12)",border:"1px solid rgba(76,138,86,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}</label>
          <input className="inp" placeholder="e.g. ACC-9876" value={form.accountNum} onChange={e=>setForm(f=>({...f,accountNum:e.target.value}))}/>
        </div>

        <div style={{height:2,background:'var(--border)',margin:'18px 0 14px'}}/>

        <label style={{display:'block',fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:8}}>Name Type</label>
        <select className="inp" value={tab} onChange={e=>setTab(e.target.value)} style={{marginBottom:18}}>
          {tabs.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        {listCfg ? (
          <div>
            {form[listCfg.field].map((val,pi)=>{
              const pageUploadId=`pageref-${tab}-${pi}`;
              const pageImg=uploads[pageUploadId];
              return (
              <div key={pi} style={{border:'1px solid var(--border)',borderRadius:10,padding:22,marginBottom:14,position:'relative',background:'var(--entry-bg)'}}>
                <button type="button" onClick={()=>removeItem(listCfg.field,pi)} title="Remove" style={{position:'absolute',top:16,right:16,width:12,height:12,border:'none',background:'none',cursor:'pointer',color:'var(--muted)',fontSize:14,lineHeight:1,padding:0}}>✕</button>
                <div className="field" style={{marginBottom:16}}>
                  <label>{listCfg.label}</label>
                  <input className="inp" placeholder={listCfg.placeholder} value={val} onChange={e=>setItem(listCfg.field,pi,e.target.value)}/>
                </div>
                <label style={{fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:8,display:'block'}}>Upload Image{listCfg.field!=='pages'?'':'s'}</label>
                <FngPageDropzone imgUrl={pageImg?.url} onFile={file=>{
                  if(!file)return;
                  const reader=new FileReader();
                  reader.onload=()=>setUploadFor(pageUploadId,{url:reader.result,name:`${san(val||listCfg.placeholder)}-reference`,_file:file,id:pageUploadId});
                  reader.readAsDataURL(file);
                }}/>
              </div>
              );
            })}
            <button onClick={()=>addItem(listCfg.field)} style={{background:'none',border:'2px dashed var(--border)',borderRadius:20,color:'var(--muted)',padding:'10px 14px',fontSize:12,fontWeight:700,cursor:'pointer',width:'100%',fontFamily:"'Poppins',sans-serif",marginBottom:18,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>Add More {listCfg.field==='pages'?'Page':listCfg.placeholder} <Icon name="add" size={14} color="var(--muted)"/></button>
          </div>
        ) : tab==='gallery' ? (
          <div style={{marginBottom:18}}>
            <label style={{fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:8,display:'block'}}>Upload Images</label>
            <FngPageDropzone imgUrl={uploads['pageref-gallery-0']?.url} onFile={file=>{
              if(!file)return;
              const reader=new FileReader();
              reader.onload=()=>setUploadFor('pageref-gallery-0',{url:reader.result,name:'gallery-reference',_file:file,id:'pageref-gallery-0'});
              reader.readAsDataURL(file);
            }}/>
          </div>
        ) : null}

        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-danger" style={{flex:1,justifyContent:'center'}} onClick={()=>{setForm(EMPTY);storage.remove("ch_fng_form");showToast('Cleared','info');}}>Remove Fill</button>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={()=>{setDraftFmt({...format});setEditingFormat(true);}}>Edit File Name Format</button>
        </div>
      </div>
  )
}
