import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchAll } from "../utils/scryfall";
import { sortHandler } from "../utils/sortHandler";
import { buildQuery } from "../utils/buildQuery";
import { paramsToState } from "../utils/searchParams";
import { cardImage, cardPath } from "../utils/cards";
import { SIZES, useCardSize } from "../utils/useCardSize";
import SizeControl from "../components/SizeControl.jsx";

const resultsCache = new Map(); // so "Back" from a card page doesn't re-run the search

export default function ResultsPage() {
  const [params] = useSearchParams();
  const key = params.toString();
  const [cards, setCards] = useState(() => resultsCache.get(key) ?? null);
  const [progress, setProgress] = useState("Searching…");
  const [error, setError] = useState("");
  const [sizeKey, setSizeKey, size] = useCardSize();

  useEffect(() => {
    if (resultsCache.has(key)) {
      setCards(resultsCache.get(key));
      setError("");
      return;
    }
    let cancelled = false;
    const state = paramsToState(new URLSearchParams(key));
    const query = buildQuery(state);
    setCards(null);
    setError("");
    if (!query) {
      setError("That search has no criteria.");
      return;
    }
    setProgress("Searching…");
    const typeSort = state.sort === "type";
    searchAll(query, typeSort ? "name" : state.sort, (n, total) => {
      if (!cancelled) setProgress(`Loaded ${n} of ${total} cards…`);
    })
      .then((results) => {
        if (cancelled) return;
        if (typeSort) results = sortHandler(results, "type_line", "rarity", "color_identity");
        resultsCache.set(key, results);
        setCards(results);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [key]);

  return (
    <section className="results">
      <div className="resultsBar">
        <Link className="buttonLink" to={{ pathname: "/", search: `?${key}` }}>Edit search</Link>
        {cards && <span>{cards.length} cards</span>}
        {cards?.length > 0 && <SizeControl value={sizeKey} onChange={setSizeKey} sizes={SIZES} />}
      </div>

      {!cards && !error && <p className="loading-message">{progress}</p>}
      {error && <p className="errorMessage" role="alert">{error}</p>}
      {cards?.length === 0 && <p className="errorMessage">No cards matched that search.</p>}

      {cards && (
        <ul className="cardGrid" data-size={sizeKey} style={{ "--card-w": `${size.width}px` }}>
          {cards.map((card) => (
            <li key={card.id}>
              <Link to={cardPath(card)}>
                <img src={cardImage(card, size.image)} alt={card.name} loading="lazy" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
