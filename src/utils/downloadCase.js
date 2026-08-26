/**
 * Downloads a case as a plain-text summary (meta + entries). The legacy
 * version also tried to save screenshots into a real folder via the
 * File System Access API (Chrome/Edge only) — that's dropped here in favor
 * of a single reliable .txt export; screenshots are already viewable/
 * downloadable individually from the case's screenshot grid.
 */
export default function downloadCase(c) {
  const isSC = c._mode === 'siteComment';
  const entries = c.entries || [];
  let txt = 'Post-Live Amends:\n';
  entries.forEach((e) => {
    if (!e.number && !e.notes && !e.note && !e.clarification) return;
    txt += '\n';
    txt += isSC ? `Site Comment #${e.number}:\n` : 'Assumption:\n';
    const note = e.notes || e.note;
    if (note) txt += `Note: ${note}\n`;
    if (e.clarification) txt += `\nClarification: ${e.clarification}\n`;
    txt += '\n';
  });
  if (!isSC && c.emailAddress) {
    const tl = c.emailType === 'clarification' ? 'Clarification email sent to' : 'Email completed sent to';
    txt += `\n${tl} ${c.emailAddress}.`;
  }

  const meta = [
    'Post-Live Amends Case Export',
    '─'.repeat(36),
    `Saved: ${c.savedAt}`,
    `Type: ${isSC ? 'Site Comment' : 'Inbound Email'}`,
    `Case #: ${c.caseNum || '—'}`,
    `Account #: ${c.accountNum || '—'}`,
    ...(isSC ? [] : [`Inbound #: ${c.inboundNum || '—'}`]),
    `Amend Type: ${c.amendType || '—'}`,
    '',
    txt,
  ].join('\n');

  const cx = c._caseComplexity || 'minor';
  const cxLabel = cx === 'major' ? 'Major' : cx === 'complex' ? 'Complex' : 'Minor';
  const bizPart = (c.businessName || '').trim();
  const fileName = `${cxLabel} ${c.caseNum || 'unknown'}${bizPart ? ' ' + bizPart : ''}`
    .replace(/[^a-zA-Z0-9 _()-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const blob = new Blob([meta], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName || 'case'}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}
