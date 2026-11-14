// size: a Scryfall image size such as "normal" (488px wide) or "large" (672px wide)
export const cardImage = (card, size = "normal") =>
  card.image_uris?.[size] ?? card.card_faces?.[0]?.image_uris?.[size] ?? "";

// "Basic Land — Island", "Basic Snow Land — Forest", "Basic Land — Wastes"
export const isBasicLand = (card) => /^Basic .*Land/.test(card.type_line ?? "");

// Basic lands go to an interim page listing every version of that land in the set
export const cardPath = (card) =>
  isBasicLand(card)
    ? `/basics/${card.set}/${encodeURIComponent(card.name)}`
    : `/card/${card.id}`;

// Reversible cards keep oracle_id on their faces instead of the card itself
export const oracleId = (card) => card.oracle_id ?? card.card_faces?.[0]?.oracle_id;

// Tokens, emblems and art cards, as opposed to real cards. `component` is the all_parts role, if known.
const NON_CARD_LAYOUTS = new Set(["token", "double_faced_token", "emblem", "art_series"]);
export const isNonCard = (card, component) =>
  NON_CARD_LAYOUTS.has(card.layout) || component === "token" || /^(Token|Emblem)\b/.test(card.type_line ?? "");
