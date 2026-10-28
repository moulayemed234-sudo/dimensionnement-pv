import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSettingsStore } from './i18n/settings';
import { useProjectStore } from './state/projectStore';
import '@fontsource-variable/manrope';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary onReset={() => useProjectStore.getState().newProject(useSettingsStore.getState().locale)}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
