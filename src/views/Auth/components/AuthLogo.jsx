export function AuthLogo() {
  return (
    <>
      <div className="auth-logo">
        <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
          <path d="M6 24a11 11 0 1 1 20 0" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round"/>
          <path d="M16 19l6-8" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round"/>
          <circle cx="16" cy="19" r="2.4" fill="var(--accent)"/>
        </svg>
        <div className="auth-logo-text">CASEHUB</div>
      </div>
      <div className="auth-tagline">Make Your Work Faster And Efficient</div>
    </>
  );
}
