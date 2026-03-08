import { useState, useCallback } from 'react'
import type { CourseResult, TranscriptSummary, ParsedCourse } from '@/types'
import type { University, ProgramKey } from '@/data/universities'

// New Gemini schema — category-based, no dollarLost
const SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      code:          { type: 'string' },
      name:          { type: 'string' },
      grade:         { type: 'number' },
      gradePercent:  { type: 'number' },
      creditHours:   { type: 'number' },
      category:      { type: 'string', enum: ['cs_core','cs_elective','math','business_core','science_core','elective','other'] },
      eligible:      { type: 'boolean' },
      likelyOutcome: { type: 'string', enum: ['transfer','review','lost'] },
      reason:        { type: 'string' },
    },
    required: ['code','name','grade','gradePercent','creditHours','category','eligible','likelyOutcome','reason'],
  },
}

function buildPrompt(
  text: string,
  from: string,
  destination: University,
  summary: TranscriptSummary,
  _courses: ParsedCourse[],
  programKey: ProgramKey
): string {
  const prog = destination.programs[programKey]
  return `You are analyzing a Brock University transcript for a student transferring to ${destination.name}.

ONTARIO CREDIT SYSTEM (CRITICAL):
- Brock University uses 0.5 credit units per course — NEVER use American semester hours (3.0)
- Every course on this transcript is worth exactly 0.5 credits unless explicitly noted as full-year (1.0)
- NEVER return creditHours greater than 1.0

TRANSFER ELIGIBILITY RULE (Ontario-wide, non-negotiable):
- Grade >= ${destination.minGradeForTransfer}% → course IS ELIGIBLE (eligible: true)
- Grade < ${destination.minGradeForTransfer}% → course is NOT eligible (eligible: false, likelyOutcome: "lost")

YOUR ROLE:
You CANNOT determine exact course equivalencies — those are confirmed only after official admission assessment.
Your job:
1. Identify each course's subject category
2. Set eligibility by grade threshold
3. Estimate transfer likelihood based on category matching

COURSE CATEGORIES:
- "cs_core"       → programming, algorithms, data structures, OS, networks, databases
- "cs_elective"   → upper CS electives, AI, security, graphics, theory
- "math"          → calculus, discrete math, statistics, linear algebra
- "business_core" → accounting, finance, marketing, management, economics
- "science_core"  → biology, chemistry, physics, lab sciences
- "elective"      → general electives, breadth, humanities, social science
- "other"         → unclear, non-matching, or physical education

LIKELY OUTCOME RULES:
- grade >= ${destination.minGradeForTransfer} AND category directly matches ${programKey} program → "transfer"
- grade >= ${destination.minGradeForTransfer} AND category is "elective" or "other" → "review"
- grade < ${destination.minGradeForTransfer} → "lost"

DESTINATION PROGRAM: ${prog?.name ?? programKey} at ${destination.name}
STUDENT YEAR: ${summary.currentYear} (${summary.totalCreditsCompleted} Brock credits completed)
GPA: ${summary.gpa !== null ? summary.gpa.toFixed(2) + ' / 4.0' : 'Not available'}

Analyze ALL courses from the transcript below.
Return ONLY a JSON array, no markdown, no explanation.

RAW TRANSCRIPT DATA:
${text}
`
}

export function useGeminiAnalysis() {
  const [results, setResults] = useState<CourseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressText, setProgressText] = useState('')

  const analyze = useCallback(
    async (
      transcriptText: string,
      from: string,
      destination: University,
      summary: TranscriptSummary,
      courses: ParsedCourse[],
      programKey: ProgramKey
    ) => {
      setLoading(true)
      setError(null)
      setResults([])
      setProgressText('Checking API Key...')

      const prompt = buildPrompt(transcriptText, from, destination, summary, courses, programKey)

      const DELAYS = [0, 4000, 9000]
      let lastError = ''

      for (let attempt = 0; attempt < DELAYS.length; attempt++) {
        if (DELAYS[attempt] > 0) {
          const secs = DELAYS[attempt] / 1000
          setProgressText(`Rate limited — retrying in ${secs}s...`)
          await new Promise(r => setTimeout(r, DELAYS[attempt]))
        }
        setProgressText(attempt > 0 ? 'Retrying Gemini analysis...' : 'Categorizing transfer eligibility...')

        try {
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, schema: SCHEMA }),
          })

          if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            if (response.status === 429) {
              throw new Error('429 Rate Limited')
            }
            throw new Error(err.error || 'Failed to extract transcript via Gemini')
          }

          const parsed = await response.json() as Array<{
            code: string; name: string; grade: number; gradePercent: number
            creditHours: number; category: string; eligible: boolean
            likelyOutcome: string; reason: string
          }>

          // Map to CourseResult — dollarLost computed in ProcessingScreen
          const enriched: CourseResult[] = parsed.map(c => ({
            code:         c.code,
            name:         c.name,
            credits:      c.creditHours ?? 0.5,
            grade:        c.gradePercent ?? c.grade,
            category:     c.category as CourseResult['category'],
            eligible:     c.eligible,
            likelyOutcome:c.likelyOutcome as CourseResult['likelyOutcome'],
            // map likelyOutcome → legacy status field
            status:       c.likelyOutcome === 'transfer' ? 'transfer'
                        : c.likelyOutcome === 'lost'     ? 'lost'
                        : 'partial',
            reason:  c.reason,
            action:  c.eligible
              ? `Check the official ONTransfer database at ontransfer.ca for confirmed equivalency at ${destination.name}.`
              : `This course did not meet the minimum ${destination.minGradeForTransfer}% transfer grade threshold.`,
            dollarLost: 0, // computed in ProcessingScreen using real tuition data
          }))

          setResults(enriched)
          setProgressText('')
          setLoading(false)
          return
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`Gemini attempt ${attempt + 1} failed:`, msg)
          if (msg.includes('429') || msg.toLowerCase().includes('resource exhausted')) {
            lastError = `Gemini rate limit hit. ${attempt < DELAYS.length - 1 ? 'Retrying...' : 'Please wait a minute and try again.'}`
            continue
          }
          lastError = msg
          break
        }
      }

      setError(lastError || 'Gemini analysis failed')
      setProgressText('')
      setLoading(false)
    },
    []
  )

  return { analyze, results, loading, error, progressText }
}
