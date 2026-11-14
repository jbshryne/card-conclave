import { useId, useState } from "react";
import Collapsible from "./Collapsible.jsx";

// One search row: text input + "add to list", optional random picker,
// an autosuggest dropdown that floats over the page, and the chosen terms.
// onAdd receives either a string (typed) or an {label, value} item (suggestion/random).
// onRandom(category) must resolve to an {label, value} item.
export default function ListField({
  id, label, placeholder, items, onAdd, onRemove, onToggle, text, onTextChange,
  randomOptions, onRandom, suggest,
}) {
  const setText = onTextChange; // the typed text is owned by the form, which includes it when you search
  const [pick, setPick] = useState(randomOptions?.[0]?.value);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const trimmed = text.trim();
  const negated = /^-(?!\d)/.test(trimmed); // "-elf" = exclude; "-1/-1" stays literal rules text
  const lookup = negated ? trimmed.slice(1).trim() : trimmed;
  const suggestions = suggest && lookup.length >= 2 ? suggest(lookup).slice(0, 8) : [];
  const open = focused && !dismissed && suggestions.length > 0;

  const choose = (item) => {
    onAdd(negated ? { ...item, negate: true } : item);
    setText("");
    setActive(-1);
  };
  const addTyped = () => {
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  };

  const onKeyDown = (e) => {
    if (open && e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (open && e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setDismissed(true);
      setActive(-1);
    } else if (e.key === "Enter" && trimmed) {
      e.preventDefault(); // Enter picks the highlighted suggestion or adds the typed text; an empty box lets Enter submit
      if (open && active >= 0) choose(suggestions[active]);
      else addTyped();
    }
  };

  return (
    <section className="row">
      <div className="searchField">
        <span className="textInputSection">
          <label htmlFor={id}>{label}</label>
          <span className="inputWrap">
            <input
              id={id}
              type="text"
              value={text}
              placeholder={placeholder}
              autoComplete="off"
              role={suggest ? "combobox" : undefined}
              aria-expanded={suggest ? open : undefined}
              aria-controls={suggest ? listId : undefined}
              aria-autocomplete={suggest ? "list" : undefined}
              aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
              onChange={(e) => {
                setText(e.target.value);
                setActive(-1);
                setDismissed(false);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onKeyDown}
            />
            {open && (
              <ul className="suggestions" role="listbox" id={listId}>
                {suggestions.map((s, i) => (
                  <li
                    key={s.value + s.label}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus in the input
                      choose(s);
                    }}
                    onMouseEnter={() => setActive(i)}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
          </span>
          <button type="button" className="smallButton" onClick={addTyped}>
            Add to list
          </button>
        </span>

        {randomOptions && (
          <Collapsible className="randomControls" summary="Random">
            <div className="rc-content">
              {randomOptions.length > 1 && (
                <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={`${label} random category`}>
                  {randomOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="smallButton"
                onClick={async () => {
                  const item = await onRandom(pick);
                  if (item) onAdd(item);
                }}
              >
                Add random
              </button>
            </div>
          </Collapsible>
        )}

        <ul className="selectedParamList">
          {items.map((item, i) => (
            <li key={item.label + i} className={item.negate ? "negated" : undefined}>
              <button
                type="button"
                className="chipToggle"
                aria-pressed={!!item.negate}
                title="Click to switch between include and NOT"
                onClick={() => onToggle(i)}
              >
                {item.negate && <span className="notTag">NOT</span>}
                {item.label}
              </button>
              <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${item.label}`}>×</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
