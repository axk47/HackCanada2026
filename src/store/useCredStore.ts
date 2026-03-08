import { create } from 'zustand'
import type { AppStep, CourseResult, TranscriptSummary, ParsedCourse, TransferStats } from '@/types'
import type { University, ProgramKey } from '@/data/universities'

interface CredStore {
  step: AppStep
  uploadedFile: File | null
  fromUniversity: string
  toUniversity: string
  transcriptText: string
  transcriptSummary: TranscriptSummary | null
  parsedCourses: ParsedCourse[]
  targetProgram: string
  // New architecture fields
  programKey: ProgramKey
  isInternational: boolean
  destUniversity: University | null
  transferStats: TransferStats | null
  results: CourseResult[]
  selectedCourse: CourseResult | null
  // Setters
  setStep: (step: AppStep) => void
  setUploadedFile: (f: File | null) => void
  setFromUniversity: (u: string) => void
  setToUniversity: (u: string) => void
  setTranscriptText: (t: string) => void
  setTranscriptSummary: (s: TranscriptSummary | null) => void
  setParsedCourses: (c: ParsedCourse[]) => void
  setTargetProgram: (p: string) => void
  setProgramKey: (k: ProgramKey) => void
  setIsInternational: (v: boolean) => void
  setDestUniversity: (u: University | null) => void
  setTransferStats: (s: TransferStats | null) => void
  setResults: (r: CourseResult[]) => void
  setSelectedCourse: (c: CourseResult | null) => void
  reset: () => void
}

const defaults = {
  step: 'upload' as AppStep,
  uploadedFile: null,
  fromUniversity: '',
  toUniversity: '',
  transcriptText: '',
  transcriptSummary: null,
  parsedCourses: [],
  targetProgram: '',
  programKey: 'cs' as ProgramKey,
  isInternational: true,
  destUniversity: null,
  transferStats: null,
  results: [],
  selectedCourse: null,
}

export const useCredStore = create<CredStore>((set) => ({
  ...defaults,
  setStep:             (step) => set({ step }),
  setUploadedFile:     (uploadedFile) => set({ uploadedFile }),
  setFromUniversity:   (fromUniversity) => set({ fromUniversity }),
  setToUniversity:     (toUniversity) => set({ toUniversity }),
  setTranscriptText:   (transcriptText) => set({ transcriptText }),
  setTranscriptSummary:(transcriptSummary) => set({ transcriptSummary }),
  setParsedCourses:    (parsedCourses) => set({ parsedCourses }),
  setTargetProgram:    (targetProgram) => set({ targetProgram }),
  setProgramKey:       (programKey) => set({ programKey }),
  setIsInternational:  (isInternational) => set({ isInternational }),
  setDestUniversity:   (destUniversity) => set({ destUniversity }),
  setTransferStats:    (transferStats) => set({ transferStats }),
  setResults:          (results) => set({ results }),
  setSelectedCourse:   (selectedCourse) => set({ selectedCourse }),
  reset: () => set(defaults),
}))
