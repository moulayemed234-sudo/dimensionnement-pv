import { Icon } from '../../components/Icon';
import type { Locale } from '../../engine/messages';
import { useSettingsStore } from '../../i18n/settings';
import { useI18n } from '../../i18n/useI18n';
import { useProjectStore } from '../../state/projectStore';

const LANGUAGES: readonly { locale: Locale; label: string }[] = [
  { locale: 'ar', label: 'العربية' },
  { locale: 'fr', label: 'Français' },
];

/** Navy application bar: brand, language, theme and the engineer on the project. */
export function TopBar() {
  const { t } = useI18n();
  const locale = useSettingsStore((state) => state.locale);
  const setLocale = useSettingsStore((state) => state.setLocale);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const engineer = useProjectStore((state) => state.info.engineer);

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <BrandMark />
        <div>
          <p className="topbar__name">{t('brand.name')}</p>
          <p className="topbar__tagline">{t('brand.tagline')}</p>
        </div>
      </div>

      <div className="topbar__actions">
        <div className="lang-switch" role="group" aria-label={t('header.language')}>
          <Icon name="globe" size={18} />
          {LANGUAGES.map((language) => (
            <button
              key={language.locale}
              type="button"
              className="lang-switch__option"
              lang={language.locale}
              aria-pressed={locale === language.locale}
              onClick={() => setLocale(language.locale)}
            >
              {language.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="topbar__icon-button"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? t('header.themeToDark') : t('header.themeToLight')}
          title={theme === 'light' ? t('header.themeToDark') : t('header.themeToLight')}
        >
          <Icon name={theme === 'light' ? 'sun' : 'moon'} />
        </button>
        <span className="topbar__divider" aria-hidden="true" />
        <span className="topbar__user">
          <span className="topbar__avatar">
            <Icon name="user" size={18} />
          </span>
          <span className="topbar__user-name">{engineer?.trim() || t('header.engineer')}</span>
        </span>
      </div>
    </header>
  );
}

/** Sun over a solar panel, in the brand's amber. */
export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g stroke="#f5b324" strokeWidth="3" strokeLinecap="round">
        <path d="M20 4v6M8.7 8.7l4.2 4.2M4 20h6M31.3 8.7l-4.2 4.2M36 20h-6" />
      </g>
      <circle cx="20" cy="22" r="9" fill="#f5b324" />
      <path d="M22 30h38l-8 28H14z" fill="#f5b324" />
      <path
        d="M27.5 30l-5 28M37 30l-3.5 28M46.5 30l-2 28M55 30l-.5 28M20 39.5h38M17.5 49h38.5"
        stroke="#1c2c4c"
        strokeWidth="2.2"
      />
    </svg>
  );
}
