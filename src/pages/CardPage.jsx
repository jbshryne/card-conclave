import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import CardDetail from "../components/CardDetail.jsx";
import NewSearchButton from "../components/NewSearchButton.jsx";
import { getCard } from "../utils/scryfall";

export default function CardPage() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCard(null);
    setError("");
    getCard(id)
      .then((c) => !cancelled && setCard(c))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <section className="cardPage">
      <div className="randomBar">
        <BackButton />
        <NewSearchButton />
      </div>
      {error && <p className="errorMessage" role="alert">{error}</p>}
      {!card && !error && <p className="loading-message">Loading card…</p>}
      {card && <CardDetail key={card.id} card={card} />}
    </section>
  );
}
