import { postJson } from './http'

export async function checkGrammar(text) {
  if (!text.trim()) return {result:text,changes:0};
  try {
    const r = await postJson("/api/grammar",{text});
    if(!r.ok) return {result:text,changes:0};
    const d = await r.json();
    return {result:d.result||text, changes:d.changes||0};
  } catch { return {result:text,changes:0}; }
}
