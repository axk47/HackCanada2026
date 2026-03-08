import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, SpeakerHigh, ArrowSquareOut } from '@phosphor-icons/react'
import { useCredStore } from '@/store/useCredStore'
import { useElevenLabs } from '@/hooks/useElevenLabs'

const CATEGORY_LABELS: Record<string, string> = {
  cs_core:       'CS Core',
  cs_elective:   'CS Elective',
  math:          'Mathematics',
  business_core: 'Business Core',
  science_core:  'Science Core',
  elective:      'General Elective',
  other:         'Other',
}

export function CoursePanel() {
  const { selectedCourse, setSelectedCourse, destUniversity } = useCredStore()
  const { speak, stop } = useElevenLabs()

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedCourse(null) }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setSelectedCourse])

  useEffect(() => { return () => stop() }, [selectedCourse, stop])

  const handlePlayVoice = () => {
    if (!selectedCourse) return
    const text = `Course ${selectedCourse.code}, ${selectedCourse.name}. Grade: ${selectedCourse.grade}%. ${selectedCourse.reason} ${selectedCourse.action}`
    speak(text)
  }

  const outcomeLabel = selectedCourse?.likelyOutcome === 'transfer' ? 'Likely Transfers'
    : selectedCourse?.likelyOutcome === 'review' ? 'Needs Official Review'
    : 'Likely Lost'

  const outcomeBadge = selectedCourse?.likelyOutcome === 'transfer'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : selectedCourse?.likelyOutcome === 'review'
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'

  return (
    <AnimatePresence>
      {selectedCourse && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-zinc-950/20"
            onClick={() => setSelectedCourse(null)}
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            className="fixed right-0 top-0 h-[100dvh] w-[420px] max-w-[100vw] z-50 bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 shadow-[inset_1px_0_0_rgba(255,255,255,0.05),-20px_0_40px_rgba(0,0,0,0.5)] flex flex-col pt-safe-top"
          >
            {/* Top bar */}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-24">

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm tracking-wide text-emerald-400 font-medium">
                    {selectedCourse.code}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full border font-medium ${outcomeBadge}`}>
                    {outcomeLabel}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
                  {selectedCourse.name}
                </h2>
              </div>

              <div className="space-y-8">

                {/* Grade + Credits + Category */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Course Details</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Grade', value: `${selectedCourse.grade}%` },
                      { label: 'Credits', value: `${selectedCourse.credits} Brock cr` },
                      { label: 'Category', value: CATEGORY_LABELS[selectedCourse.category] ?? selectedCourse.category },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">{label}</div>
                        <div className="text-sm text-white font-medium leading-tight">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eligible badge */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Eligibility</h3>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
                    selectedCourse.eligible
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {selectedCourse.eligible
                      ? `✓ Meets ${destUniversity?.minGradeForTransfer ?? 60}% transfer threshold`
                      : `✗ Below ${destUniversity?.minGradeForTransfer ?? 60}% minimum — ineligible`}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Assessment</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{selectedCourse.reason}</p>
                </div>

                {/* Action */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Next Step</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{selectedCourse.action}</p>
                </div>

                {/* ONTransfer link */}
                {destUniversity && (
                  <a
                    href={destUniversity.onTransferUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-zinc-300 hover:text-white transition-colors group"
                  >
                    <span>Check Official Equivalency → ONTransfer</span>
                    <ArrowSquareOut size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                  </a>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-zinc-600 italic leading-relaxed">
                  Transfer outcomes shown are estimates based on course categories and grade thresholds.
                  Official credit assessment is confirmed only after admission.{' '}
                  {destUniversity && (
                    <a
                      href={destUniversity.transferCreditUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 underline hover:text-zinc-300 transition-colors"
                    >
                      View {destUniversity.name.split(' ')[0]} transfer policy →
                    </a>
                  )}
                </p>

              </div>
            </div>

            {/* Appeal button for lost/review */}
            {(selectedCourse.likelyOutcome === 'lost' || selectedCourse.likelyOutcome === 'review') && (
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pt-12">
                <a
                  href={destUniversity?.transferCreditUrl ?? 'https://www.ontransfer.ca'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-white hover:bg-zinc-200 text-zinc-950 px-4 py-3.5 rounded-lg font-semibold transition-colors"
                >
                  Appeal / Request Official Review
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
