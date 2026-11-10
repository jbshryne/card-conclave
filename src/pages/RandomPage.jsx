import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import CardDetail from "../components/CardDetail.jsx";
import { randomCard } from "../utils/scryfall";
import { buildQuery } from "../utils/buildQuery";
import { paramsToState } from "../utils/searchParams";

// Shows a random card matching the search filters (or any card in Magic if there are none).
export default function RandomPage() {
  const [params] = useSearchParams();
  const key = params.toString();
  const query = useMemo(() => buildQuery(paramsToState(new URLSearchParams(key))), [key]);

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const draw = useCallback(
    async (avoidId) => {
      setLoading(true);
      setError("");
      setNote("");
      try {
        let next = await randomCard(query);
        // Re-randomize should show something different if the search allows it
        for (let i = 0; avoidId && next.id === avoidId && i < 3; i++) {
          next = await randomCard(query);
        }
        if (avoidId && next.id === avoidId) setNote("Only one card matches this search.");
        setCard(next);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    setCard(null);
    draw();
  }, [draw]);

  return (
    <section className="cardPage">
      <div className="randomBar">
        <BackButton />
        <button type="button" className="buttonLink primary" disabled={loading} onClick={() => draw(card?.id)}>
          {loading && card ? "Drawing…" : "Re-randomize"}
        </button>
        {query && <Link className="buttonLink" to={{ pathname: "/", search: `?${key}` }}>Edit search</Link>}
        <span className="muted">
          {query ? "Random card matching your search" : "Random card from all of Magic"}
        </span>
      </div>

      {error && <p className="errorMessage" role="alert">{error}</p>}
      {note && <p className="muted">{note}</p>}
      {!card && !error && <p className="loading-message">Drawing a card…</p>}
      {card && (
        <>
          <CardDetail key={card.id} card={card} />
          <p><Link className="permalink" to={`/card/${card.id}`}>Link to this card</Link></p>
        </>
      )}
    </section>
  );
}
