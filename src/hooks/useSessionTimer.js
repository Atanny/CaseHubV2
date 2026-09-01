import { useEffect, useRef, useState } from 'react';

const LS = {
  timedIn: 'ch_timed_in',
  timeIn: 'ch_timein',
  sessionLog: 'ch_session_log',
  sessionDbId: 'ch_session_db_id',
};

function readLS(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}
function readLog() {
  try {
    const raw = JSON.parse(readLS(LS.sessionLog, '[]'));
    return raw.filter((e) => e && typeof e === 'object' && typeof e.id === 'number' && typeof e.startedAt === 'number' && typeof e.status === 'string');
  } catch {
    return [];
  }
}

/**
 * Time In / Time Out + session log, ported from the legacy app's
 * AppContext.jsx (doTimeIn/doTimeOut/addSessionLog) — same localStorage
 * keys, same entry shapes, same /api/sessions contract, so this session
 * log lines up with what Session Log already reads.
 *
 * Entry shape: { id, status, note, startedAt, endedAt, outcome, endNote }
 * status values used by the legacy flow: "Time In", "Ongoing",
 * "Site Comment", "Inbound Email", "Break", "Time Out".
 */
export function useSessionTimer(userEmail) {
  const appLoadTime = useRef(Date.now()).current;
  const [timedIn, setTimedIn] = useState(() => readLS(LS.timedIn, null) === '1');
  const [globalTimeIn, setGlobalTimeIn] = useState(() => {
    const v = readLS(LS.timeIn, null);
    return v ? parseInt(v, 10) : null;
  });
  const [sessionDbId, setSessionDbId] = useState(() => readLS(LS.sessionDbId, null));
  const [sessionLog, setSessionLog] = useState(() => readLog());
  const saveLogTimer = useRef(null);

  // Safety sync — restore timedIn from localStorage in case state was lost on remount.
  useEffect(() => {
    if (readLS(LS.timedIn, null) === '1') setTimedIn(true);
  }, []);

  // Debounced session-log persistence to the DB whenever it changes.
  useEffect(() => {
    if (!sessionDbId || !userEmail || !sessionLog.length) return;
    if (saveLogTimer.current) clearTimeout(saveLogTimer.current);
    saveLogTimer.current = setTimeout(() => {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_log', session_id: sessionDbId, email: userEmail, log_data: sessionLog }),
      }).catch(() => {});
    }, 2000);
    return () => saveLogTimer.current && clearTimeout(saveLogTimer.current);
  }, [sessionLog, sessionDbId, userEmail]);

  function persistLog(next) {
    if (typeof window !== 'undefined') localStorage.setItem(LS.sessionLog, JSON.stringify(next));
    setSessionLog(next);
  }

  function doTimeIn() {
    const now = Date.now();
    setTimedIn(true);
    setGlobalTimeIn(now);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS.timedIn, '1');
      localStorage.setItem(LS.timeIn, String(now));
    }
    const timeInEntry = { id: appLoadTime, status: 'Time In', note: 'Session started', startedAt: appLoadTime, endedAt: now, outcome: '', endNote: '' };
    const ongoingEntry = { id: now + 1, status: 'Ongoing', note: 'Waiting for amend type', startedAt: now, endedAt: null, outcome: '', endNote: '' };
    persistLog([...sessionLog, timeInEntry, ongoingEntry]);

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'time_in', email: userEmail }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.id) {
          setSessionDbId(d.id);
          if (typeof window !== 'undefined') localStorage.setItem(LS.sessionDbId, d.id);
        }
      })
      .catch(() => {});
  }

  function doTimeOut() {
    const now = Date.now();
    const closed = sessionLog.map((e, i) => (i === sessionLog.length - 1 && !e.endedAt ? { ...e, endedAt: now, endNote: '' } : e));
    const timeOutEntry = { id: now + 2, status: 'Time Out', note: 'Manual time-out', startedAt: now, endedAt: now, outcome: '', endNote: '' };
    const finalLog = [...closed, timeOutEntry];
    persistLog(finalLog);

    if (sessionDbId) {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'time_out', session_id: sessionDbId, email: userEmail }),
      })
        .then(() => {
          const caseEntries = finalLog.filter((e) => e.status === 'Site Comment' || e.status === 'Inbound Email');
          return Promise.all(
            caseEntries.map((e) =>
              fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'log_case',
                  session_id: sessionDbId,
                  email: userEmail,
                  case_num: e.caseNum || null,
                  case_type: e.status === 'Site Comment' ? 'siteComment' : 'inbound',
                  note: e.note || '',
                }),
              }).catch(() => {})
            )
          );
        })
        .catch(() => {});
    }

    setTimeout(() => persistLog([]), 400);

    setTimedIn(false);
    setGlobalTimeIn(null);
    setSessionDbId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LS.timedIn);
      localStorage.removeItem(LS.timeIn);
      localStorage.removeItem(LS.sessionDbId);
    }
  }

  /**
   * addSessionLog variants (matches legacy exactly):
   *  - addSessionLog("Site Comment", "", "renameOngoing") — rename last open
   *    Ongoing to the given status, keep it open (used when starting a case
   *    or a break from the sidebar).
   *  - addSessionLog("Ongoing", "") — close last open entry, add fresh Ongoing.
   */
  function addSessionLog(status, note = '', endNote = '') {
    const now = Date.now();
    if (endNote === 'renameOngoing') {
      const lastOngoingIdx = sessionLog.map((e) => e.status).lastIndexOf('Ongoing');
      if (lastOngoingIdx !== -1 && !sessionLog[lastOngoingIdx].endedAt) {
        persistLog(sessionLog.map((e, i) => (i === lastOngoingIdx ? { ...e, status, note } : e)));
        return;
      }
      persistLog([...sessionLog, { id: now, status, note, startedAt: now, endedAt: null, outcome: '', endNote: '' }]);
      return;
    }
    const entry = { id: now, status, note, startedAt: now, endedAt: null, outcome: '', endNote: '' };
    const closed = sessionLog.map((e, i) => (i === sessionLog.length - 1 && !e.endedAt ? { ...e, endedAt: now } : e));
    persistLog([...closed, entry]);
  }

  /** Close the last open entry and stamp an outcome (Case Saved / Draft Saved / Cancelled). */
  function closeWithOutcome(outcome, caseNum = '') {
    const now = Date.now();
    persistLog(sessionLog.map((e, i) => (i === sessionLog.length - 1 && !e.endedAt ? { ...e, endedAt: now, outcome, caseNum: caseNum || e.caseNum || '' } : e)));
  }

  return { timedIn, globalTimeIn, sessionLog, sessionDbId, doTimeIn, doTimeOut, addSessionLog, closeWithOutcome };
}
