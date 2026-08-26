export async function checkGrammar(text) {
  if (!text.trim()) return { result: text, changes: 0 };
  try {
    const r = await fetch('/api/grammar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) return { result: text, changes: 0 };
    const d = await r.json();
    return { result: d.result || text, changes: d.changes || 0 };
  } catch {
    return { result: text, changes: 0 };
  }
}
