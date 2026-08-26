import Divider from './Divider';

const DEVICE_ORDER = [
  ['desktop', 'Desktop'],
  ['tablet', 'Tablet'],
  ['mobile', 'Mobile'],
];

// Figma shows checklist progress as three named step groups with a done/total
// count each (e.g. "First Step: 3/3"). These match the exact grouping and
// item set from the Post-Live Amends Final Checklist wizard step.
const STEP_GROUPS = [
  ['First Step', ['closeSiteComment', 'uploadBackup', 'uploadCaseComment']],
  ['Second Step', ['completeClarify', 'emailRequestor', 'tagStatusTracker']],
  ['Last Step', ['fillCombinedTracker', 'fillQaChecklist']],
];

export default function CaseDetailCard({ caseRecord, onImageClick }) {
  const c = caseRecord;
  const devices = DEVICE_ORDER.filter(([key]) => c.devices?.[key]);
  const shots = [...(c.images || []), ...(c.backupImages || [])];

  return (
    <div className="bg-ch-secondary border border-ch-border rounded-[5px] shadow-ch p-5 flex flex-col gap-2.5 flex-1 min-w-[280px]">
      <p className="text-[10px] font-label font-bold uppercase text-ch-main">Devices Checklist</p>
      {devices.length === 0 && <p className="font-body text-body text-ch-main opacity-50">—</p>}
      {devices.map(([key, label]) => (
        <p key={key} className="font-body text-body text-ch-main capitalize">
          {label}
        </p>
      ))}

      <Divider className="!bg-white !h-[2px]" />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main">Final Checklist</p>
      {STEP_GROUPS.map(([label, keys]) => {
        const done = keys.filter((k) => c.checklist?.[k]).length;
        return (
          <p key={label} className="font-body text-body text-ch-main">
            <span className="font-bold">{label}:</span> {done}/{keys.length}
          </p>
        );
      })}
      <p className="font-body text-body text-ch-main break-all">
        <span className="font-bold">Tracker Link:</span> {c.trackerChecklistLink || '—'}
      </p>

      <Divider className="!bg-white !h-[2px]" />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main">Screenshots</p>
      {shots.length === 0 ? (
        <p className="font-body text-body text-ch-main opacity-50">No screenshots.</p>
      ) : (
        <div className="flex gap-2.5 flex-wrap">
          {shots.map((img, i) => (
            <button key={i} onClick={() => onImageClick(img.url)} className="w-[222px] h-[222px] max-w-full rounded-ch border border-ch-border shadow-ch overflow-hidden">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
