import { useEffect, useRef, useState } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { FngContext } from './FngContext'
import { storage } from '@/services/storage'
import { DEFAULT_FORMAT, EMPTY, nn, san } from './fngConfig'
import { useSlotUploads } from './hooks/useSlotUploads'
import { FngResultsPanel } from './components/FngResultsPanel'
import { FngCaseInfoPanel } from './components/FngCaseInfoPanel'
import { PageHeader } from '@/components/layout/PageHeader'

export function FileNameGeneratorPage({ onFill=null, activeTabData=null }) {



  const [form,setForm]             = useState(()=>{
    if(typeof window==="undefined") return EMPTY;
    try{
      // Always start from the persisted FNG form (user's own saved values)
      const saved    =localStorage.getItem("ch_fng_form");
      const base     =saved?{...EMPTY,...JSON.parse(saved)}:EMPTY;
      // Check the active/last-saved case
      const active   =localStorage.getItem("ch_minimised_form");
      const lastSaved=localStorage.getItem("ch_last_saved_case");
      const src=active||lastSaved;
      if(src){
        const fd=JSON.parse(src);
        const biz=fd.businessName||"";
        const acc=fd.accountNum||"";
        const bizFull=(fd.businessName||"")+(fd.businessSuffix?' '+fd.businessSuffix:'');
        // Check if active case differs from what was last autofilled
        const lastRaw=localStorage.getItem("ch_fng_last_source");
        const last=lastRaw?JSON.parse(lastRaw):null;
        const sourceChanged=!last||last.businessName!==biz||last.accountNum!==acc;
        if(sourceChanged){
          // Active case changed — update fields that the user hasn't manually changed
          const prevFilled=last||{bizFilename:"",bizAlt:"",accountNum:"",entityDesignation:""};
          return {
            ...base,
            bizFilename: base.bizFilename!==prevFilled.bizFilename ? base.bizFilename : biz,
            bizAlt:      base.bizAlt!==prevFilled.bizAlt           ? base.bizAlt      : (bizFull||biz),
            accountNum:  base.accountNum!==prevFilled.accountNum   ? base.accountNum  : acc,
            entityDesignation: base.entityDesignation!==prevFilled.entityDesignation ? base.entityDesignation : (fd.businessSuffix||""),
          };
        }
      }
      return base;
    }catch{ return EMPTY; }
  });
  // ── When opened from the form header, apply the current tab's data immediately.
  //    activeTabData = { businessName, businessSuffix, accountNum, caseNum } from the active tab.
  //    This overwrites only the auto-fillable fields, never the user's manually-typed values.
  const activeTabDataRef = useRef(null);
  useEffect(()=>{
    if(!activeTabData) return;
    const {businessName="",businessSuffix="",accountNum=""} = activeTabData;
    const bizFull=businessName+(businessSuffix?' '+businessSuffix:'');
    const prev=activeTabDataRef.current;
    // Only apply if the source actually changed (different case/business)
    if(prev&&prev.businessName===businessName&&prev.accountNum===accountNum) return;
    activeTabDataRef.current=activeTabData;
    setForm(f=>({
      ...f,
      bizFilename: businessName||f.bizFilename,
      bizAlt:      (bizFull||businessName)||f.bizAlt,
      accountNum:  accountNum||f.accountNum,
      entityDesignation: businessSuffix||f.entityDesignation,
    }));
  },[activeTabData]);

  const [tab,setTab]               = useState('logo');
  const [copied,setCopied]         = useState(null);
  const [copiedAll,setCopiedAll]   = useState(null);
  const [editingFormat,setEditingFormat] = useState(false);
  const [format,setFormat]         = useState(()=>{
    if(typeof window==="undefined") return DEFAULT_FORMAT;
    try{
      const v=localStorage.getItem("ch_fng_format");
      const saved=v?{...DEFAULT_FORMAT,...JSON.parse(v)}:DEFAULT_FORMAT;
      // Migrate old hero formats that used {nn} to new {page} format
      let migrated=false;
      const migrateHero=(key,defaultVal)=>{
        if(saved[key]&&saved[key].includes('{nn}')&&!saved[key].includes('{page}')){
          saved[key]=defaultVal; migrated=true;
        }
      };
      migrateHero('heroCust',DEFAULT_FORMAT.heroCust);
      migrateHero('heroBi',DEFAULT_FORMAT.heroBi);
      if(migrated) localStorage.setItem("ch_fng_format",JSON.stringify(saved));
      return saved;
    }catch{ return DEFAULT_FORMAT; }
  });
  const [draftFmt,setDraftFmt]     = useState(DEFAULT_FORMAT);
  const [toast,showToast]          = useToast();

  // Persist form to localStorage so it survives page navigation
  useEffect(()=>{
    if(typeof window==="undefined") return;
    localStorage.setItem("ch_fng_form",JSON.stringify(form));
  },[form]);

  // Tracks the values WE last auto-filled, so we can tell whether the user has since
  // customized a field manually (in which case we must not overwrite it on the next sync).
  const lastAutoFillRef = useRef({ bizFilename:null, bizAlt:null, accountNum:null });

  // Auto-fill from the active tab's live data exposed via onFill prop (passed from PostLivePage),
  // falling back to localStorage for context when used standalone (e.g. full-page FNG).
  // Only updates a field when it's empty OR still equals what we last auto-filled,
  // so manual edits in the generator are never overwritten by form changes.
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const applyFill=(biz,acc,bizFull)=>{
      const newBizFn  = biz||"";
      const newBizAlt = bizFull||biz||"";
      const newAcc    = acc||"";
      if(!newBizFn && !newBizAlt && !newAcc) return;
      const last=lastAutoFillRef.current;
      setForm(f=>{
        const next={...f};
        if(newBizFn && (f.bizFilename===''||f.bizFilename===last.bizFilename)) next.bizFilename=newBizFn;
        if(newBizAlt && (f.bizAlt===''||f.bizAlt===last.bizAlt)) next.bizAlt=newBizAlt;
        if(newAcc && (f.accountNum===''||f.accountNum===last.accountNum)) next.accountNum=newAcc;
        return next;
      });
      lastAutoFillRef.current={bizFilename:newBizFn,bizAlt:newBizAlt,accountNum:newAcc};
    };
    const sync=()=>{
      // Try live form data from localStorage (written every keystroke by the active PostLiveForm)
      const activeSrc = localStorage.getItem("ch_minimised_form");
      const lastSaved = localStorage.getItem("ch_last_saved_case");
      const src = activeSrc || lastSaved;
      if(!src) return;
      try{
        const fd = JSON.parse(src);
        const biz    = fd.businessName||"";
        const acc    = fd.accountNum||"";
        const bizFull= biz+(fd.businessSuffix?' '+fd.businessSuffix:'');
        applyFill(biz, acc, bizFull);
      }catch{}
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("ch_case_saved", sync);
    return ()=>{
      window.removeEventListener("storage", sync);
      window.removeEventListener("ch_case_saved", sync);
    };
  },[]);

  const nob = san(form.bizFilename);
  const nobFull = san(form.bizAlt) || nob; // bizAlt = NOB + suffix e.g. 'fire-force-llc'

  // Default fallbacks for every token — so any token used in any format always resolves
  const defaultVars = {
    page:   san(form.pages.filter(Boolean)[0]||''),
    badge:  san(form.badges.filter(Boolean)[0]||''),
    member: san(form.teamMembers.filter(Boolean)[0]||''),
    menu:   san(form.menuNames.filter(Boolean)[0]||''),
    pdf:    san(form.pdfNames.filter(Boolean)[0]||''),
    nn:     '01',
  };

  const applyFmt = (tpl,vars={}) => {
    if(!nob) return '';
    // Merge: explicit vars override defaults
    const resolved = {...defaultVars, ...vars};
    let s=tpl;
    s=s.replace(/{nob}/g, nob);
    s=s.replace(/{nobfull}/g, nobFull||nob);
    Object.entries(resolved).forEach(([k,v])=>{ s=s.replace(new RegExp(`\{${k}\}`,'g'), san(v)||k); });
    return s;
  };

  const copy=(val,key)=>{ if(!val)return; navigator.clipboard?.writeText(val).then(()=>{setCopied(key);setTimeout(()=>setCopied(null),1800);}); };
  const copyAll=(vals,key)=>{ const t=vals.filter(Boolean).join('\n'); if(!t)return; navigator.clipboard?.writeText(t).then(()=>{setCopiedAll(key);setTimeout(()=>setCopiedAll(null),2000);showToast('Copied all!','success');}); };

  const addItem  = (f) => setForm(x=>({...x,[f]:[...x[f],'']}));
  const removeItem=(f,i)=>setForm(x=>{const a=[...x[f]];a.splice(i,1);return {...x,[f]:a.length?a:['']};});
  const setItem  = (f,i,v)=>setForm(x=>{const a=[...x[f]];a[i]=v;return {...x,[f]:a};});

  const handleXlsx = async (file) => {
    try {
      if(!window.XLSX){ await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);}); }
      const ab=await file.arrayBuffer();
      const wb=window.XLSX.read(ab,{type:'array'});
      const ws=wb.Sheets['INPUTS']||wb.Sheets[wb.SheetNames[0]];
      const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(!rows.length){showToast('Empty sheet','error');return;}
      const bizFilename=(rows[0]?.[1]||'').toString().trim();
      const bizAlt=(rows[0]?.[3]||'').toString().trim();
      const accountNum=(rows[1]?.[1]||'').toString().trim();
      const headers=(rows[3]||[]).map(h=>(h||'').toString().toLowerCase().trim());
      const col=(names)=>{for(const n of names){const i=headers.indexOf(n);if(i>=0)return i;}return -1;};
      const getCol=(c)=>c<0?[]:rows.slice(4).map(r=>(r[c]||'').toString().trim()).filter(Boolean);
      const pageC=col(['page names','pages','page']);
      const badgeC=col(['badge names','badges','badge']);
      const teamC=col(['team member','team members','team','staff']);
      const menuC=col(['menu names','menus','menu']);
      const pdfC=col(['pdf','pdf names','pdfs']);
      setForm({bizFilename,bizAlt,accountNum,
        pages:getCol(pageC).length?getCol(pageC):[''],
        badges:getCol(badgeC).length?getCol(badgeC):[''],
        teamMembers:getCol(teamC).length?getCol(teamC):[''],
        menuNames:getCol(menuC).length?getCol(menuC):[''],
        pdfNames:getCol(pdfC).length?getCol(pdfC):[''],
      });
      showToast('Imported ✅','success');
    }catch(e){console.error(e);showToast('Failed to read file','error');}
  };

  const { activeSlotId, allSelected, downloadSelected, removeUploadFor, selectAll, selected, setActiveSlotId, setUploadFor, toggleSelected, uploads } = useSlotUploads({ showToast });

  // CopyCell, Section, DynList are defined outside this component to keep stable refs (prevents input focus loss on keystroke)

  const tabs=[
    {id:'logo',label:'Logo & Misc'},{id:'hero',label:'Hero'},
    {id:'slider',label:'Hero Slider'},{id:'gallery',label:'Gallery'},
    {id:'gallerySpec',label:'Gallery - Separate Page'},{id:'content',label:'Content'},
    {id:'beforeafter',label:'Before/After'},{id:'video',label:'Video Splash'},
    {id:'badges',label:'Badges'},{id:'team',label:'Team'},
    {id:'menu',label:'Menu'},{id:'callout',label:'Callout Icon'},
    {id:'pdf',label:'PDF'},
  ];
  // Confirmed directly from the Figma file: which list each Name Type shows on the left
  // (field it edits, its label, and whether that tab has a per-page list at all —
  // plain "Gallery" has none, just a single upload dropzone).
  const LIST_CONFIG = {
    hero:        {field:'pages',       label:'Page Name',   placeholder:'Page'},
    slider:      {field:'pages',       label:'Page Name',   placeholder:'Page'},
    gallerySpec: {field:'pages',       label:'Page Name',   placeholder:'Page'},
    content:     {field:'pages',       label:'Page Name',   placeholder:'Page'},
    video:       {field:'pages',       label:'Page Name',   placeholder:'Page'},
    callout:     {field:'pages',       label:'Page Name',   placeholder:'Page'},
    beforeafter: {field:'pages',       label:'Keywords',    placeholder:'Keyword'},
    badges:      {field:'badges',      label:'Badge Names', placeholder:'Badge'},
    team:        {field:'teamMembers', label:'Team Members',placeholder:'Staff'},
    menu:        {field:'menuNames',   label:'Menu Names',  placeholder:'Menu'},
    pdf:         {field:'pdfNames',    label:'PDF Names',   placeholder:'PDF'},
    // gallery, logo: no list — single upload area / fixed named slots only
  };
  const listCfg = LIST_CONFIG[tab] || null;

  const N=40;
  const logoVals=[applyFmt(format.logo),applyFmt(format.favicon),applyFmt(format.blogLogo),applyFmt(format.asst),applyFmt(format.introWhy),applyFmt(format.recentReviews),applyFmt(format.videoSplash),applyFmt(format.waveZip),applyFmt(format.waveAssist)];
  const heroPages=form.pages.filter(Boolean);
  const heroCustVals=heroPages.length ? heroPages.map(p=>applyFmt(format.heroCust,{page:san(p)})) : [applyFmt(format.heroCust,{page:'home'})];
  const heroBiVals=heroPages.length ? heroPages.map(p=>applyFmt(format.heroBi,{page:san(p)})) : [applyFmt(format.heroBi,{page:'home'})];
  const galNonVals=Array.from({length:N},(_,i)=>applyFmt(format.galleryNon,{nn:nn(i)}));
  const galSpecVals=form.pages.filter(Boolean).flatMap(p=>Array.from({length:20},(_,i)=>applyFmt(format.gallerySpec,{page:san(p),nn:nn(i)})));
  const baVals=Array.from({length:N},(_,i)=>[applyFmt(format.before,{nn:nn(i)}),applyFmt(format.after,{nn:nn(i)})]).flat();
  const videoMultiVals=form.pages.filter(Boolean).flatMap(p=>Array.from({length:20},(_,i)=>applyFmt(format.videoSplashPage,{page:san(p),nn:nn(i)})));
  const badgeVals=form.badges.filter(Boolean).map(b=>applyFmt(format.badge,{badge:san(b)}));
  const teamVals=form.teamMembers.filter(Boolean).map(m=>applyFmt(format.team,{member:san(m)}));
  const menuNumVals=Array.from({length:10},(_,i)=>applyFmt(format.menu,{nn:nn(i)}));
  const menuNamedVals=form.menuNames.filter(Boolean).flatMap(m=>Array.from({length:10},(_,i)=>applyFmt(format.menuNamed,{menu:san(m),nn:nn(i)})));
  const contentVals=form.pages.filter(Boolean).flatMap(p=>Array.from({length:20},(_,i)=>applyFmt(format.pageContent,{page:san(p),nn:nn(i)})));
  const calloutVals=form.pages.filter(Boolean).flatMap(p=>Array.from({length:10},(_,i)=>applyFmt(format.callout,{page:san(p),nn:nn(i)})));
  const pdfVals=form.pdfNames.filter(Boolean).map(p=>applyFmt(format.pdf,{pdf:san(p)}));
  const sliderVals=Array.from({length:20},(_,i)=>applyFmt(format.heroSlider,{nn:nn(i)}));

  return (
    <FngContext.Provider
      value={{
        copy, copied, copyAll, copiedAll, form, setItem, removeItem, addItem, uploads,
        setUploadFor, removeUploadFor, selected, toggleSelected, activeSlotId, setActiveSlotId, N,
        allSelected, applyFmt, baVals, badgeVals, calloutVals, contentVals, downloadSelected,
        format, galNonVals, galSpecVals, handleXlsx, heroBiVals, heroCustVals, heroPages, logoVals,
        menuNamedVals, menuNumVals, nob, onFill, pdfVals, selectAll, sliderVals, tab, tabs,
        teamVals, videoMultiVals, listCfg, setDraftFmt, setEditingFormat, setForm, setTab,
        showToast,
      }}
    >
    <div>
      <PageHeader title="File Name Generator" subtitle="Manage Your File Names" />
      {editingFormat&&(
        <div className="modal-bg">
          <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',backdropFilter:'var(--glass-blur)',borderRadius:14,padding:28,width:'100%',maxWidth:600,maxHeight:'88vh',overflowY:'auto',boxShadow:'var(--glass-shadow)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{margin:0,fontSize:16}}>Edit Filename Format Templates</h3>
              <button onClick={()=>setEditingFormat(false)} style={{background:'none',border:'none',color:'var(--muted)',fontSize:22,cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:16,padding:'8px 12px',background:'var(--entry-bg)',borderRadius:8,border:'1px solid var(--border)',lineHeight:2}}>
              Tokens: <code style={{color:'var(--accent)'}}>{'{nob}'}</code> name (no suffix) · <code style={{color:'var(--accent)'}}>{'{nobfull}'}</code> name+suffix · <code style={{color:'var(--accent)'}}>{'{nn}'}</code> number · <code style={{color:'var(--accent)'}}>{'{page}'}</code> page · <code style={{color:'var(--accent)'}}>{'{member}'}</code> team · <code style={{color:'var(--accent)'}}>{'{badge}'}</code> badge · <code style={{color:'var(--accent)'}}>{'{menu}'}</code> menu · <code style={{color:'var(--accent)'}}>{'{pdf}'}</code> pdf
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {Object.entries(draftFmt).map(([key,val])=>(
                <div key={key} className="field" style={{marginBottom:0}}>
                  <label style={{textTransform:'uppercase',letterSpacing:'.5px',fontSize:9}}>{key.replace(/([A-Z])/g,' $1').trim()}</label>
                  <input className="inp" style={{fontFamily:'monospace',fontSize:11}} value={val} onChange={e=>setDraftFmt(f=>({...f,[key]:e.target.value}))}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button onClick={()=>{setFormat(draftFmt);storage.set("ch_fng_format",JSON.stringify(draftFmt));setEditingFormat(false);showToast('Format saved ✅','success');}} className="btn btn-save" style={{flex:1,justifyContent:'center'}}>Save Format</button>
              <button onClick={()=>{setFormat(DEFAULT_FORMAT);setDraftFmt(DEFAULT_FORMAT);storage.remove("ch_fng_format");showToast('Reset to default','info');}} className="btn btn-ghost" style={{fontSize:12}}>Reset</button>
              <button onClick={()=>setEditingFormat(false)} className="btn btn-cancel" style={{fontSize:12}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
      <FngCaseInfoPanel />

      <FngResultsPanel />
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
    </FngContext.Provider>
  );
}
