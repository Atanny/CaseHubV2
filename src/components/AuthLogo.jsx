import Icon from './Icon';

/** Logo + tagline shown at the top of both auth cards. */
export default function AuthLogo() {
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
