export const CHECKLIST_GROUPS = [
  ['First Steps', [
    ['closeSiteComment', 'Close Your Site Comment'],
    ['uploadBackup', 'Upload Your Before/After Backup'],
    ['uploadCaseComment', 'Upload Your Case Comment'],
  ]],
  ['Second Steps', [
    ['completeClarify', 'Complete/Clarify Your Case'],
    ['emailRequestor', 'Email Your Requestor'],
    ['tagStatusTracker', 'Tag Your Status Tracker'],
  ]],
  ['Last Steps', [
    ['fillCombinedTracker', 'Fill Combined Tracker Form'],
    ['fillQaChecklist', 'Fill QA Checklist Form'],
  ]],
];

export const CHECKLIST_KEYS = CHECKLIST_GROUPS.flatMap(([, items]) => items.map(([k]) => k));

export function emptyChecklist() {
  return Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, false]));
}
