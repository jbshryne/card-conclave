// Prev / 1 … 4 5 6 … 20 / Next
function pageItems(page, pages) {
  const wanted = [...new Set([1, pages, page - 1, page, page + 1])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const out = [];
  wanted.forEach((n, i) => {
    if (i && n - wanted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Result pages">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>Prev</button>
      {pageItems(page, pages).map((item, i) =>
        item === "…" ? (
          <span key={`gap${i}`} className="muted">…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        )
      )}
      <button type="button" disabled={page === pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}
