import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import Dashboard from '../components/pages/Dashboard';

export default function DashboardRoute() {
  return <RequireAuth><DashboardInner/></RequireAuth>;
}

function DashboardInner() {
  const { allCases, setPage, specialRequestors, addRequestor, removeRequestor, user, announcements, archivedDrafts } = useApp();
  return (
    <Layout>
      <Dashboard savedCases={allCases} setPage={setPage} specialRequestors={specialRequestors}
        addRequestor={addRequestor} removeRequestor={removeRequestor} user={user}
        announcements={announcements} archivedDrafts={archivedDrafts}/>
    </Layout>
  );
}
