import { CopyRow } from './CopyRow';

const TYPES = [
  ['clarification', 'Clarification'],
  ['completed', 'Completed'],
];

function buildEmail(form, entries) {
  const lines = entries.filter((e) => e.note || e.clarification);
  if (form.emailType === 'clarification') {
    let body = `Hi,\n\nThank you for reaching out. Before proceeding with your request, we'd like to clarify the following:\n\n`;
    lines.forEach((e, i) => {
      body += `${i + 1}. ${e.note || ''}\n`;
      if (e.clarification) body += `   ${e.clarification}\n`;
    });
    body += `\nPlease confirm at your earliest convenience so we can proceed.\n\nBest regards`;
    return body;
  }
  let body = `Hi,\n\nYour requested amendment has been completed:\n\n`;
  lines.forEach((e, i) => {
    body += `${i + 1}. ${e.note || ''}\n`;
  });
  body += `\nPlease let us know if you have any questions.\n\nBest regards`;
  return body;
}

/** Inbound-mode email panel: recipient, type toggle, and a generated email body ready to copy. */
export default function EmailComposer({ form, onChange }) {
  const email = buildEmail(form, form.entries || []);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Email Address</p>
          <input
            type="email"
            className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
            value={form.emailAddress}
            onChange={(e) => onChange({ ...form, emailAddress: e.target.value })}
          />
        </div>
        <div>
          <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">Email Type</p>
          <div className="flex gap-2">
            {TYPES.map(([v, l]) => (
              <button
                key={v}
                onClick={() => onChange({ ...form, emailType: v })}
                className={`flex-1 h-9 rounded-ch font-body text-body border ${form.emailType === v ? 'bg-ch-main border-ch-main text-white' : 'bg-white border-ch-border text-ch-main'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <CopyRow label="Generated Email" value={email} />
    </div>
  );
}
