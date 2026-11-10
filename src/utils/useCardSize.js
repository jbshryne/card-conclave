import { useState } from "react";

// Grid card widths. "large" also switches to Scryfall's higher-resolution image.
export const SIZES = {
  small: { label: "Small", width: 180, image: "normal" },
  medium: { label: "Medium", width: 250, image: "normal" },
  large: { label: "Large", width: 360, image: "large" },
};
const KEY = "cardConclaveCardSize";

// Remembers the choice between visits.
export function useCardSize() {
  const [key, setKey] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (SIZES[saved]) return saved;
    } catch {}
    return "medium";
  });
  const update = (next) => {
    setKey(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  };
  return [key, update, SIZES[key]];
}
