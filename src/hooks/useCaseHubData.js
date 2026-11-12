import { useEffect, useState } from 'react'
import { cacheCaseExtras, mergeSavedCase } from '@/models/caseMerge'
import * as caseService from '@/services/caseService'
import * as announcementService from '@/services/announcementService'
import * as linkService from '@/services/linkService'
import * as requestorService from '@/services/requestorService'
import * as draftService from '@/services/draftService'
import * as profileService from '@/services/profileService'
import { storage } from '@/services/storage'
import { uploadImageToStorage } from '@/services/imageService'

export function useCaseHubData({ dbStatus, setSessionLog, setUser, user }) {
  const [allCases,setAllCases]=useState([]);
  const [drafts,setDrafts]=useState([]);
  const [archivedDrafts,setArchivedDrafts]=useState([]);
  const [specialRequestors,setSpecialRequestors]=useState([]);
  const [announcements,setAnnouncements]=useState([]);
  const [links,setLinks]=useState([]);
  const [dataLoading,setDataLoading]=useState(false);

  // ── Load all data when user is set ──
  useEffect(()=>{
    if(!user)return;
    setDataLoading(true);
    Promise.all([
      caseService.listCases(user.email).then(r=>r.json()).catch(()=>[]),
      announcementService.listAnnouncements().then(r=>r.json()).catch(()=>[]),
      linkService.listLinks(user.email).then(r=>r.json()).catch(()=>[]),
      requestorService.listRequestors().then(r=>r.json()).catch(()=>[]),
      draftService.listDrafts(user.email).then(r=>r.json()).catch(()=>[]),
      profileService.getProfile(user.email).then(r=>r.json()).catch(()=>({})),
      draftService.listArchivedDrafts(user.email).then(r=>r.json()).catch(()=>[]),
    ]).then(([cases,anns,lnks,reqs,draftList,profile,archivedList])=>{
      const mergeWithCache=(rawCases)=>{
        if(!Array.isArray(rawCases)) return [];
        try{
          const raw=storage.get("ch_case_extra_cache");
          if(!raw) return rawCases;
          const cache=JSON.parse(raw);
          return rawCases.map(c=>{
            const cached=c.caseNum?cache[c.caseNum]:null;
            if(!cached) return c;
            return{...c,customerName:c.customerName||cached.customerName||"",customerEmail:c.customerEmail||cached.customerEmail||"",businessName:c.businessName||cached.businessName||"",businessSuffix:c.businessSuffix||cached.businessSuffix||"",inboundNum:c.inboundNum||cached.inboundNum||"",inProgress:c.inProgress??cached.inProgress??false,entries:(c.entries&&c.entries.length>0)?c.entries:(cached.entries||c.entries||[]),checklist:c.checklist||cached.checklist||{},devices:c.devices||cached.devices||{},trackerChecklistLink:c.trackerChecklistLink||cached.trackerChecklistLink||"",emailAddress:c.emailAddress||cached.emailAddress||"",emailType:c.emailType||cached.emailType||""};
          });
        }catch(e){return rawCases;}
      };
      setAllCases(mergeWithCache(Array.isArray(cases)?[...cases].reverse():[]));
      setAnnouncements(Array.isArray(anns)?anns:[]);
      setLinks(Array.isArray(lnks)?lnks:[]);
      setSpecialRequestors(Array.isArray(reqs)?reqs:[]);
      setDrafts(Array.isArray(draftList)?draftList:[]);
      setArchivedDrafts(Array.isArray(archivedList)?archivedList:[]);
      // Merge profile data into user object so filenames/avatar are always current
      if(profile && profile.email){
        const merged={...user,
          name:       profile.name         || user.name,
          role:       profile.role         || user.role||"",
          avatarUrl:  profile.avatar_url   || user.avatarUrl||"",
          beforeName: profile.before_name  || user.beforeName||"",
          afterName:  profile.after_name   || user.afterName||"",
          screenshotName: profile.screenshot_name || user.screenshotName||"",
          greetingMessages: (profile.greeting_messages&&profile.greeting_messages.length>0) ? profile.greeting_messages : (user.greetingMessages||[]),
        };
        localStorage.setItem("ch_user",JSON.stringify(merged));
        setUser(merged);
      }
    }).catch(console.error).finally(()=>setDataLoading(false));
  },[user?.email]);

  // ── Cases ──
  const addCase=async(c)=>{
    try{
      // Upload any RAM (blob) images to Supabase Storage before saving the case
      const uploadPending=async(imgs)=>{
        return Promise.all((imgs||[]).map(async(img)=>{
          if(img._inDB||!img._file)return{url:img.url,name:img.name,id:img.id||img.path,path:img.path||img.id};
          const uploaded=await uploadImageToStorage(img._file,img.name);
          return uploaded?{url:uploaded.url,name:uploaded.name,id:uploaded.path,path:uploaded.path}:{url:img.url,name:img.name,id:img.id,path:img.id};
        }));
      };
      const [uploadedImages,uploadedBackup]=await Promise.all([uploadPending(c.images),uploadPending(c.backupImages)]);
      const payload={
        ...c,
        userEmail:user.email,
        images:uploadedImages,
        backupImages:uploadedBackup,
        entries:(c.entries||[]).map(({_file,...rest})=>rest),
        trackerChecklistLink:c.trackerChecklistLink||"",
      };
      const res=await caseService.createCase(payload);
      const saved=await res.json();
      if(!res.ok){console.error("addCase API error:",saved.error);return;}
      const merged=mergeSavedCase(payload,saved);
      cacheCaseExtras(merged);
      setAllCases(a=>[merged,...a]);
      dbStatus.markSaved();
    }catch(e){
      console.error("addCase exception:",e);
    }
  };
  const updateCase=async(id,updated)=>{
    try{
      // EditableCaseCard already uploads immediately, but strip any residual _file refs
      const cleanImgs=(imgs)=>(imgs||[]).map(({_file,url,name,id,path,_inDB})=>({url,name,id,path:path||id,_inDB:_inDB||false}));
      const payload={
        ...updated,
        userEmail:user.email,
        images:cleanImgs(updated.images),
        backupImages:cleanImgs(updated.backupImages),
        entries:(updated.entries||[]).map(({_file,...rest})=>rest),
        trackerChecklistLink:updated.trackerChecklistLink||"",
      };
      const res=await caseService.updateCase(id,payload);
      const saved=await res.json();
      if(!res.ok){console.error("updateCase error:",saved.error);return;}
      const merged=mergeSavedCase(payload,saved);
      cacheCaseExtras(merged);
      setAllCases(a=>a.map(c=>c._id===id?merged:c));
      dbStatus.markSaved();
    }catch(e){console.error("updateCase exception:",e);}
  };
  const deleteCase=async(id)=>{
    try{await caseService.deleteCase(id);}catch(e){console.error(e);}
    setAllCases(a=>a.filter(c=>c._id!==id));
  };

  // ── Drafts ──
  const saveDraft=async(mode,draftData)=>{
    const clean=(imgs)=>(imgs||[]).map(({file,url,name,id,path,type})=>({url,name,id,path:path||id||name,type}));
    const cleanData={...draftData,images:clean(draftData.images||[]),backupImages:clean(draftData.backupImages||[])};
    const res=await draftService.createDraft({userEmail:user.email,mode,draftData:cleanData});
    const saved=await res.json();
    if(!res.ok) throw new Error(saved.error||"Failed to Suspend Case");
    setDrafts(ds=>[...ds.filter(d=>d._mode!==mode),saved]);
  };
  const updateDraft=async(id,updatedData)=>{
    try{
      const res=await draftService.updateDraft(id,{draftData:updatedData});
      if(!res.ok) return;
      setDrafts(ds=>ds.map(d=>d._id===id?{...d,...updatedData}:d));
    }catch(e){console.error("updateDraft error:",e);}
  };
  const deleteDraft=async(id,mode,skipDeleteLog=false)=>{
    // Used only when completing/saving a suspended case (skipDeleteLog=true).
    // Direct user-triggered removal now goes through archiveDraft instead.
    const draft=drafts.find(d=>d._id===id||d._mode===mode);
    const deletedCaseNum=draft?.caseNum||"";
    try{await draftService.deleteDraft(id);}catch(e){console.error(e);}
    setDrafts(ds=>ds.filter(d=>d._id!==id&&d._mode!==mode));
    if(deletedCaseNum&&!skipDeleteLog){
      setSessionLog(prev=>{
        const updated=prev.map(e=>{
          if((e.caseNum||"")===(deletedCaseNum||"")&&e.outcome==="Suspended"){
            return {...e,outcome:"Deleted"};
          }
          return e;
        });
        storage.set("ch_session_log",JSON.stringify(updated));
        return updated;
      });
    }
  };

  const archiveDraft=async(id,mode)=>{
    const draft=drafts.find(d=>d._id===id||d._mode===mode);
    if(!draft) return;
    const archivedCaseNum=draft.caseNum||"";
    try{
      // 1. Copy to archived_drafts
      const res=await draftService.archiveDraft({
        userEmail:user.email,
        mode,
        draftData:{...draft,_id:undefined,draftAt:undefined},
        savedAt:draft.draftAt||null,
      });
      const saved=await res.json();
      if(!res.ok) throw new Error(saved.error||"Failed to archive");
      setArchivedDrafts(a=>[saved,...a]);
      // 2. Remove from drafts
      await draftService.deleteDraft(id);
      setDrafts(ds=>ds.filter(d=>d._id!==id&&d._mode!==mode));
      // 3. Mark session log entry as Archived
      if(archivedCaseNum){
        setSessionLog(prev=>{
          const updated=prev.map(e=>{
            if((e.caseNum||"")===(archivedCaseNum||"")&&e.outcome==="Suspended"){
              return {...e,outcome:"Archived"};
            }
            return e;
          });
          storage.set("ch_session_log",JSON.stringify(updated));
          return updated;
        });
      }
    }catch(e){
      console.error("[archiveDraft]",e);
    }
  };

  // ── Announcements ──
  const addAnnouncement=async(a)=>{
    const res=await announcementService.createAnnouncement(a);
    const saved=await res.json();
    if(!res.ok)throw new Error(saved.error||"Failed to save announcement");
    setAnnouncements(p=>[saved,...p]);
  };
  const updateAnnouncement=async(id,updates)=>{
    const res=await announcementService.updateAnnouncement(id,updates);
    const saved=await res.json();
    if(!res.ok)throw new Error(saved.error||"Failed to update announcement");
    setAnnouncements(a=>a.map(x=>x.id===id?saved:x));
  };
  const removeAnnouncement=async(id)=>{
    const res=await announcementService.deleteAnnouncement(id);
    if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.error||"Failed to delete");}
    setAnnouncements(a=>a.filter(x=>x.id!==id));
  };

  // ── Links ──
  const addLink=async(l)=>{
    try{
      const res=await linkService.createLink({...l,userEmail:user.email});
      const saved=await res.json();
      setLinks(p=>[...p,saved]);
    }catch(e){console.error(e);setLinks(p=>[...p,{...l,id:Date.now()}]);}
  };
  const updateLink=async(id,updates)=>{
    try{
      const res=await linkService.updateLink(id,updates);
      const saved=await res.json();
      if(res.ok) setLinks(l=>l.map(x=>x.id===id?saved:x));
    }catch(e){console.error(e);}
  };
  const removeLink=async(id)=>{
    try{await linkService.deleteLink(id);}catch(e){console.error(e);}
    setLinks(l=>l.filter(x=>x.id!==id));
  };

  // ── Requestors ──
  const addRequestor=async(name)=>{
    try{await requestorService.createRequestor({name});}catch(e){console.error(e);}
    setSpecialRequestors(s=>[...s,name]);
  };
  const removeRequestor=async(name)=>{
    try{await requestorService.deleteRequestor(name);}catch(e){console.error(e);}
    setSpecialRequestors(s=>s.filter(x=>x!==name));
  };

  return { addAnnouncement, addCase, addLink, addRequestor, allCases, announcements, archiveDraft, archivedDrafts, dataLoading, deleteCase, deleteDraft, drafts, links, removeAnnouncement, removeLink, removeRequestor, saveDraft, setAllCases, setAnnouncements, setArchivedDrafts, setDrafts, setLinks, setSpecialRequestors, specialRequestors, updateAnnouncement, updateCase, updateDraft, updateLink }
}
