import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the built app runs from any folder or local server.
  base: './',
});
