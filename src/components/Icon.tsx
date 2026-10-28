/** Line icons drawn inline (no icon font, works offline). 24 × 24 grid, stroke = currentColor. */

const PATHS = {
  plus: 'M12 5v14M5 12h14',
  upload: 'M12 15V4M7 9l5-5 5 5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
  calculator: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 7h8v3H8zM8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17.5h.01M12 17.5h.01M15.5 17.5h.01',
  battery: 'M9 3h6M7 5h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM12 9l-2 4h4l-2 4',
  inverter: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM13 7l-3 5h4l-3 5',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  panel: 'M3 5h18l-2 10H5zM5.7 8.3h12.6M4.7 11.6h14.6M9 5l-1 10M15 5l1 10M12 15v4M8 20h8',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  printer: 'M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 15h6M9 18h4',
  save: 'M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 3v5h7V3M7 14h10v7H7z',
  plug: 'M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
  fan: 'M12 12a2 2 0 1 0 0 .01M12 10c0-4 1-7 4-7 2 0 2.5 3-4 7zM14 12c4 0 7 1 7 4 0 2-3 2.5-7-4zM12 14c0 4-1 7-4 7-2 0-2.5-3 4-7zM10 12c-4 0-7-1-7-4 0-2 3-2.5 7 4z',
  fridge: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM6 10h12M9 5.5v2M9 13v3',
  snowflake: 'M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5',
  tv: 'M3 6h18v11H3zM8 21h8M12 17v4',
  laptop: 'M5 5h14v10H5zM3 19h18l-2-4H5z',
  phone: 'M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2',
  pump: 'M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z',
  ac: 'M3 5h18v7H3zM6 9h12M7 15c0 2-1 3-1 3M12 15v4M17 15c0 2 1 3 1 3',
  washer: 'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM7.5 6h.01M10.5 6h.01',
  alert: 'M12 3 2 20h20zM12 10v4M12 17v.01',
  chevronDown: 'M6 9l6 6 6-6',
  chevronStart: 'M15 6l-6 6 6 6',
  chevronEnd: 'M9 6l6 6-6 6',
  arrowRight: 'M4 12h15M14 7l5 5-5 5',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number | undefined;
  className?: string | undefined;
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
