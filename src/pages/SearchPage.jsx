import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm.jsx";
import { buildQuery } from "../utils/buildQuery";
import { emptyState, paramsToState, stateToParams } from "../utils/searchParams";

const DRAFT_KEY = "cardConclaveDraft";

export default function SearchPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [error, setError] = useState("");

  // Start from the URL ("Edit search"), else the saved draft, else a blank form
  const [initial] = useState(() => {
    const fromUrl = new URLSearchParams(search);
    if ([...fromUrl.keys()].length) return paramsToState(fromUrl);
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) return paramsToState(new URLSearchParams(draft));
    } catch {}
    return emptyState();
  });

  const saveDraft = (state) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, stateToParams(state).toString());
    } catch {}
  };

  const go = (path, requireCriteria = true) => (state) => {
    if (requireCriteria && !buildQuery(state)) {
      setError("Add at least one search term, color, rarity, or option.");
      return;
    }
    navigate(`${path}?${stateToParams(state)}`);
  };

  return (
    <main id="mainContent">
      <p className="formHint">
        Start a term with <b>-</b> to exclude it, or click any chip to switch it to NOT.
      </p>
      <SearchForm initial={initial} onSearch={go("/results")} onRandomCard={go("/random", false)} onDraft={saveDraft} />
      {error && <p className="errorMessage" role="alert">{error}</p>}
    </main>
  );
}
