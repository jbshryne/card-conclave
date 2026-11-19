import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ManaText from "./ManaText.jsx";
import Collapsible from "./Collapsible.jsx";
import Legalities from "./Legalities.jsx";
import { isNonCard, oracleId } from "../utils/cards";
import { getPrints, getRulings } from "../utils/scryfall";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Printings that share artwork share an illustration id (one per face on multi-faced cards)
const artKey = (p) => p.illustration_id ?? p.card_faces?.map((f) => f.illustration_id).filter(Boolean).join("+");

// Short notes shown beside each printing: year plus any notable treatment
const printNotes = (p) =>
  [
    p.released_at?.slice(0, 4),
    p.promo && "Promo",
    p.border_color === "borderless" && "Borderless",
    p.full_art && "Full art",
    p.frame_effects?.includes("showcase") && "Showcase",
    p.frame_effects?.includes("extendedart") && "Extended art",
  ]
    .filter(Boolean)
    .join(" · ");

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
  const [prints, setPrints] = useState(null);
  const [uniqueArt, setUniqueArt] = useState(false);

  useEffect(() => {
    document.title = `${card.name} – Chancery Archives`;
    return () => {
      document.title = "Chancery Archives";
    };
  }, [card.name]);

  useEffect(() => {
    if (isNonCard(card)) return; // tokens and emblems have no rulings
    let cancelled = false;
    setRulings(null);
    getRulings(card.id)
      .then((r) => !cancelled && setRulings(r))
      .catch(() => !cancelled && setRulings([]));
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  useEffect(() => {
    let cancelled = false;
    setPrints(null);
    getPrints(card)
      .then((p) => !cancelled && setPrints(p))
      .catch(() => !cancelled && setPrints([]));
    return () => {
      cancelled = true;
    };
  }, [card.id]);
  const otherPrints = prints?.filter((p) => p.id !== card.id) ?? [];
  // "Unique artwork only": drop printings that reuse this card's art or art already listed
  const seenArt = new Set([artKey(card)]);
  const shownPrints = uniqueArt
    ? otherPrints.filter((p) => {
        const key = artKey(p);
        if (!key || seenArt.has(key)) return false;
        seenArt.add(key);
        return true;
      })
    : otherPrints;

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
              {face.mana_cost && <Row label="Mana cost"><ManaText text={face.mana_cost} /></Row>}
              <Row label="Type">{face.type_line}</Row>
              {face === card && <Row label="Rarity">{cap(card.rarity)}</Row>}
              <Row label="Power / Toughness">{face.power && `${face.power}/${face.toughness}`}</Row>
              <Row label="Loyalty">{face.loyalty}</Row>
              {face.oracle_text && (
                <Row label="Oracle text">
                  {face.oracle_text.split("\n").map((line, i) => (
                    <p key={i}><ManaText text={line} /></p>
                  ))}
                </Row>
              )}
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

        {otherPrints.length > 0 && (
          <Collapsible overlay className="overlayPanel" summary={`Other printings (${shownPrints.length})`}>
            <label className="uniqueToggle">
              <input type="checkbox" checked={uniqueArt} onChange={(e) => setUniqueArt(e.target.checked)} /> Unique artwork only
            </label>
            {uniqueArt && shownPrints.length === 0 && (
              <p className="muted">Every other printing uses this card’s artwork.</p>
            )}
            <ul className="printList">
              <li className="viewAll">
                <Link
                  to={{
                    pathname: "/results",
                    search: `?${new URLSearchParams({
                      oracle: oracleId(card) ?? "",
                      prints: "1",
                      sort: "released",
                      dir: "desc",
                      label: card.name,
                      ...(uniqueArt ? { uniqueart: "1" } : {}),
                    })}`,
                  }}
                >
                  <span>{uniqueArt ? "View all unique artwork" : "View all printings"}</span>
                  <span className="meta">{uniqueArt ? shownPrints.length + 1 : prints.length}</span>
                </Link>
              </li>
              {shownPrints.map((p) => (
                <li key={p.id}>
                  <Link to={`/card/${p.id}`}>
                    <span>
                      {p.set_name} <span className="meta">({p.set.toUpperCase()} #{p.collector_number})</span>
                    </span>
                    <span className="meta">{printNotes(p)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Collapsible>
        )}

        {!isNonCard(card) && (
          <>
          <Legalities legalities={card.legalities} />

          {rulings?.length > 0 && (
            <Collapsible overlay className="overlayPanel" summary={`Rulings (${rulings.length})`}>
              <ul className="rulings">
                {rulings.map((r, i) => (
                  <li key={i}>
                    <time dateTime={r.published_at}>{r.published_at}</time>
                    <p><ManaText text={r.comment} /></p>
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}
          </>
        )}

        {!isNonCard(card) && card.all_parts?.some((p) => p.id !== card.id) && (
          <p className="relatedLink">
            <Link className="buttonLink" to={`/related/${card.id}`}>Related objects</Link>
          </p>
        )}

        <p className="cardLinks">
          <a href={card.scryfall_uri} target="_blank" rel="noreferrer">View on Scryfall</a>
          {" · "}
          <a
            href={`https://tagger.scryfall.com/card/${card.set}/${encodeURIComponent(card.collector_number)}`}
            target="_blank"
            rel="noreferrer"
          >
            Tagger
          </a>
        </p>
      </div>
    </div>
  );
}
