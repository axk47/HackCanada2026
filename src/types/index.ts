import type { University, ProgramKey } from '@/data/universities'

export type CourseCategory =
  | 'cs_core' | 'cs_elective' | 'math' | 'business_core'
  | 'science_core' | 'elective' | 'other'

export type LikelyOutcome = 'transfer' | 'review' | 'lost'

// Kept for backwards compatibility — OrbitalScene uses this field
export type CourseStatus = 'transfer' | 'lost' | 'partial'

export interface ParsedCourse {
  code: string
  name: string
  creditHours: number
  grade: string
}

export interface TranscriptSummary {
  studentName?: string
  totalCreditsCompleted: number
  gpa: number | null
  gpaPercent?: number
  currentYear: number
  programDetected?: string
  coursesFound: number
  extractionConfidence?: 'high' | 'medium' | 'low'
}

export interface CourseResult {
  code: string
  name: string
  credits: number          // Brock 0.5 units
  grade: number            // percentage
  category: CourseCategory
  eligible: boolean        // grade >= 60
  likelyOutcome: LikelyOutcome
  status: CourseStatus     // mapped from likelyOutcome ('review' → 'partial')
  reason: string
  action: string
  dollarLost: number
}

export interface TransferStats {
  transferredBrockCredits: number
  transferredDestCredits: number
  lostBrockCredits: number
  reviewBrockCredits: number
  valueAtRisk: {
    min: number
    max: number
    display: string
  }
  destGPA: number
}

export type AppStep = 'upload' | 'processing' | 'scene'

export type { University, ProgramKey }
