import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import FileNameGeneratorPage from '../components/pages/FileNameGenerator';

export default function FileNameGeneratorRoute() {
  return <RequireAuth><Layout><FileNameGeneratorPage/></Layout></RequireAuth>;
}
