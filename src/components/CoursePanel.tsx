import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SpeakerHigh, ArrowRight, CurrencyDollar, GraduationCap } from '@phosphor-icons/react'
import { useCredStore } from '@/store/useCredStore'
import { useElevenLabs } from '@/hooks/useElevenLabs'

export function CoursePanel() {
  const { selectedCourse, setSelectedCourse } = useCredStore()
  const { speak, stop } = useElevenLabs()

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCourse(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setSelectedCourse])

  // Stop audio when panel closes or changes
  useEffect(() => {
    return () => stop()
  }, [selectedCourse, stop])

  const handlePlayVoice = () => {
    if (!selectedCourse) return
    const text = `Course ${selectedCourse.code}, ${selectedCourse.name}. ${selectedCourse.reason} ${selectedCourse.action}`
    speak(text)
  }

  return (
    <AnimatePresence>
      {selectedCourse && (
        <>
          {/* Backdrop for clicking outside */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-zinc-950/20"
            onClick={() => setSelectedCourse(null)}
          />

          {/* Right Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            className="fixed right-0 top-0 h-[100dvh] w-full max-w-[420px] z-50 backdrop-blur-3xl bg-zinc-950/80 border-l border-white/10 shadow-[inset_1px_0_0_rgba(255,255,255,0.05),-20px_0_40px_rgba(0,0,0,0.5)] flex flex-col pt-safe-top"
          >
            {/* Header / Actions */}
            <div className="flex items-center justify-between p-6 pb-2">
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-medium">
                {selectedCourse.code}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePlayVoice}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10"
                  title="Play AI explanation"
                >
                  <SpeakerHigh size={20} weight="fill" />
                </button>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
              <h2 className="text-3xl font-semibold tracking-tight text-white mb-6 leading-tight">
                {selectedCourse.name}
              </h2>

              {/* Status Pill */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                  selectedCourse.status === 'transfer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedCourse.status === 'lost' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {selectedCourse.status === 'transfer' ? 'Transfers Cleanly' :
                   selectedCourse.status === 'lost' ? 'Credit Lost' : 'Partial Credit'}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <GraduationCap className="text-zinc-500 mb-2" size={24} />
                  <p className="text-zinc-400 text-sm mb-1">Credits</p>
                  <p className="font-mono text-2xl text-white">{selectedCourse.credits.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <CurrencyDollar className="text-zinc-500 mb-2" size={24} />
                  <p className="text-zinc-400 text-sm mb-1">Value Lost</p>
                  <p className={`font-mono text-2xl ${selectedCourse.dollarLost > 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                    ${selectedCourse.dollarLost.toLocaleString()}
                  </p>
                </div>
              </div>

              <hr className="border-white/10 my-8" />

              {/* Reason & Action */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3 block">Analysis</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    {selectedCourse.reason}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3 block">Recommendation</h3>
                  <div className="flex items-start gap-4 bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
                    <ArrowRight className="text-emerald-400 mt-1 shrink-0" size={20} />
                    <p className="text-zinc-200 leading-relaxed text-sm">
                      {selectedCourse.action}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
