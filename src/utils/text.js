// Collapse tabs and runs of multiple spaces down to a single space, and strip leading whitespace.
// Used on text inputs to prevent accidental long gaps from repeated spacebar presses or pasted text.
export const cleanSpaces = (s) => (s||"").replace(/\t/g," ").replace(/ {2,}/g," ").replace(/^\s+/,"");
