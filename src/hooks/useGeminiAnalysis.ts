import { useState, useCallback } from 'react'
import { GoogleGenAI } from '@google/genai'
import type { CourseResult } from '@/types'
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

function buildPrompt(text: string, from: string, to: string): string {
  const transferContext = getTransferContext(from, to)
  return `You are a Canadian university credit transfer specialist with deep knowledge of Ontario's ONTransfer system (ontransfer.ca).

A student is transferring from ${from} to ${to}.

Transfer context:
${transferContext}

Analyze the following university transcript and determine the transfer status for EACH course listed. For each course, return:
- code: the course code (e.g. "CS101")
- name: full course name
- credits: number of credit hours (use the number from the transcript, default to 3 if unclear)
- status: one of "transfer" (transfers cleanly), "lost" (not accepted at destination), or "partial" (partial credit only)
- reason: 1-2 sentences explaining why the credit does or doesn't transfer
- action: 1 sentence on what the student can do (e.g. "Appeal to the registrar with your syllabus", "Take an equivalency exam", "No action needed")

Base dollar loss on $${DOLLAR_PER_CREDIT} CAD per credit hour (Ontario average tuition).

If a course is not clearly listed on the transcript, skip it.
Return ONLY a JSON array. No markdown, no explanation text.

TRANSCRIPT:
${text}
`
}

export function useGeminiAnalysis() {
  const [results, setResults] = useState<CourseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressText, setProgressText] = useState('')

  const analyze = useCallback(
    async (transcriptText: string, from: string, to: string) => {
      setLoading(true)
      setError(null)
      setResults([])
      setProgressText('Checking API Key...')

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        setError("Missing VITE_GEMINI_API_KEY in .env.local")
        setLoading(false)
        setProgressText('')
        return
      }

      setProgressText('Sending transcript to Gemini...')
      
      try {
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: buildPrompt(transcriptText, from, to),
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gemini analysis failed'
        setError(msg)
        setProgressText('')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { analyze, results, loading, error, progressText }
}
