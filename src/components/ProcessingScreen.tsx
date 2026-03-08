import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCredStore } from '@/store/useCredStore'
import { usePDFParser, extractTranscriptWithGemini } from '@/hooks/usePDFParser'
import { useGeminiAnalysis } from '@/hooks/useGeminiAnalysis'

const STEPS = [
  'Reading PDF...',
  'Sending transcript to Gemini...',
  'Extracting transcript data...',
  'Analyzing transfer credits...',
  'Building visualization...',
]

export function ProcessingScreen() {
  const {
    uploadedFile,
    fromUniversity, toUniversity, targetProgram,
    setTranscriptText, setTranscriptSummary,
    setResults, setStep,
  } = useCredStore()

  const { parseFile } = usePDFParser()
  const { analyze, results, error: analysisError } = useGeminiAnalysis()

  const [statusIndex, setStatusIndex] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const run = async () => {
      try {
        // Step 1: Parse PDF text
        setStatusIndex(0)
        if (!uploadedFile) throw new Error('No file uploaded.')
        const pdfText = await parseFile(uploadedFile)
        setTranscriptText(pdfText)

        // Step 2: Gemini extraction
        setStatusIndex(1)
        const summary = await extractTranscriptWithGemini(pdfText)
        setTranscriptSummary(summary)

        console.log('=== TRANSCRIPT EXTRACTED ===')
        console.log('Credits:', summary.totalCreditsCompleted)
        console.log('GPA:', summary.gpa)
        console.log('Year:', summary.currentYear)
        console.log('Program:', summary.programDetected)
        console.log('Courses found:', summary.coursesFound)
        console.log('Confidence:', summary.extractionConfidence)

        // Step 3: Determine fallback summary for prompt
        setStatusIndex(2)
        const effectiveSummary = summary

        // Step 4: Gemini transfer analysis
        setStatusIndex(3)
        await analyze(pdfText, fromUniversity, toUniversity, effectiveSummary, [], targetProgram)

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed'
        console.error(msg)
        setErrorMsg(msg)
      }
    }

    run()
  }, []) // intentionally empty — run once on mount

  // When results arrive from the analysis hook, push to store and navigate
  useEffect(() => {
    if (results.length > 0) {
      setResults(results)
      console.log('=== TRANSFER ANALYSIS COMPLETE ===')
      console.log(`Transferred: ${results.filter(r => r.status === 'transfer').length}`)
      console.log(`Lost: ${results.filter(r => r.status === 'lost').length}`)
      console.log(`Partial: ${results.filter(r => r.status === 'partial').length}`)
      setStatusIndex(4)
      setTimeout(() => setStep('scene'), 1200)
    }
  }, [results])

  const currentStatus = errorMsg ?? STEPS[statusIndex]

  return (
    <div className="min-h-[100dvh] w-full bg-[#09090b] flex flex-col items-center justify-center p-8 relative overflow-hidden">

      {/* Multi-ring spinner */}
      <div className="relative w-40 h-40 mb-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 border-2 border-emerald-500/20 rounded-full border-t-emerald-500/80"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 border border-rose-500/20 rounded-full border-b-rose-500/60"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-8 border border-amber-500/20 rounded-full border-l-amber-500/50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]"
          />
        </div>
      </div>

      {/* Status */}
      <div className="text-center space-y-4 z-10 max-w-md">
        <h2 className="text-3xl font-medium tracking-tight text-white">Analyzing Transcript</h2>

        <AnimatePresence mode="wait">
          <motion.p
            key={currentStatus}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className={`font-mono text-sm ${errorMsg ? 'text-rose-400' : 'text-emerald-400'}`}
          >
            {currentStatus}
          </motion.p>
        </AnimatePresence>

        {/* Step progress dots */}
        {!errorMsg && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i < statusIndex ? 'bg-emerald-500 w-4' :
                  i === statusIndex ? 'bg-emerald-500/80 w-6 animate-pulse' :
                  'bg-white/10 w-4'
                }`}
              />
            ))}
          </div>
        )}

        {errorMsg && (
          <button
            onClick={() => setStep('upload')}
            className="mt-4 text-sm text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
          >
            ← Go back and try again
          </button>
        )}
      </div>
    </div>
  )
}
