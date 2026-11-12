import { WIZARD_PAGES } from '@/config/wizard'
import { cls } from '@/utils/classNames'

export function WizardStepBar({ activePage, goToPage, isSC, pageDone={}, pageReachable={} }) {
  return (
    <div className="wizard-bar">
      {WIZARD_PAGES.map((p,i)=>{
        const label = typeof p.label==="function" ? p.label(isSC) : p.label;
        const done = !!pageDone[p.page];
        const active = activePage===p.page;
        const reachable = !!pageReachable[p.page];
        return (
          <button key={p.page}
            className={cls("wizard-bar-item", done&&"done", active&&"active", !reachable&&"disabled")}
            disabled={!reachable}
            onClick={()=>reachable&&goToPage(p.page)}>
            <span className="wizard-bar-circle">{done?"✓":<span/>}</span>
            <span className="wizard-bar-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
