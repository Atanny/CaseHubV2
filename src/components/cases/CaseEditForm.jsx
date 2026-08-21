import { useState } from 'react';
import Button from '../ui/Button';

const FIELDS = [
  ['caseNum', 'Case Number'],
  ['accountNum', 'Account Number'],
  ['amendType', 'Amend Type'],
  ['customerName', 'Customer Name'],
  ['customerEmail', 'Customer Email'],
  ['businessName', 'Business Name'],
  ['trackerChecklistLink', 'Tracker Checklist Link'],
];

/**
 * Lightweight editor for a case's core fields. The legacy app's "Edit Case"
 * opens the full Post-Live editor (image upload, entries, device checklist) —
 * that component belongs to the Post-Live Amends milestone since it's the
 * same shared editor used there. This covers the fields that are safe to
 * edit standalone.
 */
export default function CaseEditForm({ caseData, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => {
    const initial = {};
    FIELDS.forEach(([key]) => {
      initial[key] = caseData[key] || '';
    });
    return initial;
  });

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(([key, label]) => (
          <div key={key} className="flex flex-col gap-1.5">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">{label}</p>
            <input
              className="w-full h-[42px] px-3.5 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2.5">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
