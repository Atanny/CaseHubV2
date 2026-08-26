const TYPE_COLOR = {
  siteComment: '#4760FF',
  inbound: '#8A38F5',
};

const TYPE_TEXT = {
  siteComment: 'Site Comment',
  inbound: 'Inbound Email',
};

/**
 * Single pill combining case type + complexity, e.g. "SITE COMMENT - MINOR".
 * Matches the Figma "Case Accordion" badge exactly — the legacy build split
 * this into two separate badges, which isn't what the design shows.
 */
export default function CaseTypeBadge({ caseType, complexity }) {
  const bg = TYPE_COLOR[caseType] || TYPE_COLOR.siteComment;
  const text = `${TYPE_TEXT[caseType] || 'Site Comment'} - ${complexity || 'minor'}`;
  return (
    <span
      className="px-2.5 py-1 rounded-full border border-white text-white text-badge font-label font-bold uppercase whitespace-nowrap"
      style={{ background: bg }}
    >
      {text}
    </span>
  );
}
