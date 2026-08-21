/** Numbered form section — matches the step-by-step structure of the legacy Post-Live form. */
export default function StepCard({ n, title, hint, children }) {
  return (
    <div className="bg-white rounded-ch shadow-ch p-5 w-full flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-ch-main text-white text-[11px] font-bold shrink-0">{n}</span>
        <p className="font-heading font-bold text-h6 text-ch-main">{title}</p>
      </div>
      {hint && <p className="font-body text-body text-ch-main opacity-60 -mt-2">{hint}</p>}
      {children}
    </div>
  );
}
