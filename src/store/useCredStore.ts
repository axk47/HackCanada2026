import { create } from 'zustand'
import type { AppStep, CourseResult, TranscriptSummary, ParsedCourse } from '@/types'

interface CredStore {
  step: AppStep
  uploadedFile: File | null
  fromUniversity: string
  toUniversity: string
  transcriptText: string
  transcriptSummary: TranscriptSummary | null
  parsedCourses: ParsedCourse[]
  targetProgram: string
  results: CourseResult[]
  selectedCourse: CourseResult | null
  setStep: (step: AppStep) => void
  setUploadedFile: (f: File | null) => void
  setFromUniversity: (u: string) => void
  setToUniversity: (u: string) => void
  setTranscriptText: (t: string) => void
  setTranscriptSummary: (s: TranscriptSummary | null) => void
  setParsedCourses: (c: ParsedCourse[]) => void
  setTargetProgram: (p: string) => void
  setResults: (r: CourseResult[]) => void
  setSelectedCourse: (c: CourseResult | null) => void
  reset: () => void
}

export const useCredStore = create<CredStore>((set) => ({
  step: 'upload',
  uploadedFile: null,
  fromUniversity: '',
  toUniversity: '',
  transcriptText: '',
  transcriptSummary: null,
  parsedCourses: [],
  targetProgram: '',
  results: [],
  selectedCourse: null,
  setStep: (step) => set({ step }),
  setUploadedFile: (uploadedFile) => set({ uploadedFile }),
  setFromUniversity: (fromUniversity) => set({ fromUniversity }),
  setToUniversity: (toUniversity) => set({ toUniversity }),
  setTranscriptText: (transcriptText) => set({ transcriptText }),
  setTranscriptSummary: (transcriptSummary) => set({ transcriptSummary }),
  setParsedCourses: (parsedCourses) => set({ parsedCourses }),
  setTargetProgram: (targetProgram) => set({ targetProgram }),
  setResults: (results) => set({ results }),
  setSelectedCourse: (selectedCourse) => set({ selectedCourse }),
  reset: () =>
    set({
      step: 'upload',
      uploadedFile: null,
      fromUniversity: '',
      toUniversity: '',
      transcriptText: '',
      transcriptSummary: null,
      parsedCourses: [],
      targetProgram: '',
      results: [],
      selectedCourse: null,
    }),
}))
