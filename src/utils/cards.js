export const cardImage = (card) =>
  card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? "";

// "Basic Land — Island", "Basic Snow Land — Forest", "Basic Land — Wastes"
export const isBasicLand = (card) => /^Basic .*Land/.test(card.type_line ?? "");

// Basic lands go to an interim page listing every version of that land in the set
export const cardPath = (card) =>
  isBasicLand(card)
    ? `/basics/${card.set}/${encodeURIComponent(card.name)}`
    : `/card/${card.id}`;
