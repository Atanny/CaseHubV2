import Icon from './Icon';
import RequestorAutocomplete from './RequestorAutocomplete';

const COMPLEXITIES = [
  ['minor', 'Minor'],
  ['major', 'Major'],
  ['complex', 'Complex'],
];

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">{label}</p>
      {children}
    </div>
  );
}

const inputCls = 'w-full h-11 px-4 bg-white border border-ch-border rounded-ch outline-none font-body text-body text-ch-main';

export default function Step1CaseInfo({ form, setForm, requestors, isSpecialRequestor, onNext }) {
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="bg-white rounded-ch shadow-ch p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">1</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">Case Information</p>
          <p className="font-body text-body text-ch-main opacity-60">
            Input The Case Information - <span className="text-ch-red">All Are Required Unless Labeled Optional</span>
          </p>
        </div>
      </div>

      <Field label="Case Number">
        <input className={inputCls} value={form.caseNum} onChange={(e) => set({ caseNum: e.target.value })} />
      </Field>
      <Field label="Account Number">
        <input className={inputCls} value={form.accountNum} onChange={(e) => set({ accountNum: e.target.value })} />
      </Field>
      <Field label="Amend Type">
        <input className={inputCls} value={form.amendType} onChange={(e) => set({ amendType: e.target.value })} />
      </Field>
      <Field label="Requester Name">
        <RequestorAutocomplete value={form.customerName} onChange={(v) => set({ customerName: v })} requestors={requestors} isSpecial={isSpecialRequestor} />
      </Field>
      <Field label="Requester Email">
        <input type="email" className={inputCls} value={form.customerEmail} onChange={(e) => set({ customerEmail: e.target.value })} />
      </Field>
      <Field label="Business Name">
        <input className={inputCls} value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} />
      </Field>
      <Field label="Entity Designations (Optional Field)">
        <input className={inputCls} placeholder="Inc" value={form.entityDesignation} onChange={(e) => set({ entityDesignation: e.target.value })} />
      </Field>

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Complexity</p>
        <div className="flex gap-2.5">
          {COMPLEXITIES.map(([v, l]) => (
            <button
              key={v}
              onClick={() => set({ _caseComplexity: v })}
              className={`flex-1 h-11 rounded-ch font-body text-body border ${form._caseComplexity === v ? 'border-ch-main bg-ch-secondary' : 'border-ch-border bg-white'} text-ch-main`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Checklist</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 h-11 px-4 bg-white border border-ch-border rounded-ch font-body text-body text-ch-main">
            <input type="checkbox" checked={form.inProgressSalesforce} onChange={(e) => set({ inProgressSalesforce: e.target.checked })} />
            In Progress Salesforce
          </label>
          <label className="flex items-center gap-2.5 h-11 px-4 bg-white border border-ch-border rounded-ch font-body text-body text-ch-main">
            <input type="checkbox" checked={form.addedYourName} onChange={(e) => set({ addedYourName: e.target.checked })} />
            Added Your Name?
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onNext} className="flex items-center justify-center w-11 h-11 rounded-ch bg-ch-main text-white">
          <Icon name="login" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}
