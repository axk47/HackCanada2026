import { useState, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { ParsedCourse, TranscriptSummary } from '@/types'

// Use the bundled worker from pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export function extractTranscriptData(text: string): { summary: TranscriptSummary, courses: ParsedCourse[] } {
  const courses: ParsedCourse[] = []
  
  // Try to find Name
  const nameMatch = text.match(/(?:Name|Student)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i)
  const studentName = nameMatch ? nameMatch[1].trim() : undefined

  // Try to find Program
  const programMatch = text.match(/(?:Program|Plan|Major|Faculty of)[:\s]+([A-Za-z &]+?)(?:\s\s|\n|$)/i)
  let programDetected = programMatch ? programMatch[1].trim() : undefined
  if (programDetected && programDetected.length > 50) programDetected = undefined

  // Broad regex for courses
  const courseRegex = /([A-Z]{2,4}\s*\d{2,4}[A-Z]*)\s+([A-Za-z0-9 \-&,]{3,50}?)\s+(0\.\d{1,2}|[1-9](?:\.\d{1,2})?)\s+(A\+|A-|A|B\+|B-|B|C\+|C-|C|D|F|[1-9][0-9]|100|CR|P|S)(?=\s|$)/gi
  
  let match;
  while ((match = courseRegex.exec(text)) !== null) {
      courses.push({
          code: match[1].toUpperCase(),
          name: match[2].trim(),
          creditHours: parseFloat(match[3]),
          grade: match[4].toUpperCase()
      })
  }

  // Fallback regex without name
  if (courses.length === 0) {
      const altRegex = /([A-Z]{2,4}\s*\d{2,4}[A-Z]*)\s+(0\.\d{1,2}|[1-9](?:\.\d{1,2})?)\s+(A\+|A-|A|B\+|B-|B|C\+|C-|C|D|F|[1-9][0-9]|100|CR|P|S)/gi
      while ((match = altRegex.exec(text)) !== null) {
          courses.push({
              code: match[1].toUpperCase(),
              name: 'Unknown Course',
              creditHours: parseFloat(match[2]),
              grade: match[3].toUpperCase()
          })
      }
  }

  // Calculate total credits
  let totalCreditsCompleted = 0
  for (const c of courses) {
    if (c.grade !== 'F' && Number(c.grade) >= 50) {
      totalCreditsCompleted += c.creditHours
    }
  }

  // Calculate year
  let currentYear = 1
  if (totalCreditsCompleted >= 30) currentYear = 4
  else if (totalCreditsCompleted >= 20) currentYear = 3
  else if (totalCreditsCompleted >= 10) currentYear = 2

  // Calculate GPA
  let totalPoints = 0
  let totalCreditsForGpa = 0
  
  for (const c of courses) {
    let gp = null
    const g = c.grade
    if (/^A\+?$/.test(g) || (Number(g) >= 90 && Number(g) <= 100)) gp = 4.0
    else if (/^A-$/.test(g) || (Number(g) >= 85 && Number(g) <= 89)) gp = 3.7
    else if (/^B\+$/.test(g) || (Number(g) >= 80 && Number(g) <= 84)) gp = 3.3
    else if (/^B$/.test(g) || (Number(g) >= 75 && Number(g) <= 79)) gp = 3.0
    else if (/^B-$/.test(g) || (Number(g) >= 70 && Number(g) <= 74)) gp = 2.7
    else if (/^C\+$/.test(g) || (Number(g) >= 65 && Number(g) <= 69)) gp = 2.3
    else if (/^C$/.test(g) || (Number(g) >= 60 && Number(g) <= 64)) gp = 2.0
    else if (/^C-$/.test(g) || (Number(g) >= 55 && Number(g) <= 59)) gp = 1.7
    else if (/^D$/.test(g) || (Number(g) >= 50 && Number(g) <= 54)) gp = 1.0
    else if (/^F$/.test(g) || (Number(g) >= 0 && Number(g) < 50 && g !== 'P' && g !== 'CR' && g !== 'S')) gp = 0.0
    
    if (gp !== null) {
      totalPoints += gp * c.creditHours
      totalCreditsForGpa += c.creditHours
    }
  }
  
  const gpa = totalCreditsForGpa > 0 ? Number((totalPoints / totalCreditsForGpa).toFixed(2)) : null

  return {
    summary: {
      studentName,
      totalCreditsCompleted,
      gpa,
      currentYear,
      programDetected
    },
    courses
  }
}

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
