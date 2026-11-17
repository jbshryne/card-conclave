import { useEffect, useState } from "react";

// A set of "hidden" keys saved in localStorage, so the choices are still there on the next visit.
export function useHiddenSet(storageKey) {
  const [hidden, setHidden] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...hidden]));
    } catch {}
  }, [storageKey, hidden]);

  const toggle = (key) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const showAll = () => setHidden(new Set());
  const hideAll = (keys) => setHidden((prev) => new Set([...prev, ...keys]));

  return [hidden, toggle, showAll, hideAll];
}
