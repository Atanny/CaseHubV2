import AuthLogo from './AuthLogo';
import Divider from '../ui/Divider';

/**
 * Outer card shell shared by the Login and Sign Up pages — matches the
 * Figma "Case Information" frame: full-page centered card, 2px main-color
 * border, secondary background, logo, tagline, and a divider before the
 * form content.
 */
export default function AuthCard({ width = 461, children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-ch-background p-5">
      <div
        className="flex flex-col items-center gap-2.5 bg-ch-secondary border-2 border-ch-main rounded-ch shadow-ch p-10 w-full"
        style={{ maxWidth: width }}
      >
        <AuthLogo />
        <Divider className="!bg-ch-background h-[2px]" />
        {children}
      </div>
    </div>
  );
}
