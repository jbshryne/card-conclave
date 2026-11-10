import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import { searchAll } from "../utils/scryfall";
import { cardImage } from "../utils/cards";

const cache = new Map();

// Interim page: every version of one basic land within one set (e.g. all Bloomburrow Islands)
export default function BasicLandsPage() {
  const { set, name } = useParams();
  const navigate = useNavigate();
  const key = `${set}/${name}`;
  const [cards, setCards] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCards(null);
    setError("");

    const show = (list) => {
      if (cancelled) return;
      // Only one version exists, so skip the interim page
      if (list.length === 1) navigate(`/card/${list[0].id}`, { replace: true });
      else setCards(list);
    };

    if (cache.has(key)) {
      show(cache.get(key));
      return;
    }
    if (!/^[a-z0-9]+$/i.test(set)) {
      setError("Invalid set code.");
      return;
    }
    const exactName = name.replace(/"/g, "");
    searchAll(`s:${set} !"${exactName}"`, "set", undefined, 200, "prints")
      .then((list) => {
        cache.set(key, list);
        show(list);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [key, set, name, navigate]);

  const setName = cards?.[0]?.set_name;

  return (
    <section className="results">
      <div className="resultsBar">
        <BackButton />
        <span>
          {name} {setName ? `— ${setName} (${set.toUpperCase()})` : ""}
          {cards ? ` · ${cards.length} versions` : ""}
        </span>
      </div>

      {!cards && !error && <p className="loading-message">Loading…</p>}
      {error && <p className="errorMessage" role="alert">{error}</p>}
      {cards?.length === 0 && <p className="errorMessage">No versions found.</p>}

      {cards && (
        <ul className="cardGrid">
          {cards.map((card) => (
            <li key={card.id}>
              <Link to={`/card/${card.id}`}>
                <img src={cardImage(card)} alt={`${card.name} #${card.collector_number}`} loading="lazy" />
              </Link>
              <p className="caption">
                {[`#${card.collector_number}`, card.full_art && "Full art", card.border_color === "borderless" && "Borderless"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
