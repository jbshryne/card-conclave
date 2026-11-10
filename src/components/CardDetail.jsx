import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ManaText from "./ManaText.jsx";
import { getRulings } from "../utils/scryfall";

const FORMAT_NAMES = {
  paupercommander: "Pauper Commander", standardbrawl: "Standard Brawl",
  oldschool: "Old School", predh: "Pre-DH", premodern: "Premodern",
};
const formatName = (f) => FORMAT_NAMES[f] ?? f.charAt(0).toUpperCase() + f.slice(1);
const STATUS = { legal: "Legal", not_legal: "Not legal", banned: "Banned", restricted: "Restricted" };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function Row({ label, children }) {
  if (!children) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

// Scryfall marks italics in flavor text with *asterisks*
function FlavorText({ text }) {
  return text.split("\n").map((line, i) => (
    <p key={i} className="flavor">
      {line.split(/(\*[^*]+\*)/g).map((part, j) =>
        /^\*[^*]+\*$/.test(part) ? <em key={j}>{part.slice(1, -1)}</em> : part
      )}
    </p>
  ));
}

export default function CardDetail({ card }) {
  const [rulings, setRulings] = useState(null);

  useEffect(() => {
    document.title = `${card.name} – Card Conclave`;
    return () => {
      document.title = "Card Conclave";
    };
  }, [card.name]);

  useEffect(() => {
    let cancelled = false;
    setRulings(null);
    getRulings(card.id)
      .then((r) => !cancelled && setRulings(r))
      .catch(() => !cancelled && setRulings([]));
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  const images = card.image_uris
    ? [card.image_uris.normal]
    : (card.card_faces ?? []).map((f) => f.image_uris?.normal).filter(Boolean);
  const faces = card.card_faces?.length > 1 ? card.card_faces : [card];

  return (
    <div className="cardLayout">
      <div className="cardImages">
        {images.map((src, i) => (
          <img key={src} src={src} alt={faces[i]?.name ?? card.name} />
        ))}
      </div>

      <div className="cardInfo">
        {faces.map((face) => (
          <div className="face" key={face.name}>
            <h2>{face.name}</h2>
            <dl>
              <Row label="Mana cost"><ManaText text={face.mana_cost} /></Row>
              <Row label="Type">{face.type_line}</Row>
              {face === card && <Row label="Rarity">{cap(card.rarity)}</Row>}
              <Row label="Power / Toughness">{face.power && `${face.power}/${face.toughness}`}</Row>
              <Row label="Loyalty">{face.loyalty}</Row>
              <Row label="Oracle text">
                {face.oracle_text?.split("\n").map((line, i) => (
                  <p key={i}><ManaText text={line} /></p>
                ))}
              </Row>
              <Row label="Flavor text">{face.flavor_text && <FlavorText text={face.flavor_text} />}</Row>
              {faces.length > 1 && <Row label="Artist">{face.artist}</Row>}
            </dl>
          </div>
        ))}

        <dl className="cardMeta">
          {faces.length > 1 && <Row label="Rarity">{cap(card.rarity)}</Row>}
          {faces.length === 1 && <Row label="Artist">{card.artist}</Row>}
          <Row label="Set">
            <Link to={`/results?set=${card.set}&sort=set`}>{card.set_name}</Link>{" "}
            ({card.set.toUpperCase()} #{card.collector_number})
          </Row>
        </dl>

        <details>
          <summary>Format legalities</summary>
          <ul className="legalities">
            {Object.entries(card.legalities).map(([format, status]) => (
              <li key={format}>
                <span>{formatName(format)}</span>
                <span className={`badge ${status}`}>{STATUS[status] ?? status}</span>
              </li>
            ))}
          </ul>
        </details>

        <details>
          <summary>Rulings{rulings ? ` (${rulings.length})` : ""}</summary>
          {!rulings && <p className="muted">Loading rulings…</p>}
          {rulings?.length === 0 && <p className="muted">No rulings for this card.</p>}
          <ul className="rulings">
            {rulings?.map((r, i) => (
              <li key={i}>
                <time dateTime={r.published_at}>{r.published_at}</time>
                <p><ManaText text={r.comment} /></p>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
