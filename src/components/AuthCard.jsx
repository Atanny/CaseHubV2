import Icon from './Icon';
import Divider from './Divider';

/** Logo + tagline shown at the top of both auth cards. */
function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <div className="flex items-center justify-center gap-2">
        <span className="flex items-center justify-center w-[57px] h-[57px] rounded-full bg-ch-main text-white">
          <Icon name="timer" size={30} color="#fff" />
        </span>
        <p className="font-heading font-bold text-[32px] uppercase text-ch-main leading-none">CaseHub</p>
      </div>
      <p className="font-body text-body capitalize text-ch-main">Make your work faster and efficient</p>
    </div>
  );
}

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
