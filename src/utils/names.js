// Card-name helpers: autocomplete from Scryfall's card-names catalog, plus the
// "Random" options for the Card Name field (a whole card name, or one word from a name).
export const NAME_RANDOM_OPTIONS = [
  { value: "card", label: "Card Name" },
  { value: "word", label: "Single Word" },
];

// A name picked from the list is matched exactly, e.g. !"Lightning Bolt".
// (Scryfall accepts single quotes too, which covers the few names that contain ".)
export const exactName = (name) => (name.includes('"') ? `!'${name}'` : `!"${name}"`);

// Names that start with what you typed first, then names with a word that starts with it,
// then names that merely contain it. Shorter names first within each group.
export function searchNames(names, text, limit = 8) {
  const q = text.toLowerCase().replace(/"/g, "").trim();
  if (!q) return [];
  const tiers = [[], [], []];
  for (const name of names) {
    const lower = name.toLowerCase();
    if (lower.startsWith(q)) tiers[0].push(name);
    else if (lower.split(/[\s,/-]+/).some((w) => w.startsWith(q))) tiers[1].push(name);
    else if (lower.includes(q)) tiers[2].push(name);
  }
  const order = (a, b) => a.length - b.length || a.localeCompare(b);
  return tiers
    .flatMap((t) => t.sort(order))
    .slice(0, limit)
    .map((name) => ({ label: name, value: exactName(name) }));
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const randomName = (names) => {
  const name = pick(names);
  return { label: name, value: exactName(name) };
};

// The word bank has stray punctuation and numbers; keep real words of 4+ letters.
export const randomWord = (words) => {
  const real = words.filter((w) => /^[a-z][a-z'’-]{3,}$/i.test(w));
  const word = pick(real.length ? real : words);
  return { label: word, value: word };
};
