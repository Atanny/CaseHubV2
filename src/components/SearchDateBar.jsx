import Icon from './Icon';

/** Search field + date field, as two separate pills (matches Figma exactly — not one combined bar). */
export default function SearchDateBar({ placeholder, search, onSearch, date, onDate }) {
  return (
    <div className="flex items-stretch gap-3 w-full flex-wrap">
      <div className="flex items-center gap-3 bg-white rounded-ch-lg shadow-ch h-[55px] px-5 flex-1 min-w-[260px] max-w-[791px]">
        <Icon name="search" size={18} color="#40513B" />
        <input
          className="flex-1 min-w-0 outline-none font-body text-body text-ch-main placeholder:opacity-50"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3 bg-white rounded-ch-lg shadow-ch h-[55px] px-5 w-[220px] shrink-0">
        <input
          type="date"
          className="flex-1 min-w-0 outline-none font-body text-body text-ch-main bg-transparent"
          value={date}
          onChange={(e) => onDate(e.target.value)}
        />
        <Icon name="calendar" size={18} color="#40513B" />
      </div>
    </div>
  );
}
