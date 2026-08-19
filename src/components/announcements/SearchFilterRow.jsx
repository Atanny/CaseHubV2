import Icon from '../icons/Icon';
import Pill from '../ui/Pill';
import { FILTER_OPTIONS } from './badgeHelpers';

/** Search input (left) + filter pills (right), matching the Figma search row. */
export default function SearchFilterRow({ search, setSearch, filter, setFilter }) {
  return (
    <div className="flex items-center justify-between gap-3 w-full flex-wrap">
      <div className="flex items-center gap-2.5 bg-white rounded-ch shadow-ch px-4 h-[45px] flex-1 min-w-[220px] max-w-[360px]">
        <Icon name="search" size={16} color="#40513B" />
        <input
          className="flex-1 min-w-0 outline-none font-body text-body text-ch-main placeholder:opacity-50"
          placeholder="Search Announcement"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map(([v, l]) => (
          <Pill key={v} active={filter === v} onClick={() => setFilter(v)}>
            {l}
          </Pill>
        ))}
      </div>
    </div>
  );
}
