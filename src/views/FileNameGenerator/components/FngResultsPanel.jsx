import { Icon } from '@/components/ui/Icon'
import { FngSection } from './FngSection'
import { CopyCell } from './CopyCell'
import { nn, san } from '../fngConfig'
import { useFng } from '../useFng'

export function FngResultsPanel() {
  const {
    N, allSelected, applyFmt, baVals, badgeVals, calloutVals, contentVals, copiedAll, copyAll,
    downloadSelected, form, format, galNonVals, galSpecVals, handleXlsx, heroBiVals, heroCustVals,
    heroPages, logoVals, menuNamedVals, menuNumVals, nob, onFill, pdfVals, selectAll, selected,
    sliderVals, tab, tabs, teamVals, uploads, videoMultiVals,
  } = useFng()

  return (
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12,gap:16,flexWrap:'wrap'}}>
        <div>
          <div className="page-title" style={{display:'flex',alignItems:'center',gap:10,fontSize:18}}><span style={{fontSize:20}}>📁</span> File Name Generator</div>
          <div className="page-sub">Unlimited inputs · Copy All per section · Import from Excel</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <label className="btn btn-ghost btn-noicon" style={{cursor:'pointer'}}>
            <Icon name="upload" size={14}/> Import Excel<input type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={e=>{if(e.target.files[0])handleXlsx(e.target.files[0]);e.target.value='';}}/>
          </label>
          {onFill&&<button onClick={()=>onFill({bizFilename:form.bizFilename,bizAlt:form.bizAlt,accountNum:form.accountNum})} className="btn btn-outline-accent">Auto-fill Active Form</button>}
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{fontSize:15,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{tabs.find(t=>t.id===tab)?.label} Upload</div>
        <div style={{fontSize:12,color:'var(--muted)',fontWeight:600}}>Selected: {selected.size}/{Object.keys(uploads).length}</div>
      </div>
      <div style={{height:1,background:'var(--border)',marginBottom:16}}/>

      <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'20px 22px',borderRadius:12,boxShadow:'var(--shadow-sm)'}}>
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
          <div style={{marginTop:12}}><button onClick={()=>copyAll(logoVals,'logo-all')} className="btn btn-ghost" style={{width:'100%',justifyContent:'center',fontSize:12}}>{copiedAll==='logo-all'?'Copied All':'Copy All Logo & Misc'}</button></div>
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
        {tab==='gallery'&&(
          <FngSection title="Gallery (Nondescript)" vals={galNonVals} sk="gal-non">{galNonVals.map((v,i)=><CopyCell key={i} val={v} id={`gn-${i}`}/>)}</FngSection>
        )}
        {tab==='gallerySpec'&&(
          <FngSection title="Gallery - Separate Page" vals={galSpecVals} sk="gal-spec">
            {nob&&form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:20},(_,i)=><CopyCell key={i} val={applyFmt(format.gallerySpec,{page:san(p),nn:nn(i)})} id={`gs-${pi}-${i}`}/>)}
              </div>
            ))}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name and page names above.</div>}
          </FngSection>
        )}
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
          <FngSection title="Hero Slider" vals={sliderVals} sk="slider">
            {nob&&heroPages.length ? heroPages.map((p,pi)=>(
              <div key={pi} style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                <CopyCell val={applyFmt(format.heroSlider,{page:san(p),nn:'01'})} id={`sl-${pi}`}/>
              </div>
            )) : <CopyCell val={sliderVals[0]} id="sl-0"/>}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name and page names above.</div>}
          </FngSection>
        )}
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:16,marginTop:16}}>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,color:'var(--text)',cursor:'pointer',userSelect:'none'}}>
          <input type="checkbox" checked={allSelected} onChange={selectAll}/> Select All
        </label>
        <button onClick={downloadSelected} className="btn btn-primary">
          Download Selected{selected.size>0?` (${selected.size})`:''}
        </button>
      </div>
      </div>
  )
}
