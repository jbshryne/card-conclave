// Numeric card stats for the search form: which stats exist, how they compare, and how a
// chip is written in a URL ("mv>=3") and in a Scryfall query (mv>=3, pow<2, tou!=4, loy>5).
export const STATS = [
  { key: "mv", label: "Mana Value" },
  { key: "pow", label: "Power" },
  { key: "tou", label: "Toughness" },
  { key: "loy", label: "Loyalty" },
];

export const STAT_OPS = [
  { key: "=", symbol: "=", label: "= equals" },
  { key: "!=", symbol: "≠", label: "≠ is not" },
  { key: "<", symbol: "<", label: "< less than" },
  { key: "<=", symbol: "≤", label: "≤ at most" },
  { key: ">", symbol: ">", label: "> greater than" },
  { key: ">=", symbol: "≥", label: "≥ at least" },
];

export const statLabel = (key) => STATS.find((s) => s.key === key)?.label ?? key;
export const opSymbol = (key) => STAT_OPS.find((o) => o.key === key)?.symbol ?? key;

// Whole or decimal numbers, negatives allowed (some cards have -1 power); returns null if invalid
export const normalizeStatValue = (text) => {
  const t = String(text).trim();
  return /^-?\d+(\.\d+)?$/.test(t) ? t : null;
};

export const statToParam = (s) => `${s.stat}${s.op}${s.value}`;

export function parseStat(text) {
  const m = String(text).match(/^(mv|pow|tou|loy)(>=|<=|!=|=|<|>)(-?\d+(?:\.\d+)?)$/);
  return m ? { stat: m[1], op: m[2], value: m[3] } : null;
}
