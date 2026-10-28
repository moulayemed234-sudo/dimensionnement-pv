/** Which design step is open. Not saved: every visit starts on the load table. */
import { create } from 'zustand';

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export const STEPS: readonly StepNumber[] = [1, 2, 3, 4, 5, 6];

interface UiState {
  step: StepNumber;
  setStep: (step: StepNumber) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  step: 1,
  setStep: (step) => set({ step }),
}));
