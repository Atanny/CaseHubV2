import { emptyChecklist } from './checklistShape';

export const emptySiteCommentEntry = () => ({
  id: String(Date.now() + Math.random()),
  number: '',
  notes: '',
  clarification: '',
  screenshot: null, // { url, name, path }
  devices: { desktop: false, tablet: false, mobile: false },
  _saved: false,
});

export const emptyBase = () => ({
  // Step 1 — Case Information
  caseNum: '',
  accountNum: '',
  amendType: '',
  customerName: '', // "Requester Name" in the wizard
  customerEmail: '', // "Requester Email" in the wizard
  businessName: '',
  entityDesignation: '', // optional, e.g. "Inc"
  _caseComplexity: 'minor', // minor | major | complex
  inProgressSalesforce: false,
  addedYourName: false,

  // Step 3 — Notepad / Assumption (one entry per Site Comment / Assumption)
  entries: [emptySiteCommentEntry()],

  // Step 4 — Before/After Backup
  images: [], // [{url,name,path}] — before/after backup screenshots

  // Step 5 — Final Checklist
  checklist: emptyChecklist(),
  trackerChecklistLink: '',

  // Inbound-mode only
  inboundNum: '',
  emailAddress: '',
  emailType: 'clarification',

  // Derived at save time from entries[].devices, for Case History/Dashboard
  devices: { desktop: false, tablet: false, mobile: false },
});
