import { useRouter } from 'next/router';
import Icon from './Icon';
import Button from './Button';
import { BREAK_OPTIONS } from '../constants/navigation';
import { useSession } from '../hooks/useSession';
import { ROUTES } from '../constants/routes';

/**
 * The row of break-timer buttons + Log Out shown on the right side of every
 * page header, matching the Figma header exactly: white pill-ish buttons
 * with no visible border (just a soft shadow), bold uppercase labels, and
 * a solid red "Log Out" button in sentence case with a trailing icon.
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
          icon={<Icon name={opt.icon} size={18} color="#40513B" />}
          iconPosition="left"
          disabled={activeBreakMins != null && activeBreakMins !== opt.mins}
          onClick={() => onStartBreak?.(opt)}
          className="!border-transparent"
        >
          {opt.label}
        </Button>
      ))}
      <Button variant="danger" uppercase={false} onClick={handleLogout} icon={<Icon name="logout" size={18} color="#fff" />}>
        Log Out
      </Button>
    </>
  );
}
