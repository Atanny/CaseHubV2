/**
 * PageHeader — matches the Figma "Header" component: a left column with an
 * H4 title + subtitle, and a right-aligned row for quick actions (break
 * buttons, log out, etc). `actions` is a node so each page controls exactly
 * which buttons appear.
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between w-full rounded-ch">
      <div className="flex flex-col items-start text-ch-main">
        <h1 className="font-heading font-bold text-h4 uppercase">{title}</h1>
        {subtitle && <p className="font-body text-body capitalize">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
