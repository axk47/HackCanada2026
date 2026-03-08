import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, SpeakerHigh } from '@phosphor-icons/react'
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
            className="fixed right-0 top-0 h-[100dvh] w-[420px] max-w-[100vw] z-50 bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 shadow-[inset_1px_0_0_rgba(255,255,255,0.05),-20px_0_40px_rgba(0,0,0,0.5)] flex flex-col pt-safe-top"
          >
            {/* Top Action Bar */}
            <div className="flex items-center justify-between p-6 pb-4">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Close View
              </button>

              <button
                onClick={handlePlayVoice}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10"
                title="Play AI explanation"
              >
                <SpeakerHigh size={20} weight="fill" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-24">
              
              {/* Header */}
              <div className="mb-10">
                <div className="font-mono text-sm tracking-wide text-emerald-400 font-medium mb-3 flex items-center gap-2">
                  <span>{selectedCourse.code}</span>
                  <span className="text-zinc-600">•</span>
                  <span>{selectedCourse.credits.toFixed(1)} Credits</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
                  {selectedCourse.name}
                </h2>
              </div>

              {/* Sections */}
              <div className="space-y-10">
                
                {/* Status Section */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4 block">
                    Transfer Status
                  </h3>
                  <div className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium border ${
                    selectedCourse.status === 'transfer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedCourse.status === 'lost' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {selectedCourse.status === 'transfer' ? 'Transfers Cleanly' :
                     selectedCourse.status === 'lost' ? 'Credit Lost' : 'Partial Credit'}
                  </div>
                </div>

                {/* Mismatch Details */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4 block">
                    Mismatch Details
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {selectedCourse.reason}
                  </p>
                </div>

                {/* Action Items */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4 block">
                    Action Items
                  </h3>
                  <ul className="space-y-3">
                    {/* Assuming action might be a single string from AI, but we format it as a list item */}
                    {selectedCourse.action.split(/(?<=\.)\s+/).filter(a => a.trim().length > 0).map((actionPoint, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-zinc-300 items-start">
                        <div className="w-4 h-4 mt-0.5 rounded flex items-center justify-center bg-white/5 border border-white/10 shrink-0 font-mono text-[10px] text-zinc-500">
                          {idx + 1}
                        </div>
                        <span className="leading-relaxed">{actionPoint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Bottom Appeal Button (Fixed) */}
            {(selectedCourse.status === 'lost' || selectedCourse.status === 'partial') && (
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pt-12">
                <button className="w-full bg-white hover:bg-zinc-200 text-zinc-950 px-4 py-3.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  Appeal Credit Decision
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
