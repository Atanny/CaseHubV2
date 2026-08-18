import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import ProfilePage from '../components/pages/Profile';

export default function ProfileRoute() {
  return <RequireAuth><Inner/></RequireAuth>;
}
function Inner() {
  const {
    user, setUser, logout, timerLimit, saveTimerLimit, qaLimit, saveQaLimit,
    shiftStartTime, saveShiftStartTime, shiftStartWarnMins, saveShiftStartWarnMins,
    shiftEndTime, saveShiftEndTime, shiftWarnMins, saveShiftWarnMins,
    specialRequestors, addRequestor, removeRequestor,
  } = useApp();
  return (
    <Layout>
      <ProfilePage user={user} setUser={setUser} onLogout={logout} timerLimit={timerLimit}
        saveTimerLimit={saveTimerLimit} qaLimit={qaLimit} saveQaLimit={saveQaLimit}
        shiftStartTime={shiftStartTime} saveShiftStartTime={saveShiftStartTime}
        shiftStartWarnMins={shiftStartWarnMins} saveShiftStartWarnMins={saveShiftStartWarnMins}
        shiftEndTime={shiftEndTime} saveShiftEndTime={saveShiftEndTime}
        shiftWarnMins={shiftWarnMins} saveShiftWarnMins={saveShiftWarnMins}
        specialRequestors={specialRequestors} addRequestor={addRequestor} removeRequestor={removeRequestor}/>
    </Layout>
  );
}
