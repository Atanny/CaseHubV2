import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import Icon from '../components/icons/Icon';

// Root route — redirects to /dashboard (or wherever the user last was),
// matching the original single-page app's default "page" of "dashboard".
export default function Home() {
  const router = useRouter();
  const { sessionChecked, user } = useApp();

  useEffect(() => {
    if (!sessionChecked) return;
    if (!user) { router.replace('/dashboard'); return; } // dashboard route itself shows Login when logged out
    const saved = typeof window !== "undefined" ? localStorage.getItem("ch_page") : null;
    const routeMap = {
      dashboard:'/dashboard', postlive:'/post-live', history:'/case-history', sessions:'/session-log',
      archives:'/archived-cases', announcements:'/announcements', links:'/quick-links',
      filenames:'/file-name-generator', profile:'/profile',
    };
    router.replace(routeMap[saved] || '/dashboard');
  }, [sessionChecked, user]);

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)",flexDirection:"column",gap:16}}>
      <div style={{animation:"float 1.5s ease-in-out infinite"}}><Icon name="loading" size={52} color="var(--accent)"/></div>
      <div style={{color:"var(--muted)",fontSize:14,fontFamily:"Poppins,sans-serif"}}>Loading CaseHub...</div>
    </div>
  );
}
