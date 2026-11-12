import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchAll } from "../utils/scryfall";
import { sortHandler } from "../utils/sortHandler";
import { buildQuery } from "../utils/buildQuery";
import { paramsToState } from "../utils/searchParams";
import { cardImage, cardPath } from "../utils/cards";
import { SIZES, useCardSize } from "../utils/useCardSize";
import { PER_PAGE_OPTIONS, usePerPage } from "../utils/usePerPage";
import { SORTS } from "../data/sorts";
import SizeControl from "../components/SizeControl.jsx";
import NewSearchButton from "../components/NewSearchButton.jsx";
import Pagination from "../components/Pagination.jsx";

const MAX_CARDS = 1000;
const resultsCache = new Map(); // so "Back" from a card page doesn't re-run the search

export default function ResultsPage() {
  const [params, setParams] = useSearchParams();
  const [sizeKey, setSizeKey, size] = useCardSize();
  const [perPage, setPerPage] = usePerPage();

  // Everything except `page` identifies the search (terms, sort, direction)
  const searchKey = useMemo(() => {
    const p = new URLSearchParams(params);
    p.delete("page");
    return p.toString();
  }, [params]);
  const search = useMemo(() => paramsToState(new URLSearchParams(searchKey)), [searchKey]);
  const page = Math.max(1, parseInt(params.get("page"), 10) || 1);

  const [result, setResult] = useState(() => resultsCache.get(searchKey) ?? null); // { cards, total }
  const [progress, setProgress] = useState("Searching…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (resultsCache.has(searchKey)) {
      setResult(resultsCache.get(searchKey));
      setError("");
      return;
    }
    let cancelled = false;
    const query = buildQuery(search);
    setResult(null);
    setError("");
    if (!query) {
      setError("That search has no criteria.");
      return;
    }
    setProgress("Searching…");
    let total = 0;
    const typeSort = search.sort === "type";
    // Scryfall can't order by type line, so type sorting happens here after loading
    searchAll(
      query,
      typeSort ? "name" : search.sort,
      (n, t) => {
        total = t;
        if (!cancelled) setProgress(`Loaded ${n} of ${t} cards…`);
      },
      MAX_CARDS,
      "cards",
      typeSort ? "asc" : search.dir
    )
      .then((cards) => {
        if (cancelled) return;
        if (typeSort) {
          cards = sortHandler(cards, "type_line", "rarity", "color_identity");
          if (search.dir === "desc") cards.reverse();
        }
        const value = { cards, total: Math.max(total, cards.length) };
        resultsCache.set(searchKey, value);
        setResult(value);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [searchKey, search]);

  const cards = result?.cards ?? null;
  const pages = cards ? Math.max(1, Math.ceil(cards.length / perPage)) : 1;
  const currentPage = Math.min(page, pages);
  const visible = cards?.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Sort/direction/per-page changes replace the history entry; page changes add one
  const change = (updates, { push = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: !push });
  };
  const goToPage = (n) => {
    change({ page: n === 1 ? null : n }, { push: true });
    window.scrollTo({ top: 0 });
  };

  const pager = <Pagination page={currentPage} pages={pages} onChange={goToPage} />;

  return (
    <section className="results">
      <div className="resultsBar">
        <Link className="buttonLink" to={{ pathname: "/", search: `?${searchKey}` }}>Edit search</Link>
        <NewSearchButton />
        {cards && (
          <span>
            {result.total > cards.length
              ? `First ${cards.length.toLocaleString()} of ${result.total.toLocaleString()} cards`
              : `${cards.length.toLocaleString()} cards`}
          </span>
        )}
      </div>

      <div className="resultsTools">
        <label>
          Sort by
          <select value={search.sort} onChange={(e) => change({ sort: e.target.value, page: null })}>
            {SORTS.map(([value, text]) => (
              <option key={value} value={value}>{text}</option>
            ))}
          </select>
        </label>
        <select
          aria-label="Sort direction"
          value={search.dir}
          onChange={(e) => change({ dir: e.target.value, page: null })}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <label>
          Per page
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              change({ page: null });
            }}
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <SizeControl value={sizeKey} onChange={setSizeKey} sizes={SIZES} />
      </div>

      {!cards && !error && <p className="loading-message">{progress}</p>}
      {error && <p className="errorMessage" role="alert">{error}</p>}
      {cards?.length === 0 && <p className="errorMessage">No cards matched that search.</p>}

      {cards?.length > 0 && (
        <>
          {pager}
          <ul className="cardGrid" data-size={sizeKey} style={{ "--card-w": `${size.width}px` }}>
            {visible.map((card) => (
              <li key={card.id}>
                <Link to={cardPath(card)}>
                  <img src={cardImage(card, size.image)} alt={card.name} loading="lazy" />
                </Link>
              </li>
            ))}
          </ul>
          {pager}
        </>
      )}
    </section>
  );
}
