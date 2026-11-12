import { useState } from "react";

export const PER_PAGE_OPTIONS = [20, 40, 60, 100, 200];
const KEY = "cardConclavePerPage";

// Remembers the cards-per-page choice between visits.
export function usePerPage() {
  const [perPage, setPerPage] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(KEY), 10);
      if (PER_PAGE_OPTIONS.includes(saved)) return saved;
    } catch {}
    return 60;
  });
  const update = (n) => {
    setPerPage(n);
    try {
      localStorage.setItem(KEY, String(n));
    } catch {}
  };
  return [perPage, update];
}
