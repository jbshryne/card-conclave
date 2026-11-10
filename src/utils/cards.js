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
