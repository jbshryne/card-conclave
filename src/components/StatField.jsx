import { STATS, STAT_OPS, statLabel, opSymbol } from "../utils/stats";

// Pick a stat and a comparison, type a number, and add it as a labeled chip ("Power ≥ 3").
// Several chips are combined with AND, so Mana Value ≥ 2 plus Mana Value ≤ 4 makes a range.
export default function StatField({ items, draft, onDraftChange, onAdd, onRemove, error }) {
  return (
    <section className="row">
      <div className="searchField statField">
        <span className="textInputSection">
          <label htmlFor="statValueInput">Stats:</label>
          <select
            aria-label="Stat"
            value={draft.stat}
            onChange={(e) => onDraftChange({ stat: e.target.value })}
          >
            {STATS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select
            aria-label="Comparison"
            value={draft.op}
            onChange={(e) => onDraftChange({ op: e.target.value })}
          >
            {STAT_OPS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <input
            id="statValueInput"
            className="statValue"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Number"
            value={draft.value}
            aria-invalid={!!error}
            onChange={(e) => onDraftChange({ value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.value.trim()) {
                e.preventDefault(); // Enter adds the chip; an empty box lets Enter submit the form
                onAdd();
              }
            }}
          />
          <button type="button" className="smallButton" onClick={onAdd}>
            Add to list
          </button>
        </span>

        {error && <p className="fieldError" role="alert">{error}</p>}

        <ul className="selectedParamList">
          {items.map((item, i) => (
            <li key={`${item.stat}${item.op}${item.value}`}>
              <span className="statChip">
                <span className="statName">{statLabel(item.stat)}</span> {opSymbol(item.op)} {item.value}
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${statLabel(item.stat)} ${opSymbol(item.op)} ${item.value}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
