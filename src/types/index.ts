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
  currentYear: number
  programDetected?: string
}

export interface CourseResult {
  code: string
  name: string
  credits: number
  status: CourseStatus
  reason: string
  action: string
  dollarLost: number
}

export type AppStep = 'upload' | 'processing' | 'scene'
