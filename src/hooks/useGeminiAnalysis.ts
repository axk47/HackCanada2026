import { useState, useCallback } from 'react'
import { GoogleGenAI } from '@google/genai'
import type { CourseResult, TranscriptSummary, ParsedCourse } from '@/types'
import { getTransferContext } from '@/data/ontransfer'

const DOLLAR_PER_CREDIT = 800

const SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      name: { type: 'string' },
      credits: { type: 'number' },
      status: { type: 'string', enum: ['transfer', 'lost', 'partial'] },
      reason: { type: 'string' },
      action: { type: 'string' },
    },
    required: ['code', 'name', 'credits', 'status', 'reason', 'action'],
  },
}

function buildPrompt(
  text: string, 
  from: string, 
  to: string,
  summary: TranscriptSummary,
  courses: ParsedCourse[],
  targetProgram: string
): string {
  const transferContext = getTransferContext(from, to)
  
  return `You are a Canadian university credit transfer specialist with deep knowledge of Ontario's ONTransfer system (ontransfer.ca).

ONTARIO CREDIT SYSTEM (applies to ALL institutions involved):
Both the origin and destination are Ontario institutions.
ALL credits are measured in Ontario 0.5 units per course — NOT American semester hours.

Credit rules:
- One single-semester course = 0.5 credits (NEVER 3.0 or 4.0)
- One full-year course = 1.0 credits
- A full-time year = 5.0 credits (10 courses)
- NEVER return a creditHours value above 1.0 for a single course
- If uncertain, default to 0.5

FROM: ${from}
TO: ${to}
STUDENT YEAR: ${summary.currentYear} (${summary.totalCreditsCompleted} Ontario credits completed)
GPA: ${summary.gpa !== null ? summary.gpa.toFixed(2) + ' / 4.0' : 'Not available'}
CURRENT PROGRAM: ${summary.programDetected || 'Not specified'}
TARGET PROGRAM: ${targetProgram || 'Not specified'}

Transfer context:
${transferContext}

For upper-year courses (3rd/4th year students), note that transfer credit becomes less likely.
Factor GPA into whether student meets minimum transfer admission requirements 
(most Ontario universities require 2.0+ GPA for transfer).

Analyze ALL courses listed and determine transfer status for EACH. Return:
- code: the course code (e.g. "CS101")
- name: full course name
- credits: 0.5 for a half-course, 1.0 for a full-year course (Ontario units ONLY)
- status: "transfer" | "lost" | "partial"
- reason: 1-2 sentences explaining the decision
- action: 1 sentence on what the student can do

If a course is not clearly identifiable, skip it.
Return ONLY a JSON array. No markdown, no explanation text.

COURSES TO ANALYZE:
${courses.length > 0 ? courses.map(c => `- ${c.code} ${c.name} — ${c.creditHours} cr (${c.grade})`).join('\n') : 'No courses cleanly parsed. See raw transcript text below and identify all courses.'}

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
      to: string,
      summary: TranscriptSummary,
      courses: ParsedCourse[],
      targetProgram: string
    ) => {
      setLoading(true)
      setError(null)
      setResults([])
      setProgressText('Checking API Key...')

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        setError('Missing VITE_GEMINI_API_KEY in .env.local')
        setLoading(false)
        setProgressText('')
        return
      }

      const ai = new GoogleGenAI({ apiKey })
      const prompt = buildPrompt(transcriptText, from, to, summary, courses, targetProgram)

      // Retry up to 3 times with exponential backoff for 429 rate limits
      const DELAYS = [0, 4000, 9000]
      let lastError = ''

      for (let attempt = 0; attempt < DELAYS.length; attempt++) {
        if (DELAYS[attempt] > 0) {
          const secs = DELAYS[attempt] / 1000
          setProgressText(`Rate limited — retrying in ${secs}s...`)
          await new Promise(r => setTimeout(r, DELAYS[attempt]))
        }
        setProgressText(attempt > 0 ? 'Retrying Gemini analysis...' : 'Analyzing transfer credits...')

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: SCHEMA,
            },
          })

          const raw = response.text ?? ''
          const parsed = JSON.parse(raw) as Omit<CourseResult, 'dollarLost'>[]
          const enriched: CourseResult[] = parsed.map((c) => ({
            ...c,
            dollarLost: c.status === 'transfer' ? 0 : Math.round(c.credits * DOLLAR_PER_CREDIT * (c.status === 'partial' ? 0.5 : 1)),
          }))

          setResults(enriched)
          setProgressText('')
          setLoading(false)
          return  // success
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`Gemini attempt ${attempt + 1} failed:`, msg)

          // 429 → rate limit: retry
          if (msg.includes('429') || msg.toLowerCase().includes('resource exhausted') || msg.toLowerCase().includes('quota')) {
            lastError = `Gemini rate limit hit. ${attempt < DELAYS.length - 1 ? 'Retrying...' : 'Please wait a minute and try again.'}`
            continue
          }
          // Any other error → fail immediately
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
