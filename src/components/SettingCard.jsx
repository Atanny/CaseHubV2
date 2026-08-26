import Card from './Card';
import Button from './Button';

/** A settings card: title, description, one or two inputs, a Save button, and a "currently" readout. */
export default function SettingCard({ title, description, children, onSave, current, extra }) {
  return (
    <Card className="w-full">
      <p className="font-heading font-bold text-h6 text-ch-main mb-1">{title}</p>
      <p className="font-body text-body text-ch-main opacity-60 mb-4">{description}</p>
      <div className="flex items-center gap-3 flex-wrap">
        {children}
        <Button variant="primary" size="sm" onClick={onSave} className="ml-auto">
          Save
        </Button>
        {extra}
      </div>
      {current && <p className="font-body text-body text-ch-main opacity-60 mt-2">{current}</p>}
    </Card>
  );
}
