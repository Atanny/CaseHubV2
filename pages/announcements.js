import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import AnnouncementsPage from '../components/pages/Announcements';

export default function AnnouncementsRoute() {
  return <RequireAuth><Inner/></RequireAuth>;
}
function Inner() {
  const { announcements, addAnnouncement, updateAnnouncement, removeAnnouncement, user } = useApp();
  return <Layout><AnnouncementsPage announcements={announcements} addAnnouncement={addAnnouncement} updateAnnouncement={updateAnnouncement} removeAnnouncement={removeAnnouncement} user={user}/></Layout>;
}
