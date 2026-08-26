import Icon from './Icon';
import { CHECKLIST_GROUPS, CHECKLIST_KEYS } from './checklistShape';

const inputCls = 'w-full h-11 px-4 bg-white border border-ch-border rounded-ch outline-none font-body text-body text-ch-main';

export default function Step5FinalChecklist({ form, setForm, onBack, onSubmit, submitting }) {
  const allChecked = CHECKLIST_KEYS.every((k) => form.checklist[k]);

  function toggle(key) {
    setForm((f) => ({ ...f, checklist: { ...f.checklist, [key]: !f.checklist[key] } }));
  }

  return (
    <div className="bg-white rounded-ch shadow-ch p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">6</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">Final Checklist</p>
          <p className="font-body text-body text-ch-main opacity-60">
            Check All Of The Changes You&apos;ve Made - <span className="text-ch-red">All Checkbox Is Required</span>
          </p>
        </div>
      </div>

      {CHECKLIST_GROUPS.map(([groupLabel, items]) => (
        <div key={groupLabel} className="flex flex-col gap-2">
          <p className="text-[10px] font-label font-bold uppercase text-ch-main">{groupLabel} (All Items Must Be Checked)*</p>
          {items.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 h-11 px-4 bg-white border border-ch-border rounded-ch font-body text-body text-ch-main">
              <input type="checkbox" checked={!!form.checklist[key]} onChange={() => toggle(key)} />
              {label}
            </label>
          ))}
        </div>
      ))}

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Tracker Link</p>
        <input
          className={inputCls}
          placeholder="Insert Your Tracker Form"
          value={form.trackerChecklistLink}
          onChange={(e) => setForm((f) => ({ ...f, trackerChecklistLink: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2.5">
        <button onClick={onBack} className="flex items-center justify-center w-11 h-11 rounded-ch bg-white border border-ch-border text-ch-main">
          <Icon name="back" size={18} color="#40513B" />
        </button>
        <button
          onClick={onSubmit}
          disabled={!allChecked || submitting}
          className="flex items-center gap-2 px-5 h-11 rounded-ch bg-ch-main text-white font-body text-body disabled:opacity-40"
        >
          {submitting ? 'Submitting…' : 'Submit This Case'}
          <Icon name="archive" size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}
