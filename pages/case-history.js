import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import CaseHistory from '../components/pages/CaseHistory';

export default function CaseHistoryRoute() {
  return <RequireAuth><Inner/></RequireAuth>;
}
function Inner() {
  const { allCases, updateCase, deleteCase } = useApp();
  return <Layout><CaseHistory cases={allCases} onUpdate={updateCase} onDelete={deleteCase}/></Layout>;
}
