import { useEffect, useRef } from "react";

// A native <details> element (so keyboard, screen readers and find-in-page still work)
// whose body slides open and shut instead of snapping.
// overlay: the body floats over the content below (instead of pushing it down) and
// closes on Escape or a click outside, like a dropdown.
export default function Collapsible({ summary, children, className, overlay = false }) {
  const detailsRef = useRef(null);
  const bodyRef = useRef(null);
  const animRef = useRef(null);
  const state = useRef("closed"); // closed | opening | open | closing

  const setExpanded = (willOpen) => {
    const details = detailsRef.current;
    const body = bodyRef.current;

    // Start from wherever the body is right now, so interrupting mid-animation stays smooth
    const from = body.getBoundingClientRect().height;
    animRef.current?.cancel();
    details.dataset.expanded = String(willOpen); // flips the arrow immediately

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !body.animate) {
      details.open = willOpen;
      state.current = willOpen ? "open" : "closed";
      return;
    }

    if (willOpen) details.open = true;
    const cs = getComputedStyle(body);
    const borders = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const to = willOpen ? body.scrollHeight + borders : 0;
    state.current = willOpen ? "opening" : "closing";

    const anim = body.animate(
      { height: [`${from}px`, `${to}px`], opacity: [willOpen ? 0 : 1, willOpen ? 1 : 0] },
      { duration: 260, easing: "cubic-bezier(0.4, 0.2, 0.2, 1)", fill: "forwards" }
    );
    animRef.current = anim;
    anim.onfinish = () => {
      details.open = willOpen;
      state.current = willOpen ? "open" : "closed";
      animRef.current = null;
      anim.cancel(); // drop the forwards-fill so the body returns to natural height
    };
  };

  const toggle = (e) => {
    e.preventDefault(); // we control when the `open` attribute changes
    setExpanded(state.current === "closed" || state.current === "closing");
  };

  useEffect(() => {
    if (!overlay) return;
    const isOpen = () => state.current === "open" || state.current === "opening";
    const onPointerDown = (e) => {
      if (isOpen() && !detailsRef.current.contains(e.target)) setExpanded(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape" && isOpen()) setExpanded(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [overlay]);

  return (
    <details ref={detailsRef} className={className}>
      <summary onClick={toggle}>{summary}</summary>
      <div className="collapsibleBody" ref={bodyRef}>
        {children}
      </div>
    </details>
  );
}
