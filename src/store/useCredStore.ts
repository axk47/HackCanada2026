import { create } from 'zustand'
import type { AppStep, CourseResult } from '@/types'

interface CredStore {
  step: AppStep
  fromUniversity: string
  toUniversity: string
  transcriptText: string
  results: CourseResult[]
  selectedCourse: CourseResult | null
  setStep: (step: AppStep) => void
  setFromUniversity: (u: string) => void
  setToUniversity: (u: string) => void
  setTranscriptText: (t: string) => void
  setResults: (r: CourseResult[]) => void
  setSelectedCourse: (c: CourseResult | null) => void
  reset: () => void
}

export const useCredStore = create<CredStore>((set) => ({
  step: 'upload',
  fromUniversity: '',
  toUniversity: '',
  transcriptText: '',
  results: [],
  selectedCourse: null,
  setStep: (step) => set({ step }),
  setFromUniversity: (fromUniversity) => set({ fromUniversity }),
  setToUniversity: (toUniversity) => set({ toUniversity }),
  setTranscriptText: (transcriptText) => set({ transcriptText }),
  setResults: (results) => set({ results }),
  setSelectedCourse: (selectedCourse) => set({ selectedCourse }),
  reset: () =>
    set({
      step: 'upload',
      fromUniversity: '',
      toUniversity: '',
      transcriptText: '',
      results: [],
      selectedCourse: null,
    }),
}))
