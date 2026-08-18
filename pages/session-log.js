import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import SessionLogPage from '../components/pages/SessionLog';

export default function SessionLogRoute() {
  return <RequireAuth><Inner/></RequireAuth>;
}
function Inner() {
  const { user, sessionRefreshKey } = useApp();
  return <Layout><SessionLogPage user={user} refreshKey={sessionRefreshKey}/></Layout>;
}
