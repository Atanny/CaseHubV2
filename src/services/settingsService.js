const KEYS = {
  ctLimit: 'ch_ct_limit',
  qaLimit: 'ch_qa_limit',
  shiftStartTime: 'ch_shift_start_time',
  shiftStartWarnMins: 'ch_shift_start_warn',
  shiftEndTime: 'ch_shift_end_time',
  shiftWarnMins: 'ch_shift_warn',
};

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * These settings never touch the database in the legacy app either — they're
 * per-browser preferences read by the break-timer/shift-alarm system. Kept
 * here so Profile can manage them today even though the timer UI that
 * consumes them ships in its own milestone.
 */
export const settingsService = {
  getAll() {
    if (typeof window === 'undefined') return this.defaults();
    return {
      timerLimit: clampInt(localStorage.getItem(KEYS.ctLimit), 1, 240, 30),
      qaLimit: clampInt(localStorage.getItem(KEYS.qaLimit), 1, 240, 10),
      shiftStartTime: localStorage.getItem(KEYS.shiftStartTime) || '',
      shiftStartWarnMins: clampInt(localStorage.getItem(KEYS.shiftStartWarnMins), 1, 60, 10),
      shiftEndTime: localStorage.getItem(KEYS.shiftEndTime) || '',
      shiftWarnMins: clampInt(localStorage.getItem(KEYS.shiftWarnMins), 1, 60, 10),
    };
  },
  defaults() {
    return { timerLimit: 30, qaLimit: 10, shiftStartTime: '', shiftStartWarnMins: 10, shiftEndTime: '', shiftWarnMins: 10 };
  },
  saveTimerLimit(mins) {
    const v = clampInt(mins, 1, 240, 30);
    localStorage.setItem(KEYS.ctLimit, v);
    return v;
  },
  saveQaLimit(mins) {
    const v = clampInt(mins, 1, 240, 10);
    localStorage.setItem(KEYS.qaLimit, v);
    return v;
  },
  saveShiftStartTime(t) {
    localStorage.setItem(KEYS.shiftStartTime, t || '');
    return t || '';
  },
  saveShiftStartWarnMins(mins) {
    const v = clampInt(mins, 1, 60, 10);
    localStorage.setItem(KEYS.shiftStartWarnMins, v);
    return v;
  },
  saveShiftEndTime(t) {
    localStorage.setItem(KEYS.shiftEndTime, t || '');
    return t || '';
  },
  saveShiftWarnMins(mins) {
    const v = clampInt(mins, 1, 60, 10);
    localStorage.setItem(KEYS.shiftWarnMins, v);
    return v;
  },
};
