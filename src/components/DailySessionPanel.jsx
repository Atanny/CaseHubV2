import Icon from './Icon';
import { fmtElapsed } from '../utils/format';

const COLS = ['Type', 'Complexity', 'Case Number', 'Started', 'Ended', 'Duration', 'Outcome', 'Actions'];

/**
 * Time In/Out + today's case log + summary stats. Time In/Out here is a
 * local per-browser-session toggle (elapsed shown live) — it doesn't yet
 * write to the sessions table or drive the shift-alarm system, since that's
 * the break-timer/shift-alarm milestone. Session Log's read/delete side and
 * this panel share the same shape so that milestone can wire straight in.
 */
export default function DailySessionPanel({ timedIn, elapsed, onToggleTimeIn, rows, stats }) {
  return (
    <div className="bg-white rounded-ch shadow-ch p-5 w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-heading font-bold text-h6 text-ch-main uppercase">Daily Session</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-ch border border-ch-border font-body text-body text-ch-main tabular-nums">
            <span className="text-[9px] font-label font-bold uppercase opacity-50">Timer</span>
            {fmtElapsed(elapsed)}
          </div>
          <button
            onClick={onToggleTimeIn}
            className={`flex items-center gap-2 px-4 h-9 rounded-ch font-body text-body font-bold text-white ${timedIn ? 'bg-ch-red' : 'bg-ch-main'}`}
          >
            {timedIn ? 'Time Out' : 'Time In'}
            <Icon name="clock" size={14} color="#fff" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c} className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 pb-2 pr-3 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="text-center font-body text-body text-ch-main opacity-50 py-6">
                  Time In First To Log Your Session
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-t border-ch-secondary">
                  <td className="py-2 pr-3 font-body text-body text-ch-main">{r.type}</td>
                  <td className="py-2 pr-3 font-body text-body text-ch-main capitalize">{r.complexity}</td>
                  <td className="py-2 pr-3 font-body text-body text-ch-main">{r.caseNum}</td>
                  <td className="py-2 pr-3 font-body text-body text-ch-main">{r.started}</td>
                  <td className="py-2 pr-3 font-body text-body text-ch-main">{r.ended || '—'}</td>
                  <td className="py-2 pr-3 font-body text-body text-ch-main">{r.duration}</td>
                  <td className="py-2 pr-3 font-body text-body text-ch-main">{r.outcome}</td>
                  <td className="py-2 pr-3 font-body text-body text-ch-main">{r.actions}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2.5 flex-wrap">
        {[
          ['Total Hours', stats.totalHours],
          ['Total Cases For This Session', stats.totalCases],
          ['Completed Case', stats.completed],
          ['Clarification Case', stats.clarification],
          ['Suspended Case', stats.suspended],
        ].map(([label, val]) => (
          <div key={label} className="flex-1 min-w-[140px] bg-ch-secondary rounded-ch p-3.5 text-center">
            <p className="font-heading font-bold text-h6 text-ch-main">{val}</p>
            <p className="font-body text-body text-ch-main opacity-60">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
