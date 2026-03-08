import { create } from 'zustand'
import type { AppStep, CourseResult, TranscriptSummary, ParsedCourse } from '@/types'

interface CredStore {
  step: AppStep
  fromUniversity: string
  toUniversity: string
  transcriptText: string
  transcriptSummary: TranscriptSummary | null
  parsedCourses: ParsedCourse[]
  targetProgram: string
  manualGpa: string
  manualProgram: string
  results: CourseResult[]
  selectedCourse: CourseResult | null
  setStep: (step: AppStep) => void
  setFromUniversity: (u: string) => void
  setToUniversity: (u: string) => void
  setTranscriptText: (t: string) => void
  setTranscriptSummary: (s: TranscriptSummary | null) => void
  setParsedCourses: (c: ParsedCourse[]) => void
  setTargetProgram: (p: string) => void
  setManualGpa: (g: string) => void
  setManualProgram: (p: string) => void
  setResults: (r: CourseResult[]) => void
  setSelectedCourse: (c: CourseResult | null) => void
  reset: () => void
}

export const useCredStore = create<CredStore>((set) => ({
  step: 'upload',
  fromUniversity: '',
  toUniversity: '',
  transcriptText: '',
  transcriptSummary: null,
  parsedCourses: [],
  targetProgram: '',
  manualGpa: '',
  manualProgram: '',
  results: [],
  selectedCourse: null,
  setStep: (step) => set({ step }),
  setFromUniversity: (fromUniversity) => set({ fromUniversity }),
  setToUniversity: (toUniversity) => set({ toUniversity }),
  setTranscriptText: (transcriptText) => set({ transcriptText }),
  setTranscriptSummary: (transcriptSummary) => set({ transcriptSummary }),
  setParsedCourses: (parsedCourses) => set({ parsedCourses }),
  setTargetProgram: (targetProgram) => set({ targetProgram }),
  setManualGpa: (manualGpa) => set({ manualGpa }),
  setManualProgram: (manualProgram) => set({ manualProgram }),
  setResults: (results) => set({ results }),
  setSelectedCourse: (selectedCourse) => set({ selectedCourse }),
  reset: () =>
    set({
      step: 'upload',
      fromUniversity: '',
      toUniversity: '',
      transcriptText: '',
      transcriptSummary: null,
      parsedCourses: [],
      targetProgram: '',
      manualGpa: '',
      manualProgram: '',
      results: [],
      selectedCourse: null,
    }),
}))
