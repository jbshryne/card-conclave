// Converts the search form's state to and from URL query params, so every
// search has a shareable URL like /results?type=elf&colors=g&sort=type
export const LIST_KEYS = ["name", "type", "rules", "set", "watermark", "artist", "art", "function"];
export const SORT_KEYS = ["name", "type", "color", "cmc", "power", "toughness", "rarity", "released", "set"];
const COLOR_OPS = ["and", "or", "not", "id"];

// A leading "-" means NOT ("-elf"). A minus before a digit stays literal, so rules text
// like "-1/-1 counter" still works. Negated values are stored in URLs with the "-" prefix.
export function parseNegation(text) {
  const m = text.match(/^-(?!\d)\s*(\S[\s\S]*)$/);
  return m ? { value: m[1], negate: true } : { value: text, negate: false };
}

export const emptyState = () => ({
  lists: Object.fromEntries(LIST_KEYS.map((k) => [k, []])),
  colors: new Set(),
  colorless: false,
  colorOp: "and",
  rarities: new Set(),
  options: { firstPrintings: false, includeExtras: false, isFunny: false },
  sort: "type",
  dir: "asc",
});

export function stateToParams(s) {
  const p = new URLSearchParams();
  LIST_KEYS.forEach((k) => s.lists[k].forEach((i) => p.append(k, (i.negate ? "-" : "") + i.value)));
  if (s.colorless) p.set("colors", "c");
  else if (s.colors.size) p.set("colors", [...s.colors].join(""));
  if (s.colorless || s.colors.size) p.set("colorOp", s.colorOp);
  if (s.rarities.size) p.set("rarity", [...s.rarities].join(""));
  if (s.options.firstPrintings) p.set("first", "1");
  if (s.options.includeExtras) p.set("extras", "1");
  if (s.options.isFunny) p.set("funny", "1");
  p.set("sort", s.sort);
  if (s.dir === "desc") p.set("dir", "desc");
  return p;
}

export function paramsToState(p) {
  const s = emptyState();
  LIST_KEYS.forEach((k) => {
    s.lists[k] = p.getAll(k).map((raw) => {
      const { value, negate } = parseNegation(raw);
      // exact-name picks are stored as !"Name"; show just the name on the chip
      const label = k === "set" ? value.toUpperCase() : k === "name" ? value.replace(/^!?(["'])(.*)\1$/, "$2") : value;
      return { label, value, negate };
    });
  });
  const colors = p.get("colors") ?? "";
  if (colors === "c") s.colorless = true;
  else s.colors = new Set([...colors].filter((c) => "wubrg".includes(c)));
  if (COLOR_OPS.includes(p.get("colorOp"))) s.colorOp = p.get("colorOp");
  s.rarities = new Set([...(p.get("rarity") ?? "")].filter((r) => "curm".includes(r)));
  s.options = {
    firstPrintings: p.get("first") === "1",
    includeExtras: p.get("extras") === "1",
    isFunny: p.get("funny") === "1",
  };
  if (SORT_KEYS.includes(p.get("sort"))) s.sort = p.get("sort");
  s.dir = p.get("dir") === "desc" ? "desc" : "asc";
  return s;
}
