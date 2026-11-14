import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm.jsx";
import { buildQuery } from "../utils/buildQuery";
import { emptyState, paramsToState, stateToParams } from "../utils/searchParams";
import { clearDraft, loadDraft, saveDraft } from "../utils/draft";

export default function SearchPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0); // changing this remounts the form, clearing every field

  // Start from the URL ("Edit search"), else the saved draft, else a blank form
  const [initial, setInitial] = useState(() => {
    const fromUrl = new URLSearchParams(search);
    if ([...fromUrl.keys()].length) return paramsToState(fromUrl);
    const draft = loadDraft();
    if (draft) return paramsToState(new URLSearchParams(draft));
    return emptyState();
  });

  const go = (path, requireCriteria = true) => (state) => {
    if (requireCriteria && !buildQuery(state)) {
      setError("Add at least one search term, color, rarity, or option.");
      return;
    }
    navigate(`${path}?${stateToParams(state)}`);
  };

  const reset = () => {
    clearDraft();
    setInitial(emptyState());
    setFormKey((k) => k + 1);
    setError("");
    if (search) navigate("/", { replace: true }); // drop any params left in the URL
  };

  return (
    <main id="mainContent">
      <p className="formHint">
        Start a term with <b>-</b> to exclude it, or click any chip to switch it to NOT. Whatever you have typed in
        a box is included in your search, even if you haven&rsquo;t added it to the list. Use <b>Add to list</b> (or
        press Enter) when you want several terms in the same field.
      </p>
      <SearchForm
        key={formKey}
        initial={initial}
        onSearch={go("/results")}
        onRandomCard={go("/random", false)}
        onDraft={(state) => saveDraft(stateToParams(state))}
        onReset={reset}
      />
      {error && <p className="errorMessage" role="alert">{error}</p>}
    </main>
  );
}
