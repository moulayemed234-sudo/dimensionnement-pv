import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useSettingsStore } from '../i18n/settings';
import { makeI18n } from '../i18n/useI18n';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Replaces the project with a clean one, e.g. after a corrupted saved draft. */
  onReset: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Last line of defence: an unexpected error shows a recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unexpected UI error', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const { t } = makeI18n(useSettingsStore.getState().locale);
    return (
      <div className="fatal-wrap">
        <div className="card fatal" role="alert">
          <h1 className="card__title">{t('fatal.title')}</h1>
          <p>{t('fatal.body', { message: this.state.error.message })}</p>
          <p>{t('fatal.hint')}</p>
          <div>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                this.props.onReset();
                this.setState({ error: null });
              }}
            >
              {t('fatal.reset')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
