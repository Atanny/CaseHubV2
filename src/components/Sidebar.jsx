import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from './Icon';
import Badge from './Badge';
import { cls } from '../utils/cls';
import { NAV_GROUPS } from '../constants/navigation';
import { ROUTES } from '../constants/routes';

/**
 * NavItem — a single sidebar entry. Shows an icon, an on-hover tooltip label
 * (matching the Figma "Navigation Item v2" component), an active-state left
 * rail, and an optional count badge.
 */
function NavItem({ item, isActive, count }) {
  return (
    <Link
      href={item.href}
      className={cls(
        'group relative flex items-center justify-center gap-2.5 w-full px-2.5 py-[15px] rounded-ch',
        'border-b border-ch-border/50 transition-colors',
        isActive && 'bg-white shadow-ch rounded-l-[20px] rounded-r-none'
      )}
    >
      {isActive && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 h-[29px] w-[3px] rounded-l-[10px] bg-ch-main" />
      )}
      <Icon name={item.icon} size={22} color={isActive ? '#40513B' : '#40513B99'} />
      {!!count && (
        <span className="absolute top-1.5 right-1.5">
          <Badge>{count}</Badge>
        </span>
      )}
      <span
        className={cls(
          'pointer-events-none absolute left-[37px] top-1/2 -translate-y-1/2 z-10',
          'whitespace-nowrap bg-ch-secondary text-ch-main text-badge font-label uppercase',
          'px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

/**
 * Sidebar — the 84px navigation rail. Structure and styling are pixel-matched
 * to the Figma "Sidebar v2" component (logo, Work group, Tools group, Links
 * group, and bottom actions).
 *
 * counts / links / onLogout are passed in by AppLayout so this component
 * stays presentational and easy to reuse/test.
 */
export default function Sidebar({ counts = {}, customLinks = [], onLogout }) {
  const router = useRouter();

  return (
    <aside className="flex flex-col items-center w-[84px] shrink-0 self-stretch bg-white border-2 border-white pt-[60px] pb-5 px-2.5 sticky top-0 z-10">
      <div className="flex flex-col items-center gap-5 w-16 flex-1">
        <Link href={ROUTES.dashboard} className="flex items-center justify-center w-16 h-16 rounded-full bg-ch-main text-white font-heading font-bold text-lg">
          CH
        </Link>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-[5px] items-center w-full">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={router.pathname === item.href}
                count={counts[item.id]}
              />
            ))}
          </div>
        ))}

        {customLinks.length > 0 && (
          <div className="flex flex-col gap-[5px] items-center w-full">
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Links</p>
            {customLinks.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-full px-2.5 py-[15px] rounded-ch border-b border-ch-border/50"
              >
                <span className="text-lg">{l.icon}</span>
                <span className="pointer-events-none absolute left-[37px] top-1/2 -translate-y-1/2 whitespace-nowrap bg-ch-secondary text-ch-main text-badge font-label uppercase px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {l.title}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-ch bg-ch-red border border-ch-red shadow-ch"
        aria-label="Log out"
      >
        <Icon name="logout" size={22} color="#FFFFFF" />
      </button>
    </aside>
  );
}
