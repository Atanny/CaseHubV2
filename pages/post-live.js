import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import RequireAuth from '../components/layout/RequireAuth';
import PostLivePage from '../components/pages/PostLive';

export default function PostLiveRoute() {
  return <RequireAuth><PostLiveInner/></RequireAuth>;
}

function PostLiveInner() {
  const {
    addCase, updateCase, updateDraft, setFormActivePersist, setFormInFields, setPage,
    allCases, drafts, saveDraft, deleteDraft, archiveDraft, user, playEndAlarm,
    specialRequestors, alarmMins, qaLimit, globalTimeIn, timedIn, breakTimer, openHourActive,
    doTimeIn, doTimeOut, doTimerReset, sessionDbId, sessionLog, addSessionLog, setSessionLog,
    closeWithOutcome, closeSessionLog, clearSessionLog, startBreak, setCancelBreakConfirm,
    startOpenHour, setCancelOpenHourConfirm, resumeFormTick,
  } = useApp();
  return (
    <Layout>
      <PostLivePage
        onSaveCase={addCase} onUpdateCase={updateCase} onUpdateDraft={updateDraft}
        onFormActive={setFormActivePersist} onFormInFields={setFormInFields}
        onMinimise={()=>{setPage("postlive"); if(typeof window!=="undefined") localStorage.setItem("ch_page","postlive");}}
        allSavedCases={allCases} dbDrafts={drafts} onSaveDraft={saveDraft} onDeleteDraft={deleteDraft}
        onArchiveDraft={archiveDraft} user={user} onTimerEnd={playEndAlarm} specialRequestors={specialRequestors}
        alarmMins={alarmMins} qaAlarmMins={qaLimit} globalTimeIn={globalTimeIn} timedIn={timedIn}
        breakActive={!!breakTimer||openHourActive} breakTimer={breakTimer||null} openHourActive={openHourActive}
        onTimeIn={doTimeIn} onTimeOut={doTimeOut} onTimerReset={doTimerReset} sessionDbId={sessionDbId}
        sessionLog={sessionLog} addSessionLog={addSessionLog} setSessionLog={setSessionLog}
        closeWithOutcome={closeWithOutcome} closeSessionLog={closeSessionLog} clearSessionLog={clearSessionLog}
        onStartBreak={startBreak} onStartBreakFull={(label,mins)=>startBreak(label,mins,true)}
        onStopBreak={()=>setCancelBreakConfirm(true)} onStartOpenHour={startOpenHour}
        onStopOpenHour={()=>setCancelOpenHourConfirm(true)} resumeTick={resumeFormTick}/>
    </Layout>
  );
}
