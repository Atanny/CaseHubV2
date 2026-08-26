import Divider from './Divider';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-label font-bold uppercase text-ch-main">{label}</p>
      <p className="font-body text-body text-ch-main capitalize">{value || '—'}</p>
    </div>
  );
}

/** Left card of an expanded case: identifying info (2 sub-columns) + the full entry text below a divider. */
export default function CaseSummaryCard({ caseRecord, entryLabel }) {
  const c = caseRecord;
  const entries = (c.entries || []).filter((e) => e.notes || e.note || e.number || e.clarification);

  return (
    <div className="bg-ch-secondary border border-ch-border rounded-[5px] shadow-ch p-5 flex flex-col gap-2.5 w-full md:w-[380px] shrink-0">
      <div className="flex gap-6">
        <div className="flex flex-col gap-2.5 w-[172px]">
          <Field label="Account Number" value={c.accountNum} />
          <Field label="Case Number" value={c.caseNum} />
          <Field label="Amend Type" value={c.amendType} />
        </div>
        <div className="flex flex-col gap-2.5 w-[172px]">
          <Field label="Customer Name" value={c.customerName} />
          <Field label="Customer Email" value={c.customerEmail} />
          <Field label="Business Name" value={c.businessName} />
        </div>
      </div>
      <Divider className="!bg-white !h-[2px]" />
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] font-label font-bold uppercase text-ch-main">{entryLabel}</p>
        {entries.length === 0 && <p className="font-body text-body text-ch-main opacity-50">No entries recorded.</p>}
        {entries.map((e, i) => (
          <p key={i} className="font-body text-body text-ch-main whitespace-pre-wrap">
            {e.number && `#${e.number}: `}
            {e.notes || e.note}
            {e.clarification && <>{'\n\n'}Clarification: {e.clarification}</>}
          </p>
        ))}
      </div>
    </div>
  );
}
