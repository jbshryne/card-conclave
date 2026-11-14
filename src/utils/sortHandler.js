export function joinIfArray(value) {
  if (Array.isArray(value)) return value.join("");
  return value == null ? "" : String(value);
}

// Highest rarity first (mythic before rare); special and bonus cards go last
const RARITY_RANK = { mythic: 0, rare: 1, uncommon: 2, common: 3, special: 4, bonus: 5 };

// ---------------------------------------------------------------------------
// Sorting by card type (Scryfall can't do this, so it happens here)
//
//   1. Creatures: non-legendary, then legendary
//   2. Every other non-land type alphabetically, each followed by its Legendary version
//   3. Lands: ordinary non-basic lands, then non-basic lands with basic land types
//      (in WUBRG order), then basic lands (WUBRG, Wastes last)
// ---------------------------------------------------------------------------
const SUPERTYPES = new Set(["Basic", "Legendary", "Snow", "World", "Ongoing"]);
const BASIC_LAND_COLORS = { Plains: "W", Island: "U", Swamp: "B", Mountain: "R", Forest: "G" };
const BASIC_ORDER = ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"];

// Color sets in "WUBRG wheel" order: singles, allied pairs, enemy pairs, shards, wedges,
// then four colors and five. Each set is written with its letters in WUBRG order.
const COMBOS = [
  "W", "U", "B", "R", "G",
  "WU", "UB", "BR", "RG", "WG", "WB", "UR", "BG", "WR", "UG",
  "WUB", "UBR", "BRG", "WRG", "WUG", "WBR", "URG", "WBG", "WUR", "UBG",
  "WUBR", "UBRG", "WBRG", "WURG", "WUBG", "WUBRG",
];

// W, U, B, R, G, then multicolor (allied pairs, enemy pairs, ...), then colorless last
function colorRank(card) {
  const letters = ["W", "U", "B", "R", "G"].filter((c) => (card.color_identity ?? []).includes(c)).join("");
  if (!letters) return COMBOS.length + 1;
  const i = COMBOS.indexOf(letters);
  return i === -1 ? COMBOS.length : i;
}

export function typeSortKey(card) {
  const typeLine = card.type_line ?? card.card_faces?.[0]?.type_line ?? "";
  const front = typeLine.split(" // ")[0]; // multi-faced cards sort by their front face
  const [left, right = ""] = front.split(/\s+—\s+/);
  const words = left.split(/\s+/).filter(Boolean);
  const subtypes = right.split(/\s+/).filter(Boolean);
  const supers = words.filter((w) => SUPERTYPES.has(w));
  const types = words.filter((w) => !SUPERTYPES.has(w));

  const legendary = supers.includes("Legendary") ? 1 : 0;
  const typesKey = types.join(" ").toLowerCase();
  const rest = `${typesKey} — ${subtypes.join(" ").toLowerCase()}`;

  let group;
  let sub1;
  let sub2 = 0;
  if (types.includes("Land")) {
    group = 3;
    if (supers.includes("Basic")) {
      const i = BASIC_ORDER.indexOf(subtypes.find((t) => BASIC_ORDER.includes(t)));
      sub1 = 2;
      sub2 = (i === -1 ? BASIC_ORDER.length : i) * 2 + (supers.includes("Snow") ? 1 : 0);
    } else {
      const colors = ["W", "U", "B", "R", "G"].filter((c) =>
        subtypes.some((t) => BASIC_LAND_COLORS[t] === c)
      );
      if (colors.length) {
        const i = COMBOS.indexOf(colors.join(""));
        sub1 = 1;
        sub2 = i === -1 ? COMBOS.length : i;
      } else {
        sub1 = 0;
      }
    }
  } else if (types.includes("Creature")) {
    group = legendary ? 1 : 0;
    sub1 = typesKey;
  } else {
    group = 2;
    sub1 = typesKey;
    sub2 = legendary;
  }
  return [
    group, sub1, sub2, rest,
    RARITY_RANK[card.rarity] ?? 9,
    colorRank(card),
    card.name ?? "",
  ];
}

export function sortByType(cards) {
  const keyed = cards.map((card) => ({ card, key: typeSortKey(card) }));
  keyed.sort((a, b) => {
    for (let i = 0; i < a.key.length; i++) {
      const x = a.key[i];
      const y = b.key[i];
      if (x === y) continue;
      return typeof x === "number" ? x - y : x.localeCompare(y);
    }
    return 0;
  });
  return keyed.map((k) => k.card);
}
