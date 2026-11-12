// ── Wizard page definitions — the Figma design groups the original 8 accordion
// steps into 5 wizard pages. WIZARD_PAGES/STEP_PAGE are the single source of
// truth used by WizardStepBar, PostLiveForm's Back/Next handlers, and the
// per-section "isOpen" checks — nothing about the underlying step numbering,
// validation, or done/locked logic from v1 changes, only how many pages of UI
// they're grouped into.
export const WIZARD_PAGES = [
  {page:1, steps:[1], label:"Case Info"},
  {page:2, steps:[2,3], label:"Before SS / Additional Backup"},
  {page:3, steps:[4,5], label:isSC=>isSC?"Amends Notepad":"Assumptions"},
  {page:4, steps:[6,7], label:"After SS / B&A Backup"},
  {page:5, steps:[8], label:"Final Checklist"},
];

export const STEP_PAGE = {1:1, 2:2, 3:2, 4:3, 5:3, 6:4, 7:4, 8:5};
