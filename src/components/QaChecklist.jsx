import Checkbox from './Checkbox';

const ITEMS = [
  ['backup', 'Backup Screenshots taken'],
  ['caseComment', 'Case Comment posted'],
  ['combinedTracker', 'Combined Tracker updated'],
  ['qaChecklist', 'QA Checklist completed'],
  ['completeJob', 'Job marked complete'],
  ['closeSiteComment', 'Site Comment closed'],
  ['emailSales', 'Sales notified via email'],
  ['trackerChecklist', 'Tracker Checklist linked'],
  ['completeStatus', 'Status set to Complete'],
];

export default function QaChecklist({ checklist, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {ITEMS.map(([key, label]) => (
        <Checkbox key={key} checked={!!checklist[key]} onChange={() => onChange({ ...checklist, [key]: !checklist[key] })} label={label} />
      ))}
    </div>
  );
}
