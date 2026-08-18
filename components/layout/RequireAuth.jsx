import { useApp } from '../../context/AppContext';
import LoginPage from '../auth/LoginPage';
import SignupPage from '../auth/SignupPage';
import Icon from '../icons/Icon';

// Gates a route behind session-check + login, exactly matching the original
// App()'s inline behavior — no CSS/props changed, just relocated so every
// route file doesn't repeat this block.
export default function RequireAuth({ children }) {
  const { sessionChecked, user, authPage, setAuthPage, setUser } = useApp();

  if (!sessionChecked) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)",flexDirection:"column",gap:16}}>
        <div style={{animation:"float 1.5s ease-in-out infinite"}}><Icon name="loading" size={52} color="var(--accent)"/></div>
        <div style={{color:"var(--muted)",fontSize:14,fontFamily:"Poppins,sans-serif"}}>Loading CaseHub...</div>
      </div>
    );
  }
  if (!user) {
    return authPage === "signup"
      ? <SignupPage onSignup={(u)=>setUser(u)} goLogin={()=>setAuthPage("login")}/>
      : <LoginPage onLogin={(u)=>setUser(u)} goSignup={()=>setAuthPage("signup")}/>;
  }
  return children;
}
