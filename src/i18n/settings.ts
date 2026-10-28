/** Interface preferences (language, theme), remembered on this device. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '../engine/messages';

export type Theme = 'light' | 'dark';

interface SettingsState {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: 'ar',
      theme: 'light',
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'offgrid-pv-sizing:settings', version: 1 },
  ),
);
