import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import LinksPage from '../components/pages/QuickLinks';

export default function QuickLinksRoute() {
  return <RequireAuth><Inner/></RequireAuth>;
}
function Inner() {
  const { links, setLinks, addLink, updateLink, removeLink } = useApp();
  return <Layout><LinksPage links={links} setLinks={setLinks} addLink={addLink} updateLink={updateLink} removeLink={removeLink}/></Layout>;
}
