import Button from './Button';
import CaseTypeBadge from './CaseTypeBadge';

export default function SuspendedCaseRow({ draft, onResume, onArchive }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-t border-ch-secondary first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="font-body font-bold text-body text-ch-main">
            {draft.caseNum || 'Untitled'} - {draft.accountNum || '—'}
          </p>
          <CaseTypeBadge caseType={draft._mode} complexity={draft._caseComplexity} />
        </div>
        <p className="font-body text-body text-ch-main opacity-60">
          {draft.amendType || 'No amend type'} - {draft.draftAt}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={() => onResume(draft)}>
          Edit
        </Button>
        <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => onArchive(draft)}>
          Archive Case
        </Button>
      </div>
    </div>
  );
}
