import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import ArchivePage from '../components/pages/ArchivedCases';

export default function ArchivedCasesRoute() {
  return <RequireAuth><Inner/></RequireAuth>;
}
function Inner() {
  const { archivedDrafts, setArchivedDrafts } = useApp();
  return (
    <Layout>
      <ArchivePage archivedDrafts={archivedDrafts} onDelete={async(id)=>{
        try{await fetch(`/api/archived-drafts/${id}`,{method:"DELETE"});setArchivedDrafts(a=>a.filter(x=>x._id!==id));}catch(e){console.error(e);}
      }}/>
    </Layout>
  );
}
