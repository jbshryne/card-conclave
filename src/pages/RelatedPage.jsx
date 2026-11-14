import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import NewSearchButton from "../components/NewSearchButton.jsx";
import SizeControl from "../components/SizeControl.jsx";
import { getCard, getCardsById } from "../utils/scryfall";
import { cardImage, isNonCard, oracleId } from "../utils/cards";
import { SIZES, useCardSize } from "../utils/useCardSize";

const COMPONENT_LABELS = { meld_part: "Meld part", meld_result: "Meld result", combo_piece: "Related card" };

function kindLabel(card, component) {
  if (card.layout === "emblem" || /^Emblem\b/.test(card.type_line ?? "")) return "Emblem";
  if (card.layout === "art_series") return "Art card";
  if (isNonCard(card, component)) return "Token";
  return COMPONENT_LABELS[component] ?? "";
}

// "[Card] and related objects": the card itself first, then each related object
// that doesn't share its oracle ID (so the card's own entry isn't repeated).
export default function RelatedPage() {
  const { id } = useParams();
  const [sizeKey, setSizeKey, size] = useCardSize();
  const [card, setCard] = useState(null);
  const [items, setItems] = useState(null); // [{ card, label }]
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCard(null);
    setItems(null);
    setError("");
    (async () => {
      const current = await getCard(id);
      if (cancelled) return;
      setCard(current);
      const parts = current.all_parts ?? [];
      const components = new Map(parts.map((p) => [p.id, p.component]));
      const ids = [...new Set(parts.map((p) => p.id).filter((pid) => pid !== current.id))];
      const related = ids.length ? await getCardsById(ids) : [];
      if (cancelled) return;

      const currentOracle = oracleId(current);
      const seen = new Set();
      const others = related.filter((c) => {
        if (oracleId(c) === currentOracle || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      setItems([
        { card: current, label: "This card" },
        ...others.map((c) => {
          const component = components.get(c.id);
          return { card: c, label: kindLabel(c, component) };
        }),
      ]);
    })().catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!card) return;
    document.title = `${card.name} and related objects – Chancery Archives`;
    return () => {
      document.title = "Chancery Archives";
    };
  }, [card]);

  return (
    <section className="results">
      <div className="resultsBar">
        <BackButton />
        <NewSearchButton />
        {items && <SizeControl value={sizeKey} onChange={setSizeKey} sizes={SIZES} />}
      </div>

      {card && <h2 className="pageTitle">{card.name} and related objects</h2>}
      {!items && !error && <p className="loading-message">Loading…</p>}
      {error && <p className="errorMessage" role="alert">{error}</p>}
      {items?.length === 1 && <p className="muted" style={{ textAlign: "center" }}>No other related objects were found.</p>}

      {items && (
        <ul className="cardGrid" data-size={sizeKey} style={{ "--card-w": `${size.width}px` }}>
          {items.map(({ card: c, label }) => (
            <li key={c.id}>
              <Link to={`/card/${c.id}`}>
                <img src={cardImage(c, size.image)} alt={c.name} loading="lazy" />
              </Link>
              {label && <p className="caption">{label}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
