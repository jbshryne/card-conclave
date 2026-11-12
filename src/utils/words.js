// Completions for the word being typed, from Scryfall's word bank
// (every word that appears in a card name). Prefix matches first, shortest first.
export function searchWords(words, stem, limit = 8) {
  const q = stem.toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const w of words) {
    if (w === q) continue;
    if (w.startsWith(q)) starts.push(w);
    else if (w.includes(q)) contains.push(w);
  }
  const order = (a, b) => a.length - b.length || a.localeCompare(b);
  starts.sort(order);
  contains.sort(order);
  return [...starts, ...contains].slice(0, limit).map((w) => ({ label: w, value: w }));
}
