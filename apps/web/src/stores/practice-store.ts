import { create } from "zustand";
import type { QuestionChoice } from "@engtoeic/shared";

type PracticeState = {
  selectedChoice: QuestionChoice | null;
  isSubmitted: boolean;
  selectChoice: (choice: QuestionChoice) => void;
  submit: () => void;
  reset: () => void;
};

export const usePracticeStore = create<PracticeState>((set) => ({
  selectedChoice: null,
  isSubmitted: false,
  selectChoice: (choice) => set({ selectedChoice: choice, isSubmitted: false }),
  submit: () => set({ isSubmitted: true }),
  reset: () => set({ selectedChoice: null, isSubmitted: false }),
}));
