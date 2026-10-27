import type { ReactNode } from 'react';

interface StatProps {
  label: ReactNode;
  value: string;
  unit: string;
  note?: string | undefined;
}

/** One headline figure; render inside `<dl className="stats">`. */
export function Stat({ label, value, unit, note }: StatProps) {
  return (
    <div className="stat">
      <dt className="stat__label">{label}</dt>
      <dd className="stat__value">
        {value}
        <span className="stat__unit">{unit}</span>
      </dd>
      {note ? <dd className="stat__note">{note}</dd> : null}
    </div>
  );
}
