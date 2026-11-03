interface BarProps {
  value: number;
  max: number;
  /** 'hp' (crimson) or 'qi' (jade). */
  kind: 'hp' | 'qi';
  label: string;
}

/** A labelled resource bar. */
export default function Bar({ value, max, kind, label }: BarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`bar bar-${kind}`} role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="bar-text">
        {label} {value}/{max}
      </span>
    </div>
  );
}
