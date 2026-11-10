import { useState } from "react";

// One search row: text input + "add to list", optional random picker,
// optional suggestions, and the chosen terms.
// onAdd receives either a string (typed) or an {label, value} item (suggestion).
// onRandom(category) must resolve to an {label, value} item.
export default function ListField({
  id, label, placeholder, items, onAdd, onRemove,
  randomOptions, onRandom, suggest,
}) {
  const [text, setText] = useState("");
  const [pick, setPick] = useState(randomOptions?.[0]?.value);

  const trimmed = text.trim();
  const suggestions = suggest && trimmed.length >= 2 ? suggest(trimmed).slice(0, 8) : [];

  const addTyped = () => {
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  };

  return (
    <section className="row">
      <div className="searchField">
        <span className="textInputSection">
          <label htmlFor={id}>{label}</label>
          <input
            id={id}
            type="text"
            value={text}
            placeholder={placeholder}
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && trimmed) {
                e.preventDefault(); // Enter adds to the list; an empty box lets Enter submit
                addTyped();
              }
            }}
          />
          <button type="button" className="smallButton" onClick={addTyped}>
            Add to list
          </button>
        </span>

        {randomOptions && (
          <details className="randomControls">
            <summary>Random</summary>
            <div className="rc-content">
              <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={`${label} random category`}>
                {randomOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
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
          </details>
        )}

        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s) => (
              <button
                type="button"
                key={s.value + s.label}
                onClick={() => { onAdd(s); setText(""); }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <ul className="selectedParamList">
          {items.map((item, i) => (
            <li key={item.label + i}>
              {item.label}
              <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${item.label}`}>×</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
