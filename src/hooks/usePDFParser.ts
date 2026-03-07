import { useState, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'

// Use the bundled worker from pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

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
