import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCredStore } from '@/store/useCredStore'
import { usePDFParser, extractTranscriptWithGemini } from '@/hooks/usePDFParser'
import { useGeminiAnalysis } from '@/hooks/useGeminiAnalysis'
import type { CourseResult } from '@/types'
import {
  getUniversityByName,
  calculateValueAtRiskRange,
  convertBrockCredits,
  convertGPA,
} from '@/data/universities'

const STEPS = [
  'Reading PDF...',
  'Sending transcript to Gemini...',
  'Extracting transcript data...',
  'Categorizing transfer eligibility...',
  'Building visualization...',
]

export function ProcessingScreen() {
  const {
    uploadedFile,
    fromUniversity, toUniversity,
    programKey, isInternational, destUniversity,
    setTranscriptText, setTranscriptSummary,
    setResults, setTransferStats, setDestUniversity, setStep,
  } = useCredStore()

  const { parseFile } = usePDFParser()
  const { analyze, results, error: analysisError, progressText } = useGeminiAnalysis()

  const [statusIndex, setStatusIndex] = useState(0)
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const run = async () => {
      try {
        // Step 1: Parse PDF
        setStatusIndex(0)
        if (!uploadedFile) throw new Error('No file uploaded.')
        const pdfText = await parseFile(uploadedFile)
        setTranscriptText(pdfText)

        // Step 2: Gemini extraction of transcript summary
        setStatusIndex(1)
        const summary = await extractTranscriptWithGemini(pdfText)
        setTranscriptSummary(summary)

        console.log('=== TRANSCRIPT EXTRACTED ===')
        console.log('Credits:', summary.totalCreditsCompleted)
        console.log('GPA:', summary.gpa)
        console.log('Year:', summary.currentYear)
        console.log('Program:', summary.programDetected)
        console.log('Courses found:', summary.coursesFound)

        // Step 3: Resolve destination
        setStatusIndex(2)
        const destination = destUniversity ?? getUniversityByName(toUniversity)
        if (!destination) throw new Error(`University "${toUniversity}" not found in data.`)
        if (!destUniversity) setDestUniversity(destination)

        // Step 4: Gemini categorization
        setStatusIndex(3)
        await analyze(pdfText, fromUniversity, destination, summary, [], programKey)
        // results arrive via useEffect below

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed'
        console.error(msg)
        setErrorMsg(msg)
      }
    }

    run()
  }, []) // intentionally empty — run once on mount

  // Surface hook errors
  useEffect(() => {
    if (analysisError) setErrorMsg(analysisError)
  }, [analysisError])

  // When Gemini results arrive, compute hardcoded stats and navigate
  useEffect(() => {
    if (results.length === 0) return

    const destination = destUniversity ?? getUniversityByName(toUniversity)
    if (!destination) {
      setResults(results)
      setStep('scene')
      return
    }

    // ── APPLY HARD LIMITS FROM universities.ts ──
    // We attach the original index to preserve exact ordering
    const sortedResults = results.map((r, i) => ({ ...r, _originalIndex: i }))
      .sort((a, b) => b.grade - a.grade)

    const maxBrockTotal = destination.maxTransferCredits / destination.brockConversionFactor
    const maxBrockY1 = destination.yearThresholds?.year1Max
      ? destination.yearThresholds.year1Max / destination.brockConversionFactor
      : 999
    const maxBrockY2 = destination.yearThresholds?.year2Max
      ? destination.yearThresholds.year2Max / destination.brockConversionFactor
      : 999

    let transferredTotal = 0
    let transferredY1 = 0
    let transferredY2 = 0

    let limitedResults = sortedResults.map(r => {
      if (r.likelyOutcome !== 'transfer') return r

      const yearMatch = r.code.match(/[A-Z]+\s*([1-4])/i)
      const year = yearMatch ? parseInt(yearMatch[1]) : 1

      if (transferredTotal + r.credits > maxBrockTotal) {
        return { ...r, likelyOutcome: 'lost' as const, status: 'lost' as const, reason: `Exceeds max transfer limit (${destination.maxTransferCredits} ${destination.creditSystem.unitName})` }
      }
      if (year === 1 && transferredY1 + r.credits > maxBrockY1) {
        return { ...r, likelyOutcome: 'lost' as const, status: 'lost' as const, reason: `Exceeds 1st year limit (${destination.yearThresholds.year1Max} ${destination.creditSystem.unitName})` }
      }
      if (year === 2 && transferredY2 + r.credits > maxBrockY2) {
        return { ...r, likelyOutcome: 'lost' as const, status: 'lost' as const, reason: `Exceeds 2nd year limit (${destination.yearThresholds.year2Max} ${destination.creditSystem.unitName})` }
      }

      transferredTotal += r.credits
      if (year === 1) transferredY1 += r.credits
      if (year === 2) transferredY2 += r.credits
      return r
    })

    // Restore exactly to original order, stripping the temp index
    const finalResults = limitedResults
      .sort((a, b) => a._originalIndex - b._originalIndex)
      .map(r => {
        const { _originalIndex, ...rest } = r
        return rest as unknown as CourseResult
      })

    // Compute stats using real tuition data
    const transferred = finalResults.filter(r => r.likelyOutcome === 'transfer')
    const lost        = finalResults.filter(r => r.likelyOutcome === 'lost')
    const review      = finalResults.filter(r => r.likelyOutcome === 'review')

    const transferredBrockCredits = transferred.reduce((s, r) => s + r.credits, 0)
    const lostBrockCredits        = lost.reduce((s, r) => s + r.credits, 0)
    const reviewBrockCredits      = review.reduce((s, r) => s + r.credits, 0)

    const transferredDestCredits = convertBrockCredits(transferredBrockCredits, destination)

    // Lost + half of review counts as "at risk"
    const atRiskBrockCredits = lostBrockCredits + reviewBrockCredits * 0.5
    const valueAtRisk = calculateValueAtRiskRange(atRiskBrockCredits, destination, programKey, isInternational)

    // Get GPA % from summary for conversion
    const summaryGpaPercent = useCredStore.getState().transcriptSummary?.gpaPercent
      ?? (useCredStore.getState().transcriptSummary?.gpa  // fallback: 4.0 scale → %
        ? (useCredStore.getState().transcriptSummary!.gpa! / 4.33) * 100
        : 0)
    const destGPA = convertGPA(summaryGpaPercent, destination)

    console.log('=== FINAL COMPUTED STATS ===')
    console.log('Transferred Brock credits:', transferredBrockCredits)
    console.log('In destination units:', transferredDestCredits, destination.creditSystem.unitName)
    console.log('Lost Brock credits:', lostBrockCredits)
    console.log('Review Brock credits:', reviewBrockCredits)
    console.log('Value at Risk:', valueAtRisk)
    console.log('GPA in dest scale:', destGPA, '/', destination.gpaScale.type)

    // Enrich dollarLost per-course using real tuition
    const rate = isInternational
      ? destination.programs[programKey]?.costPerBrockCredit.international
      : destination.programs[programKey]?.costPerBrockCredit.domestic
    const enriched = finalResults.map(r => ({
      ...r,
      dollarLost: r.likelyOutcome === 'transfer' ? 0
        : Math.round((r.credits / 0.5) * (rate ?? 800) * (r.likelyOutcome === 'review' ? 0.5 : 1)),
    }))

    setResults(enriched)
    setTransferStats({
      transferredBrockCredits,
      transferredDestCredits,
      lostBrockCredits,
      reviewBrockCredits,
      valueAtRisk,
      destGPA,
    })

    console.log('=== TRANSFER ANALYSIS COMPLETE ===')
    console.log(`Transferred: ${transferred.length}, Lost: ${lost.length}, Review: ${review.length}`)

    setStatusIndex(4)
    setTimeout(() => setStep('scene'), 1200)
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
            {errorMsg ?? (progressText || STEPS[statusIndex])}
          </motion.p>
        </AnimatePresence>

        {!errorMsg && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
                i < statusIndex  ? 'bg-emerald-500 w-4' :
                i === statusIndex ? 'bg-emerald-500/80 w-6 animate-pulse' :
                'bg-white/10 w-4'
              }`} />
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
