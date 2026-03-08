import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCredStore } from '@/store/useCredStore'
import { useGeminiAnalysis } from '@/hooks/useGeminiAnalysis'

export function ProcessingScreen() {
  const { transcriptText, transcriptSummary, parsedCourses, targetProgram, fromUniversity, toUniversity, setResults, setStep } = useCredStore()
  const { analyze, results, error, progressText } = useGeminiAnalysis()

  useEffect(() => {
    let mounted = true
    const runAnalysis = async () => {
      if (transcriptSummary) {
        await analyze(transcriptText, fromUniversity, toUniversity, transcriptSummary, parsedCourses, targetProgram)
      }
      // The results are updated in the hook state, but we need to push them to the store
    }
    runAnalysis()
    return () => { mounted = false }
  }, [analyze, transcriptText, fromUniversity, toUniversity, transcriptSummary, parsedCourses, targetProgram])

  // Watch for results from the hook and update the global store
  useEffect(() => {
    if (results.length > 0) {
      setResults(results)
      // Brief delay to let animations finish before unmounting
      setTimeout(() => setStep('scene'), 1500)
    }
  }, [results, setResults, setStep])

  return (
    <div className="min-h-[100dvh] w-full bg-[#09090b] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Central rotating loader */}
      <div className="relative w-40 h-40 mb-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-emerald-500/20 rounded-full border-t-emerald-500/80"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border border-rose-500/20 rounded-full border-b-rose-500/60"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="absolute inset-8 border border-amber-500/20 rounded-full border-l-amber-500/50"
        />
        
        {/* Core pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]"
          />
        </div>
      </div>

      <div className="text-center space-y-4 z-10">
        <h2 className="text-3xl font-medium tracking-tight text-white">
          Analyzing Transcript
        </h2>
        
        <div className="h-6">
          <motion.p 
            key={progressText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-emerald-400 text-sm"
          >
            {error ? (
              <span className="text-rose-400">{error}</span>
            ) : results.length > 0 ? (
              `Parsed ${results.length} courses successfully. Generating 3D space...`
            ) : (
              progressText || 'Extracting course mappings...'
            )}
          </motion.p>
        </div>
      </div>

    </div>
  )
}
