/** One message at a time at the bottom of the screen, optionally with an undo. */
import { create } from 'zustand';
import type { ProjectData } from './projectStore';

interface ToastState {
  message: string | null;
  /** Project to restore when the engineer taps "Annuler". */
  undo: ProjectData | null;
  /** Changes on every show, so a repeated message restarts its timer. */
  id: number;
  show: (message: string, undo?: ProjectData) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  undo: null,
  id: 0,
  show: (message, undo) => set((state) => ({ message, undo: undo ?? null, id: state.id + 1 })),
  hide: () => set({ message: null, undo: null }),
}));
