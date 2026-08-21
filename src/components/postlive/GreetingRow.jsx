import { useState } from 'react';
import { cls } from '../../utils/cls';
import { copyToClipboard } from '../../utils/clipboard';

const DEFAULT_MSGS = [{ id: 'default', label: 'Check-in', base: 'Hi po Ms. Tina, magpapacheck lang po', fillType: 'caseNum' }];

function buildMsg(m, caseNum, inboundNum) {
  const b = (m.base || 'Hi po Ms. Tina, magpapacheck lang po').trim();
  if (m.fillType === 'none') return b;
  if (m.fillType === 'siteComment') return `${b} Site Comment #${caseNum || '—'}`;
  if (m.fillType === 'inbound') return `${b} Inbound #${inboundNum || '—'}`;
  return `${b} Case #${caseNum || '—'}`;
}

/** Tappable check-in message chips — copies the filled message (with case/inbound # inserted) to clipboard. */
export default function GreetingRow({ greetingMessages, caseNum, inboundNum }) {
  const msgs = greetingMessages?.length ? greetingMessages : DEFAULT_MSGS;
  const [copiedId, setCopiedId] = useState(null);

  if (!caseNum) return null;

  return (
    <div className="flex flex-col gap-2 w-full bg-[#4760FF]/10 border border-[#4760FF]/25 rounded-ch p-3.5">
      <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Messages</p>
      <div className="flex flex-wrap gap-1.5">
        {msgs.map((m) => (
          <button
            key={m.id}
            title={buildMsg(m, caseNum, inboundNum)}
            onClick={() => {
              copyToClipboard(buildMsg(m, caseNum, inboundNum)).then(() => {
                setCopiedId(m.id);
                setTimeout(() => setCopiedId(null), 1500);
              });
            }}
            className={cls(
              'px-3 py-1.5 rounded-full text-[11px] font-body font-bold whitespace-nowrap border transition-colors',
              copiedId === m.id ? 'bg-green-100 border-green-400 text-green-700' : 'bg-[#4760FF]/10 border-[#4760FF]/35 text-[#4760FF]'
            )}
          >
            {copiedId === m.id ? '✓ Copied' : m.label || 'Message'}
          </button>
        ))}
      </div>
    </div>
  );
}
