import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useProjectStore } from './state/projectStore';
import '@fontsource-variable/manrope';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary onReset={() => useProjectStore.getState().newProject()}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
