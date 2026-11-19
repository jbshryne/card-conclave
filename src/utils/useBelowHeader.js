import { useLayoutEffect, useState } from "react";

// For a fixed-position element: returns a `top` (in px) that keeps it just below the site header
// while the header is on screen. As the page scrolls the header away, the element rides up with
// it and then stays pinned near the top of the viewport. null until measured.
export function useBelowHeader({ gap = 12, pinned = 12 } = {}) {
  const [top, setTop] = useState(null);

  useLayoutEffect(() => {
    const header = document.querySelector("header");
    if (!header) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      setTop(Math.max(pinned, Math.round(header.getBoundingClientRect().bottom + gap)));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    observer?.observe(header); // the header grows or shrinks when the title wraps or fonts load
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [gap, pinned]);

  return top;
}
