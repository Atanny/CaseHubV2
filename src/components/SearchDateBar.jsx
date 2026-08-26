import Icon from './Icon';

/** The search+date field bar used on Case History, Archived Cases, and Session Log. */
export default function SearchDateBar({ placeholder, search, onSearch, date, onDate }) {
  return (
    <div className="flex items-stretch bg-white rounded-ch shadow-ch w-full max-w-[791px] h-[55px] overflow-hidden">
      <div className="flex items-center gap-2 flex-1 px-6">
        <Icon name="search" size={20} color="#40513B" />
        <input
          className="flex-1 min-w-0 outline-none font-body text-body text-ch-main placeholder:opacity-50"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 px-6 border-l border-ch-secondary">
        <input
          type="date"
          className="outline-none font-body text-body text-ch-main bg-transparent"
          value={date}
          onChange={(e) => onDate(e.target.value)}
        />
        <Icon name="calendar" size={20} color="#40513B" />
      </div>
    </div>
  );
}
