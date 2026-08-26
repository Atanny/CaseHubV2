import Icon from './Icon';

export default function ModeCard({ icon, title, subtitle, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between gap-3 flex-1 min-w-[220px] bg-white rounded-ch shadow-ch p-5 text-left hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-11 h-11 rounded-ch bg-ch-secondary shrink-0">
          <Icon name={icon} size={20} color="#40513B" />
        </span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">{title}</p>
          <p className="font-body text-body text-ch-main opacity-60">{subtitle}</p>
        </div>
      </div>
      <Icon name="chevron" size={18} color="#40513B" className="-rotate-90 shrink-0" />
    </button>
  );
}
