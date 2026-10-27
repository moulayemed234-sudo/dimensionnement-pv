import { Component, type ErrorInfo, type ReactNode } from 'react';

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
    return (
      <div className="app">
        <div className="card fatal" role="alert">
          <h1 className="card__title">Une erreur est survenue</h1>
          <p>L'application a rencontré une erreur inattendue&nbsp;: {this.state.error.message}</p>
          <p>Démarrer un nouveau projet efface le brouillon enregistré qui a pu la provoquer.</p>
          <div>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                this.props.onReset();
                this.setState({ error: null });
              }}
            >
              Démarrer un nouveau projet
            </button>
          </div>
        </div>
      </div>
    );
  }
}
