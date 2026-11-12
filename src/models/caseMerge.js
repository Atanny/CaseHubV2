// Helpers shared by the create/update case flows.
import { storage } from '@/services/storage'

// Combine what we sent (payload) with what the API returned (saved): the API
// response wins, but empty values fall back to the payload so nothing is lost.
export function mergeSavedCase(payload, saved) {
  const merged = {...payload,...saved,
    customerName:   saved.customerName   || payload.customerName   || "",
    customerEmail:  saved.customerEmail  || payload.customerEmail  || "",
    businessName:   saved.businessName   || payload.businessName   || "",
    businessSuffix: saved.businessSuffix || payload.businessSuffix || "",
    inboundNum:     saved.inboundNum     || payload.inboundNum     || "",
    inProgress:     saved.inProgress     ?? payload.inProgress     ?? false,
    entries:        (saved.entries&&saved.entries.length>0)?saved.entries:(payload.entries||[]),
    checklist:      saved.checklist      || payload.checklist      || {},
    devices:        saved.devices        || payload.devices        || {},
    trackerChecklistLink:saved.trackerChecklistLink||payload.trackerChecklistLink||"",
    emailAddress:   saved.emailAddress   || payload.emailAddress   || "",
    emailType:      saved.emailType      || payload.emailType      || "",
    images:         (saved.images&&saved.images.length>0)?saved.images:(payload.images||[]),
    backupImages:   (saved.backupImages&&saved.backupImages.length>0)?saved.backupImages:(payload.backupImages||[]),
  };
  return merged
}

// Remember fields the DB does not persist, keyed by case number, so they survive reloads.
export function cacheCaseExtras(merged) {
  try{
    const cacheKey="ch_case_extra_cache";
    const raw=storage.get(cacheKey);
    const cache=raw?JSON.parse(raw):{};
    if(merged.caseNum){
      cache[merged.caseNum]={customerName:merged.customerName,customerEmail:merged.customerEmail,businessName:merged.businessName,businessSuffix:merged.businessSuffix,inboundNum:merged.inboundNum,inProgress:merged.inProgress,entries:merged.entries,checklist:merged.checklist,devices:merged.devices,trackerChecklistLink:merged.trackerChecklistLink,emailAddress:merged.emailAddress,emailType:merged.emailType};
      storage.set(cacheKey,JSON.stringify(cache));
    }
  }catch(e){}
}
