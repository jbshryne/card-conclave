import { useState } from "react";
import Collapsible from "./Collapsible.jsx";
import { useHiddenSet } from "../utils/useHiddenSet";

const FORMAT_NAMES = {
  paupercommander: "Pauper Commander", standardbrawl: "Standard Brawl",
  oldschool: "Old School", predh: "Pre-DH", premodern: "Premodern",
};
const formatName = (f) => FORMAT_NAMES[f] ?? f.charAt(0).toUpperCase() + f.slice(1);
const STATUS = { legal: "Legal", not_legal: "Not legal", banned: "Banned", restricted: "Restricted" };

// The Format legalities panel. "Choose formats" lets you hide formats you don't play;
// the choice is remembered (in this browser) for every card.
export default function Legalities({ legalities }) {
  const [hidden, toggle, showAll, hideAll] = useHiddenSet("cardConclaveHiddenFormats");
  const [editing, setEditing] = useState(false);
  const entries = Object.entries(legalities);
  const visible = editing ? entries : entries.filter(([format]) => !hidden.has(format));

  return (
    <Collapsible overlay className="overlayPanel" summary="Format legalities">
      <div className="panelTools">
        {editing && (
          <>
            <button type="button" className="linkButton" onClick={showAll}>Show all</button>
            <button
              type="button"
              className="linkButton"
              onClick={() => hideAll(entries.map(([format]) => format))}
            >
              Clear all
            </button>
          </>
        )}
        <button type="button" className="linkButton" onClick={() => setEditing((e) => !e)}>
          {editing ? "Done" : "Choose formats"}
        </button>
      </div>
      {visible.length === 0 && (
        <p className="muted">Every format is hidden. Use “Choose formats” to show some.</p>
      )}
      <ul className="legalities">
        {visible.map(([format, status]) => (
          <li key={format} className={hidden.has(format) ? "isHidden" : undefined}>
            {editing ? (
              <label>
                <input type="checkbox" checked={!hidden.has(format)} onChange={() => toggle(format)} />{" "}
                {formatName(format)}
              </label>
            ) : (
              <span>{formatName(format)}</span>
            )}
            <span className={`badge ${status}`}>{STATUS[status] ?? status}</span>
          </li>
        ))}
      </ul>
    </Collapsible>
  );
}
