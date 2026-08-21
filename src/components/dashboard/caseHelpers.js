export function modeBadgeColor(mode) {
  return mode === 'inbound' ? '#8A38F5' : '#4760FF';
}
export function modeLabel(mode) {
  return mode === 'inbound' ? 'Inbound Email' : 'Site Comment';
}
export function complexityLabel(cx) {
  if (cx === 'major') return 'Major';
  if (cx === 'complex') return 'Complex';
  return 'Minor';
}
