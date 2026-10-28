import type { ReactNode } from 'react';
import type { SizingOutcome } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { formatNumber, formatUp } from '../../ui/numbers';

/** Panels → charge controller → batteries → inverter, with the computed sizes. Energy flows left to right in both languages. */
export function SystemDiagram({ outcome }: { outcome: SizingOutcome }) {
  const { t } = useI18n();
  const r = outcome.ok ? outcome.results : null;
  const dash = '—';

  return (
    <section className="card diagram" aria-labelledby="diagram-title">
      <div className="card__header">
        <div>
          <h2 id="diagram-title" className="card__title">
            {t('diagram.title')}
          </h2>
          <p className="card__subtitle">{t('diagram.subtitle')}</p>
        </div>
      </div>
      <div className="diagram__flow" dir="ltr">
        <DiagramNode
          art={<PanelArt />}
          label={t('diagram.pv')}
          value={r ? `${formatNumber(r.pvArray.installedPowerW / 1000, 2)} kW` : dash}
          detail={r ? `(${r.pvArray.panelCount} × ${formatNumber(r.pvArray.panelPowerW)} W)` : ''}
        />
        <Arrow />
        <DiagramNode art={<ControllerArt />} label={t('diagram.mppt')} value="MPPT" detail="" />
        <Arrow />
        <DiagramNode
          art={<BatteryArt />}
          label={t('diagram.batteries')}
          value={r ? `${r.systemVoltage.voltage} V · ${formatUp(r.battery.nominalEnergyWh / 1000, 2)} kWh` : dash}
          detail={r ? `(${formatUp(r.battery.capacityAh)} Ah)` : ''}
        />
        <Arrow />
        <DiagramNode
          art={<InverterArt />}
          label={t('diagram.inverter')}
          value={r ? `${formatUp(r.inverter.ratingW / 1000, 2)} kW` : dash}
          detail={r ? `(E_T × ${formatNumber(r.inverter.safetyFactor, 2)})` : ''}
        />
      </div>
    </section>
  );
}

function DiagramNode({ art, label, value, detail }: { art: ReactNode; label: string; value: string; detail: string }) {
  const { dir } = useI18n();
  return (
    <figure className="diagram__node">
      <div className="diagram__art">{art}</div>
      <figcaption dir={dir}>
        <span className="diagram__label">{label}</span>
        <span className="diagram__value num">{value}</span>
        {detail ? <span className="diagram__detail num">{detail}</span> : null}
      </figcaption>
    </figure>
  );
}

function Arrow() {
  return (
    <svg className="diagram__arrow" viewBox="0 0 48 16" aria-hidden="true">
      <path d="M2 8h40M36 3l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PanelArt() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <path d="M58 70v18M44 88h30" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 8h92l-10 62H8z" fill="#1d4ed8" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round" />
      <g stroke="#93c5fd" strokeWidth="1.4" opacity="0.85">
        <path d="M16.3 23.5h92M14 39h91.5M11.6 54.5h91.7" />
        <path d="M41 8l-8 62M64 8l-6 62M87 8l-4 62" />
      </g>
      <path d="M22 12l20 0-4 20H18z" fill="#ffffff" opacity="0.18" />
    </svg>
  );
}

function ControllerArt() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <rect x="18" y="8" width="60" height="80" rx="6" fill="#1e40af" />
      <rect x="28" y="18" width="40" height="24" rx="3" fill="#0f172a" />
      <path d="M32 34l6-8 6 6 6-10 6 12" fill="none" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="#f59e0b">
        <circle cx="34" cy="56" r="3.5" />
        <circle cx="48" cy="56" r="3.5" />
        <circle cx="62" cy="56" r="3.5" />
      </g>
      <rect x="28" y="70" width="40" height="8" rx="2" fill="#0f172a" opacity="0.6" />
    </svg>
  );
}

function BatteryArt() {
  const block = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y + 5} width="44" height="34" rx="4" fill="#1e3a5f" />
      <rect x={x + 7} y={y} width="8" height="6" rx="1.5" fill="#cbd5e1" />
      <rect x={x + 29} y={y} width="8" height="6" rx="1.5" fill="#cbd5e1" />
      <rect x={x + 6} y={y + 14} width="32" height="6" rx="2" fill="#38bdf8" opacity="0.7" />
    </g>
  );
  return (
    <svg viewBox="0 0 110 96" aria-hidden="true">
      {block(6, 8)}
      {block(58, 8)}
      {block(6, 50)}
      {block(58, 50)}
    </svg>
  );
}

function InverterArt() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <rect x="14" y="6" width="68" height="84" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
      <rect x="26" y="18" width="44" height="22" rx="3" fill="#0f172a" />
      <path d="M32 29c4-8 8-8 12 0s8 8 12 0" fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" />
      <g fill="#64748b">
        <rect x="26" y="52" width="44" height="4" rx="2" />
        <rect x="26" y="62" width="44" height="4" rx="2" />
      </g>
      <circle cx="36" cy="78" r="3" fill="#22c55e" />
    </svg>
  );
}
