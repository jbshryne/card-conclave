export default function SizeControl({ value, onChange, sizes }) {
  return (
    <div className="sizeControl" role="group" aria-label="Card size">
      <span className="muted">Card size</span>
      <div className="sizeButtons">
        {Object.entries(sizes).map(([key, s]) => (
          <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
