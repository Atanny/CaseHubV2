export default function AuthLogo() {
  return (
    <div className="auth-logo">
      <div className="auth-logo-icon">
        <svg width="40" height="40" viewBox="0 0 30 30" fill="none">
          <rect x="2" y="2" width="11" height="11" fill="var(--accent)" opacity=".9"/>
          <rect x="17" y="2" width="11" height="11" fill="var(--accent)" opacity=".5"/>
          <rect x="2" y="17" width="11" height="11" fill="var(--accent)" opacity=".5"/>
          <rect x="17" y="17" width="11" height="11" fill="var(--accent)" opacity=".2"/>
        </svg>
      </div>
      <div className="auth-logo-text">Case<span>Hub</span></div>
    </div>
  );
}

