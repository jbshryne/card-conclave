// Splits text into words and "quoted phrases", prefixing each with a Scryfall keyword.
const tokens = (text) => text.match(/"[^"]+"|\S+/g) ?? [];
// quote anything with spaces or quote marks; use single quotes if the value itself contains "
const quote = (v) => (/[\s'"]/.test(v) ? (v.includes('"') ? `'${v}'` : `"${v}"`) : v);
const anyOf = (terms) => (terms.length > 1 ? `(${terms.join(" or ")})` : terms[0]);

// name / type / rules: every word must match. A NOT item excludes the whole item,
// e.g. -(o:deal o:damage) removes cards containing both words.
function textTerms(prefix, items) {
  return items.flatMap((i) => {
    const terms = tokens(i.value).map((t) => `${prefix}:${t}`);
    if (!terms.length) return [];
    if (!i.negate) return terms;
    return [terms.length > 1 ? `-(${terms.join(" ")})` : `-${terms[0]}`];
  });
}

// Card names picked from the list are exact (!"Lightning Bolt") and can only match one card,
// so several of them mean "any of these". Typed words behave like name/type/rules text.
function nameTerms(items) {
  const exact = items.filter((i) => i.value.startsWith("!"));
  const loose = items.filter((i) => !i.value.startsWith("!"));
  const include = exact.filter((i) => !i.negate).map((i) => i.value);
  const exclude = exact.filter((i) => i.negate).map((i) => `-${i.value}`);
  return [...textTerms("name", loose), ...(include.length ? [anyOf(include)] : []), ...exclude];
}

// set / watermark: a card has only one of these, so several included values mean "any of".
function choiceTerms(prefix, items) {
  const include = items.filter((i) => !i.negate).map((i) => `${prefix}:${quote(i.value)}`);
  const exclude = items.filter((i) => i.negate).map((i) => `-${prefix}:${quote(i.value)}`);
  return [...(include.length ? [anyOf(include)] : []), ...exclude];
}

// art / function tags: all must match (or, for NOT items, none).
const tagTerms = (prefix, items) =>
  items.map((i) => `${i.negate ? "-" : ""}${prefix}:${quote(i.value)}`);

export function buildQuery({ lists, colors, colorless, colorOp, rarities, options }) {
  const parts = [
    ...nameTerms(lists.name),
    ...textTerms("t", lists.type),
    ...textTerms("o", lists.rules),
  ];

  const cs = [...colors].join("");
  if (colorless) {
    parts.push(colorOp === "not" ? "-c:c" : colorOp === "id" ? "id:c" : "c:c");
  } else if (cs) {
    if (colorOp === "and") parts.push(`c=${cs}`);
    if (colorOp === "or") parts.push(`c>=${cs}`);
    if (colorOp === "not") [...colors].forEach((c) => parts.push(`-c:${c}`));
    if (colorOp === "id") parts.push(`id<=${cs}`);
  }

  if (rarities.size) parts.push(anyOf([...rarities].map((r) => `r:${r}`)));
  parts.push(...choiceTerms("s", lists.set));
  parts.push(...choiceTerms("wm", lists.watermark));
  parts.push(...choiceTerms("a", lists.artist ?? [])); // a card has one artist, so several mean "any of"
  parts.push(...tagTerms("art", lists.art));
  parts.push(...tagTerms("function", lists.function));

  if (options.firstPrintings) parts.push("is:firstprint");
  if (options.includeExtras) parts.push("include:extras");
  if (options.isFunny) parts.push("is:funny");

  return parts.join(" ");
}
