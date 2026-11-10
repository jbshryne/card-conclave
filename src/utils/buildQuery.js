// Splits text into words and "quoted phrases", prefixing each with a Scryfall keyword.
const tokens = (text) => text.match(/"[^"]+"|\S+/g) ?? [];
const quote = (v) => (/\s/.test(v) ? `"${v}"` : v);
const anyOf = (terms) => (terms.length > 1 ? `(${terms.join(" or ")})` : terms[0]);

export function buildQuery({ lists, colors, colorless, colorOp, rarities, options }) {
  const parts = [];

  lists.name.forEach((i) => tokens(i.value).forEach((t) => parts.push(`name:${t}`)));
  lists.type.forEach((i) => tokens(i.value).forEach((t) => parts.push(`t:${t}`)));
  lists.rules.forEach((i) => tokens(i.value).forEach((t) => parts.push(`o:${t}`)));

  const cs = [...colors].join("");
  if (colorless) {
    parts.push(colorOp === "not" ? "-c:c" : colorOp === "id" ? "id:c" : "c:c");
  } else if (cs) {
    if (colorOp === "and") parts.push(`c=${cs}`);
    if (colorOp === "or") parts.push(`c>=${cs}`);
    if (colorOp === "not") [...colors].forEach((c) => parts.push(`-c:${c}`));
    if (colorOp === "id") parts.push(`id<=${cs}`);
  }

  // A card has one rarity / watermark, so multiples mean "any of these"
  if (rarities.size) parts.push(anyOf([...rarities].map((r) => `r:${r}`)));
  if (lists.set.length) parts.push(anyOf(lists.set.map((i) => `s:${quote(i.value)}`)));
  if (lists.watermark.length) {
    parts.push(anyOf(lists.watermark.map((i) => `wm:${quote(i.value)}`)));
  }

  lists.art.forEach((i) => parts.push(`art:${quote(i.value)}`));
  lists.function.forEach((i) => parts.push(`function:${quote(i.value)}`));

  if (options.firstPrintings) parts.push("is:firstprint");
  if (options.includeExtras) parts.push("include:extras");
  if (options.isFunny) parts.push("is:funny");

  return parts.join(" ");
}
