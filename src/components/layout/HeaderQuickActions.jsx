import { useRouter } from 'next/router';
import Icon from '../icons/Icon';
import Button from '../ui/Button';
import { BREAK_OPTIONS } from '../../constants/navigation';
import { useSession } from '../../hooks/useSession';
import { ROUTES } from '../../constants/routes';

/**
 * The row of break-timer buttons + Log Out shown on the right side of every
 * page header (matches the Figma "Header" > right column). Break-timer
 * behavior (starting/ending a break) is wired up by AppLayout in a later
 * milestone — for now the break buttons are presentational and call the
 * handler they're given. Log Out works today via useSession, same as the
 * sidebar's logout button.
 */
export default function HeaderQuickActions({ activeBreakMins, onStartBreak, onLogout }) {
  const router = useRouter();
  const { signOut } = useSession();

  function handleLogout() {
    if (onLogout) return onLogout();
    signOut();
    router.push(ROUTES.login);
  }

  return (
    <>
      {BREAK_OPTIONS.map((opt) => (
        <Button
          key={opt.mins}
          variant="outline"
          size="sm"
          icon={<Icon name={opt.icon} size={20} color="#40513B" />}
          iconPosition="left"
          disabled={activeBreakMins != null && activeBreakMins !== opt.mins}
          onClick={() => onStartBreak?.(opt)}
          className="uppercase text-badge font-label whitespace-nowrap"
        >
          {opt.label}
        </Button>
      ))}
      <Button variant="danger" onClick={handleLogout} icon={<Icon name="logout" size={20} color="#fff" />}>
        Log Out
      </Button>
    </>
  );
}
