// Replaces {W}, {2}, {T}, {W/U} ... with Scryfall's symbol images.
export default function ManaText({ text }) {
  if (!text) return null;
  return text.split(/(\{[^}]+\})/g).map((part, i) => {
    const m = part.match(/^\{(.+)\}$/);
    if (!m) return part;
    const code = m[1].replace("/", "");
    return (
      <img key={i} className="mana" alt={part} src={`https://svgs.scryfall.io/card-symbols/${code}.svg`} />
    );
  });
}
