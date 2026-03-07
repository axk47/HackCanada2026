import { create } from 'zustand';
import type { AppStep, Course, TransferResult } from '@/types';

interface CredCheckState {
  step: AppStep;
  fromUniversity: string;
  toUniversity: string;
  courses: Course[];
  results: TransferResult[];
  selectedResult: TransferResult | null;
  isPlayingVoice: boolean;
  // computed
  totalCreditHours: number;
  lostCreditHours: number;
  partialCreditHours: number;
  transferCreditHours: number;
  totalDollarLoss: number;
  // actions
  setStep: (step: AppStep) => void;
  setFromUniversity: (u: string) => void;
  setToUniversity: (u: string) => void;
  setCourses: (courses: Course[]) => void;
  setResults: (results: TransferResult[]) => void;
  selectResult: (r: TransferResult | null) => void;
  setIsPlayingVoice: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  step: 'upload' as AppStep,
  fromUniversity: '',
  toUniversity: '',
  courses: [],
  results: [],
  selectedResult: null,
  isPlayingVoice: false,
  totalCreditHours: 0,
  lostCreditHours: 0,
  partialCreditHours: 0,
  transferCreditHours: 0,
  totalDollarLoss: 0,
};

function computeStats(results: TransferResult[]) {
  const total = results.reduce((s, r) => s + r.course.creditHours, 0);
  const lost = results.filter(r => r.status === 'lost').reduce((s, r) => s + r.course.creditHours, 0);
  const partial = results.filter(r => r.status === 'partial').reduce((s, r) => s + r.course.creditHours, 0);
  const transfer = results.filter(r => r.status === 'transfer').reduce((s, r) => s + r.course.creditHours, 0);
  const dollarLoss = results.filter(r => r.status !== 'transfer').reduce((s, r) => s + r.dollarValue, 0);
  return { totalCreditHours: total, lostCreditHours: lost, partialCreditHours: partial, transferCreditHours: transfer, totalDollarLoss: dollarLoss };
}

export const useCredCheckStore = create<CredCheckState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setFromUniversity: (fromUniversity) => set({ fromUniversity }),
  setToUniversity: (toUniversity) => set({ toUniversity }),
  setCourses: (courses) => set({ courses }),
  setResults: (results) => set({ results, ...computeStats(results) }),
  selectResult: (selectedResult) => set({ selectedResult }),
  setIsPlayingVoice: (isPlayingVoice) => set({ isPlayingVoice }),
  reset: () => set(initialState),
}));
