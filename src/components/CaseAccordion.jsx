import Icon from './Icon';
import Button from './Button';
import Divider from './Divider';
import CaseTypeBadge from './CaseTypeBadge';
import CaseSummaryCard from './CaseSummaryCard';
import CaseDetailCard from './CaseDetailCard';
import { cls } from '../utils/cls';

export default function CaseAccordion({ caseRecord, entryLabel, isOpen, onToggle, onDownload, onEdit, onImageClick }) {
  const c = caseRecord;
  return (
    <div className="bg-white rounded-ch shadow-ch p-5 w-full flex flex-col gap-2.5">
      <button onClick={onToggle} className="flex items-center justify-between gap-3 w-full text-left">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="font-heading font-bold text-h6 text-ch-main uppercase">
              {c.caseNum} - {c.accountNum}
            </p>
            <CaseTypeBadge caseType={c._mode} complexity={c._caseComplexity} />
          </div>
          <p className="font-body text-body text-ch-main capitalize">
            {c.amendType || 'No amend type'} - {c.savedAt}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={onDownload}>
            Download for Backup
          </Button>
          <Button variant="primary" size="sm" onClick={onEdit}>
            Edit Case
          </Button>
          <button onClick={onToggle} className="w-6 h-6 flex items-center justify-center">
            <Icon name="chevron" size={24} color="#40513B" className={cls('transition-transform', isOpen ? 'rotate-180' : '')} />
          </button>
        </div>
      </button>

      {isOpen && (
        <>
          <Divider tone="secondary" />
          <div className="flex gap-2.5 flex-wrap w-full">
            <CaseSummaryCard caseRecord={c} entryLabel={entryLabel} />
            <CaseDetailCard caseRecord={c} onImageClick={onImageClick} />
          </div>
        </>
      )}
    </div>
  );
}
