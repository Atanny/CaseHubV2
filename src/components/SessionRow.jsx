import Button from './Button';
import CaseTypeBadge from './CaseTypeBadge';

const COLS = ['Case Type', 'Case Number', 'Account Number', 'Combine Tracker', 'QA Checklist', 'Status', 'Action'];

export function SessionRowHeader() {
  return (
    <div className="grid grid-cols-7 gap-2.5 px-4 py-2.5 rounded-ch">
      {COLS.map((c) => (
        <p key={c} className="text-[10px] font-label font-bold uppercase text-ch-main text-center">
          {c}
        </p>
      ))}
    </div>
  );
}

export default function SessionRow({ row, onView }) {
  const statusDone = !!row.ended_at;
  return (
    <div className="grid grid-cols-7 gap-2.5 items-center px-4 py-2.5 bg-ch-secondary border border-ch-border rounded-ch">
      <div className="flex justify-center">
        <CaseTypeBadge caseType={row.case_type} complexity={row.complexity} />
      </div>
      <p className="font-body font-bold text-body text-ch-main text-center">{row.case_num || '—'}</p>
      <p className="font-body font-bold text-body text-ch-main text-center">{row.account_num || '—'}</p>
      <p className="font-body text-body text-ch-main text-center">{row.combined_tracker_minutes ? `${row.combined_tracker_minutes} Minutes` : '—'}</p>
      <p className="font-body text-body text-ch-main text-center">{row.qa_checklist_minutes ? `${row.qa_checklist_minutes} Minutes` : '—'}</p>
      <p className={`font-body font-bold text-body text-center ${statusDone ? 'text-green-700' : 'text-ch-red'}`}>{statusDone ? 'Completed' : 'Suspended'}</p>
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={() => onView(row)}>
          View Case
        </Button>
      </div>
    </div>
  );
}
