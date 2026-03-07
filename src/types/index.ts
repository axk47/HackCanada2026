export type CourseStatus = 'transfer' | 'lost' | 'partial'

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
