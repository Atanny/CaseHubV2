import { useState, useEffect, useContext, useRef } from 'react';
import { cls } from '../../lib/helpers';
import Toast, { useToast } from '../ui/Toast';
import { FngCtx, CopyCell, FngSection, DynList } from '../fng/FngHelpers';

export default function FileNameGeneratorPage({ onFill=null, activeTabData=null }) {
  const san = (s) => (s||'').toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
  const nn  = (i) => String(i+1).padStart(2,'0');

  const EMPTY = { bizFilename:'', bizAlt:'', accountNum:'', pages:[''], badges:[''], teamMembers:[''], menuNames:[''], pdfNames:[''] };

  const DEFAULT_FORMAT = {
    logo:'{nob}-logo', favicon:'{nob}-favicon', blogLogo:'{nob}-blog-logo',
    asst:'Asst_{nob}_logo', introWhy:'{nob}-intro-why-choose',
    recentReviews:'{nob}-recent-reviews', videoSplash:'{nob}-video',
    videoSplashPage:'{nob}-video-{page}-{nn}', waveZip:'{nob}-wave',
    waveAssist:'{nob}-wave-assistant', heroCust:'{nob}-hero-{page}',
    heroBi:'{nob}-hero-{page}', heroSlider:'{nob}-hero-slider-{nn}',
    galleryNon:'{nob}-gallery-{nn}', gallerySpec:'{nob}-{page}-gallery-{nn}',
    before:'{nob}-before-{nn}', after:'{nob}-after-{nn}',
    badge:'{nob}-badge-{badge}', team:'{nob}-{member}',
    menu:'{nob}-menu-{nn}', menuNamed:'{nob}-menu-{menu}-{nn}',
    pageContent:'{nob}-{page}-{nn}', callout:'{nob}-callout-{page}-{nn}',
    pdf:'{nob}-{pdf}-pdf',
  };

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
          const prevFilled=last||{bizFilename:"",bizAlt:"",accountNum:""};
          return {
            ...base,
            bizFilename: base.bizFilename!==prevFilled.bizFilename ? base.bizFilename : biz,
            bizAlt:      base.bizAlt!==prevFilled.bizAlt           ? base.bizAlt      : (bizFull||biz),
            accountNum:  base.accountNum!==prevFilled.accountNum   ? base.accountNum  : acc,
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

  // CopyCell, Section, DynList are defined outside this component to keep stable refs (prevents input focus loss on keystroke)

  const tabs=[
    {id:'logo',label:'Logo & Misc'},{id:'hero',label:'Hero'},
    {id:'gallery',label:'Gallery'},{id:'beforeafter',label:'Before/After'},
    {id:'video',label:'Video Splash'},{id:'badges',label:'Badges'},
    {id:'team',label:'Team'},{id:'menu',label:'Menu'},
    {id:'content',label:'Content Image'},{id:'callout',label:'Callout Icon'},
    {id:'pdf',label:'PDF'},{id:'slider',label:'Hero Slider'},
  ];

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
    <FngCtx.Provider value={{copy,copied,copyAll,copiedAll,form,setItem,removeItem,addItem}}>
    <div>
      <div className="chd-page-head">
        <div>
          <p className="chd-h4">File Name Generator</p>
          <p className="chd-p-muted">Unlimited inputs · Copy All per section · Import from Excel</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <label className="chd-btn-secondary" style={{display:'inline-flex',alignItems:'center',gap:7,cursor:'pointer'}}>
            Import Excel<input type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={e=>{if(e.target.files[0])handleXlsx(e.target.files[0]);e.target.value='';}}/>
          </label>
          <button className="chd-btn-secondary" onClick={()=>{setDraftFmt({...format});setEditingFormat(true);}}>Edit Format</button>
          <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>{setForm(EMPTY);if(typeof window!=="undefined")localStorage.removeItem("ch_fng_form");}}>Clear All</button>
          {onFill&&<button className="chd-btn-primary" onClick={()=>onFill({bizFilename:form.bizFilename,bizAlt:form.bizAlt,accountNum:form.accountNum})}>Auto-fill Active Form</button>}
        </div>
      </div>
      <div className="chd-divider"/>

      {editingFormat&&(
        <div className="modal-bg">
          <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',backdropFilter:'var(--glass-blur)',borderRadius:14,padding:28,width:'100%',maxWidth:600,maxHeight:'88vh',overflowY:'auto',boxShadow:'var(--glass-shadow)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{margin:0,fontSize:16}}>✏️ Edit Filename Format Templates</h3>
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
              <button onClick={()=>{setFormat(draftFmt);if(typeof window!=="undefined") localStorage.setItem("ch_fng_format",JSON.stringify(draftFmt));setEditingFormat(false);showToast('Format saved ✅','success');}} className="btn btn-save" style={{flex:1,justifyContent:'center'}}>Save Format</button>
              <button onClick={()=>{setFormat(DEFAULT_FORMAT);setDraftFmt(DEFAULT_FORMAT);if(typeof window!=="undefined") localStorage.removeItem("ch_fng_format");showToast('Reset to default','info');}} className="btn btn-ghost" style={{fontSize:12}}>Reset</button>
              <button onClick={()=>setEditingFormat(false)} className="btn btn-cancel" style={{fontSize:12}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{background:'#fff',border:'1px solid var(--border)',padding:'20px 22px',marginBottom:20,borderRadius:12,boxShadow:'var(--shadow-sm)'}}>
        <p className="chd-h6" style={{marginBottom:14}}>Business Information</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:18}}>
          <div className="field" style={{marginBottom:0}}>
            <label style={{display:"flex",alignItems:"center",gap:6}}>
              Business Name — NOB {form.bizFilename&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}
            </label>
            <input className="inp" placeholder="e.g. Fire Force" value={form.bizFilename} onChange={e=>setForm(f=>({...f,bizFilename:e.target.value}))}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Used as <code style={{color:'var(--accent)'}}>&#123;nob&#125;</code> — no LLC/Corp/Inc</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label style={{display:"flex",alignItems:"center",gap:6}}>NOB + Suffix (Alt Text) {form.bizAlt&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}</label>
            <input className="inp" placeholder="e.g. Fire Force LLC" value={form.bizAlt} onChange={e=>setForm(f=>({...f,bizAlt:e.target.value}))}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Used as <code style={{color:'var(--accent)'}}>&#123;nobfull&#125;</code> — includes suffix</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label style={{display:"flex",alignItems:"center",gap:6}}>Account Number {form.accountNum&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}</label>
            <input className="inp" placeholder="e.g. ACC-9876" value={form.accountNum} onChange={e=>setForm(f=>({...f,accountNum:e.target.value}))}/>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>Page Names</div><DynList field="pages" placeholder="Page"/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>Badge Names</div><DynList field="badges" placeholder="Badge"/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>Team Members</div><DynList field="teamMembers" placeholder="Staff"/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>Menu Names</div><DynList field="menuNames" placeholder="Menu"/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>PDF Names</div><DynList field="pdfNames" placeholder="PDF"/></div>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={cls("chd-radio-pill",tab===t.id&&"active")}>{t.label}</button>
        ))}
      </div>

      <div style={{background:'#fff',border:'1px solid var(--border)',padding:'20px 22px',borderRadius:12,boxShadow:'var(--shadow-sm)'}}>
        {tab==='logo'&&(<>
          <FngSection title="Logo" vals={[applyFmt(format.logo)]} sk="logo"><CopyCell val={applyFmt(format.logo)} id="logo"/></FngSection>
          <FngSection title="Favicon" vals={[applyFmt(format.favicon)]} sk="favicon"><CopyCell val={applyFmt(format.favicon)} id="favicon"/></FngSection>
          <FngSection title="Blog Logo" vals={[applyFmt(format.blogLogo)]} sk="blogLogo"><CopyCell val={applyFmt(format.blogLogo)} id="blogLogo"/></FngSection>
          <FngSection title="Assistant Logo" vals={[applyFmt(format.asst)]} sk="asst"><CopyCell val={applyFmt(format.asst)} id="asst"/></FngSection>
          <FngSection title="Intro / Why Choose" vals={[applyFmt(format.introWhy)]} sk="introWhy"><CopyCell val={applyFmt(format.introWhy)} id="introWhy"/></FngSection>
          <FngSection title="Recent Reviews" vals={[applyFmt(format.recentReviews)]} sk="recentReviews"><CopyCell val={applyFmt(format.recentReviews)} id="recentReviews"/></FngSection>
          <FngSection title="Video Splash" vals={[applyFmt(format.videoSplash)]} sk="videoSplash"><CopyCell val={applyFmt(format.videoSplash)} id="videoSplash"/></FngSection>
          <FngSection title="Wave Zip" vals={[applyFmt(format.waveZip)]} sk="waveZip"><CopyCell val={applyFmt(format.waveZip)} id="waveZip"/></FngSection>
          <FngSection title="Wave-Assistant Zip" vals={[applyFmt(format.waveAssist)]} sk="waveAssist"><CopyCell val={applyFmt(format.waveAssist)} id="waveAssist"/></FngSection>
          <div style={{marginTop:12}}><button onClick={()=>copyAll(logoVals,'logo-all')} className="btn btn-ghost" style={{width:'100%',justifyContent:'center',fontSize:12}}>{copiedAll==='logo-all'?'✓ Copied All':'Copy All Logo & Misc'}</button></div>
        </>)}
        {tab==='hero'&&(<>
          <FngSection title="Hero — AI Artwork / Customer Supplied" vals={heroCustVals} sk="hero-cust">
            {nob&&heroPages.length ? heroPages.map((p,pi)=>(
              <div key={pi} style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                <CopyCell val={applyFmt(format.heroCust,{page:san(p)})} id={`hc-${pi}`}/>
              </div>
            )) : <CopyCell val={heroCustVals[0]} id="hc-0"/>}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name and page names above.</div>}
          </FngSection>
          <FngSection title="Hero — Business Images" vals={heroBiVals} sk="hero-bi">
            {nob&&heroPages.length ? heroPages.map((p,pi)=>(
              <div key={pi} style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                <CopyCell val={applyFmt(format.heroBi,{page:san(p)})} id={`hbi-${pi}`}/>
              </div>
            )) : <CopyCell val={heroBiVals[0]} id="hbi-0"/>}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name and page names above.</div>}
          </FngSection>
        </>)}
        {tab==='gallery'&&(<>
          <FngSection title="Gallery (Nondescript)" vals={galNonVals} sk="gal-non">{galNonVals.map((v,i)=><CopyCell key={i} val={v} id={`gn-${i}`}/>)}</FngSection>
          <FngSection title="Gallery (Specific / Categorized by Page)" vals={galSpecVals} sk="gal-spec">
            {nob&&form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:20},(_,i)=><CopyCell key={i} val={applyFmt(format.gallerySpec,{page:san(p),nn:nn(i)})} id={`gs-${pi}-${i}`}/>)}
              </div>
            ))}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name and page names above.</div>}
          </FngSection>
        </>)}
        {tab==='beforeafter'&&(
          <FngSection title="Before / After" vals={baVals} sk="ba">
            {Array.from({length:N},(_,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:4}}>
                <CopyCell val={applyFmt(format.before,{nn:nn(i)})} id={`bef-${i}`}/>
                <CopyCell val={applyFmt(format.after,{nn:nn(i)})} id={`aft-${i}`}/>
              </div>
            ))}
          </FngSection>
        )}
        {tab==='video'&&(<>
          <FngSection title="Video Splash (Single)" vals={[applyFmt(format.videoSplash)]} sk="vid-s"><CopyCell val={applyFmt(format.videoSplash)} id="vid-s"/></FngSection>
          <FngSection title="Video Splash — Multiple Images (by Page)" vals={videoMultiVals} sk="vid-multi">
            {nob&&form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:20},(_,i)=><CopyCell key={i} val={applyFmt(format.videoSplashPage,{page:san(p),nn:nn(i)})} id={`vm-${pi}-${i}`}/>)}
              </div>
            ))}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name + page names above.</div>}
          </FngSection>
        </>)}
        {tab==='badges'&&(
          <FngSection title="Badge Images" vals={badgeVals} sk="badges">
            {form.badges.filter(Boolean).map((b,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:11,color:'var(--muted)',marginBottom:3}}>{b}</div><CopyCell val={applyFmt(format.badge,{badge:san(b)})} id={`badge-${i}`}/></div>))}
            {!form.badges.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter badge names above.</div>}
          </FngSection>
        )}
        {tab==='team'&&(
          <FngSection title="Team Member Photos" vals={teamVals} sk="team">
            {form.teamMembers.filter(Boolean).map((m,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:11,color:'var(--muted)',marginBottom:3}}>{m}</div><CopyCell val={applyFmt(format.team,{member:san(m)})} id={`tm-${i}`}/></div>))}
            {!form.teamMembers.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter team member names above.</div>}
          </FngSection>
        )}
        {tab==='menu'&&(<>
          <FngSection title="Menu (Single — numbered)" vals={menuNumVals} sk="menu-num">{menuNumVals.map((v,i)=><CopyCell key={i} val={v} id={`mn-${i}`}/>)}</FngSection>
          <FngSection title="Menu (Multiple — by name)" vals={menuNamedVals} sk="menu-named">
            {form.menuNames.filter(Boolean).map((m,mi)=>(
              <div key={mi} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{m}</div>
                {Array.from({length:10},(_,i)=><CopyCell key={i} val={applyFmt(format.menuNamed,{menu:san(m),nn:nn(i)})} id={`mnn-${mi}-${i}`}/>)}
              </div>
            ))}
            {!form.menuNames.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter menu names above.</div>}
          </FngSection>
        </>)}
        {tab==='content'&&(
          <FngSection title="Body / Content Image (by Page)" vals={contentVals} sk="content">
            {form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:20},(_,i)=><CopyCell key={i} val={applyFmt(format.pageContent,{page:san(p),nn:nn(i)})} id={`ci-${pi}-${i}`}/>)}
              </div>
            ))}
            {!form.pages.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter page names above.</div>}
          </FngSection>
        )}
        {tab==='callout'&&(
          <FngSection title="Callout / Coupon Icon (by Page)" vals={calloutVals} sk="callout">
            {form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:10},(_,i)=><CopyCell key={i} val={applyFmt(format.callout,{page:san(p),nn:nn(i)})} id={`co-${pi}-${i}`}/>)}
              </div>
            ))}
            {!form.pages.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter page names above.</div>}
          </FngSection>
        )}
        {tab==='pdf'&&(
          <FngSection title="PDF Files" vals={pdfVals} sk="pdf">
            {form.pdfNames.filter(Boolean).map((p,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:11,color:'var(--muted)',marginBottom:3}}>{p}</div><CopyCell val={applyFmt(format.pdf,{pdf:san(p)})} id={`pdf-${i}`}/></div>))}
            {!form.pdfNames.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter PDF names above.</div>}
          </FngSection>
        )}
        {tab==='slider'&&(
          <FngSection title="Hero Slider" vals={sliderVals} sk="slider">{sliderVals.map((v,i)=><CopyCell key={i} val={v} id={`sl-${i}`}/>)}</FngSection>
        )}
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
    </FngCtx.Provider>
  );
}

