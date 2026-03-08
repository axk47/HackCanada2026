import { useState, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import { GoogleGenAI } from '@google/genai'
import type { TranscriptSummary } from '@/types'

// Use the bundled worker from pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

// ─── Gemini-powered extraction ────────────────────────────────────────────────

export async function extractTranscriptWithGemini(
  pdfText: string
): Promise<TranscriptSummary> {
  const prompt = `You are an expert academic transcript parser for Canadian universities.

ONTARIO UNIVERSITY CREDIT SYSTEM (CRITICAL — read carefully):
All Ontario universities (Brock, Carleton, McMaster, Western, Waterloo, 
Guelph, York, Ottawa, Queen's, etc.) use a 0.5 credit unit system —
NOT American semester credit hours (which are 3.0 per course).

Rules for Ontario credits:
- One single-semester course = 0.5 credits (NOT 3)
- One full-year course = 1.0 credits
- A full-time student takes 5.0 credits per year (10 half-courses)
- Year thresholds (Brock University — 20 credits to graduate):
    Year 1: 0.0 – 5.0 cr
    Year 2: 5.5 – 10.0 cr
    Year 3: 10.5 – 15.0 cr
    Year 4: 15.5 – 20.0 cr

Extract totalCreditsCompleted in Ontario 0.5 units ONLY.
If the transcript shows a number that looks like semester hours (e.g. 72.0 for 24 courses), 
divide by 6 to get Ontario units (24 courses × 0.5 = 12.0 units).

1. TOTAL CREDITS: Sum all credits from PASSED courses only (grade D or above, CR/P/S).
   Look for columns labelled "WEIGHT", "CREDITS", "CR", "UNIT", "HOURS".
   Return in Ontario 0.5 units.

2. GPA: First look for an explicit "GPA", "OVERALL GPA", "CUMULATIVE GPA", or "CGPA" value.
   If not found, calculate weighted average using Ontario 4.0 scale:
   A+/A (90+)=4.0  A-(85-89)=3.7  B+(80-84)=3.3  B(75-79)=3.0
   B-(70-74)=2.7   C+(65-69)=2.3  C(60-64)=2.0   C-(55-59)=1.7
   D(50-54)=1.0    F(<50)=0.0
   If no grades are present, return null.

3. CURRENT YEAR: Derive from totalCreditsCompleted using Ontario year thresholds above.

4. PROGRAM: Look for "Program:", "Degree:", "Major:", "Plan:", "Specialization:" fields.
   Return the value as a short string (max 60 chars), or null if not found.

5. COURSES FOUND: Count total distinct course entries attempted (including failed).

6. CONFIDENCE: Rate your confidence:
   "high" = clear tabular layout with labelled columns
   "medium" = some ambiguity in credit/grade columns
   "low" = transcript format is unusual or text is garbled

Return ONLY valid JSON (no markdown fences, no explanation):
{
  "totalCreditsCompleted": <number in Ontario 0.5 units>,
  "gpa": <number or null>,
  "currentYear": <1|2|3|4>,
  "programDetected": <string or null>,
  "coursesFound": <number>,
  "confidence": "high" | "medium" | "low"
}

TRANSCRIPT TEXT:
${pdfText.slice(0, 12000)}`

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to extract transcript via Gemini')
  }

  const parsed = await response.json()

  return {
    totalCreditsCompleted: Number(parsed.totalCreditsCompleted) || 0,
    gpa: parsed.gpa != null ? Number(parsed.gpa) : null,
    currentYear: (Number(parsed.currentYear) as 1 | 2 | 3 | 4) || 1,
    programDetected: parsed.programDetected ?? undefined,
    coursesFound: Number(parsed.coursesFound) || 0,
    extractionConfidence: parsed.confidence ?? 'low',
  }
}

// ─── Raw PDF text extractor hook ─────────────────────────────────────────────

export function usePDFParser() {
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseFile = useCallback(async (file: File): Promise<string> => {
    setParsing(true)
    setError(null)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      const pages: string[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        // Preserve newlines by joining items with space, pages with newline
        const text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
        pages.push(text)
      }
      return pages.join('\n')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse PDF'
      setError(msg)
      throw new Error(msg)
    } finally {
      setParsing(false)
    }
  }, [])

  return { parseFile, parsing, error }
}
