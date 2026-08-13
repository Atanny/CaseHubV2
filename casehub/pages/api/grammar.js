// Uses LanguageTool public API — completely free, no API key needed
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });
  try {
    const params = new URLSearchParams({
      text,
      language: 'en-US',
      enabledOnly: 'false',
    });
    const r = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!r.ok) return res.status(200).json({ result: text });
    const d = await r.json();

    // Apply corrections from right to left so offsets stay valid
    let corrected = text;
    const matches = (d.matches || [])
      .filter(m => m.replacements?.length > 0)
      .sort((a, b) => b.offset - a.offset);

    for (const m of matches) {
      const best = m.replacements[0].value;
      corrected = corrected.slice(0, m.offset) + best + corrected.slice(m.offset + m.length);
    }

    return res.status(200).json({ result: corrected, changes: matches.length });
  } catch (e) {
    return res.status(200).json({ result: text }); // fallback: return original
  }
}
