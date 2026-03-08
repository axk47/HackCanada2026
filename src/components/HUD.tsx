import { useEffect } from 'react'
import { motion, useSpring, useTransform, animate } from 'framer-motion'
import { CurrencyDollar, Swap, XCircle } from '@phosphor-icons/react'
import { useCredStore } from '@/store/useCredStore'

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const spring = useSpring(0, { bounce: 0, duration: 1500 })
  const display = useTransform(spring, (current) =>
    decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString()
  )

  useEffect(() => {
    animate(spring, value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

export function HUD() {
  const { results, step, transcriptSummary } = useCredStore()

  if (step !== 'scene' || results.length === 0) return null

  const summaryCredits = transcriptSummary?.totalCreditsCompleted ?? 0

  // Raw sums from what Gemini returned
  const rawTransferred = results.filter(r => r.status === 'transfer').reduce((sum, r) => sum + r.credits, 0)
  const rawLost        = results.filter(r => r.status === 'lost').reduce((sum, r) => sum + r.credits, 0)
  const rawPartial     = results.filter(r => r.status === 'partial').reduce((sum, r) => sum + r.credits, 0)
  const rawTotal = rawTransferred + rawLost + rawPartial

  // Sanity check: if Gemini used semester hours (3× too big), scale back down
  // e.g. 24 courses × 3 = 72, but transcript says 12 → scaleFactor = 12/72 ≈ 0.167
  const scaleFactor = (rawTotal > summaryCredits * 2 && summaryCredits > 0)
    ? summaryCredits / rawTotal
    : 1

  const transferred     = rawTransferred * scaleFactor
  const lost            = rawLost        * scaleFactor
  const _partial        = rawPartial     * scaleFactor
  const ONTARIO_CREDIT_VALUE = 2400  // ~$2400 CAD per Ontario 0.5 credit
  const totalDollarLoss = (lost + _partial * 0.5) * ONTARIO_CREDIT_VALUE
  const year = transcriptSummary?.currentYear ?? 1

  console.log('HUD stats:', {
    rawTransferred, rawLost, rawPartial, rawTotal, 
    scaleFactor, transferred, lost, summaryCredits, year
  })



  return (
    <motion.div
      initial={{ y: 100, opacity: 0, x: '-50%' }}
      animate={{ y: 0, opacity: 1, x: '-50%' }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
      className="fixed bottom-6 left-1/2 z-30"
    >
      <div className="backdrop-blur-xl bg-zinc-900/80 border border-white/10 rounded-full py-3 px-6 md:px-8 shadow-2xl flex items-center gap-4 md:gap-8 min-w-max">
        
        {/* Transferred */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Swap weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-500">Transferred</span>
            <span className="font-mono text-white flex items-baseline gap-1">
              <AnimatedNumber value={transferred} decimals={1} />
              <span className="text-sm text-zinc-400">cr</span>
            </span>
          </div>
        </div>

        <div className="w-[1px] h-8 bg-white/10" />

        {/* Lost */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
            <XCircle weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-500">Lost</span>
            <span className="font-mono text-white flex items-baseline gap-1">
              <AnimatedNumber value={lost} decimals={1} />
              <span className="text-sm text-zinc-400">cr</span>
            </span>
          </div>
        </div>

        <div className="w-[1px] h-8 bg-white/10" />

        {/* Year */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-500">Year</span>
            <span className="font-mono text-white flex items-baseline gap-1">
              <span className="text-xl">{year}</span>
            </span>
          </div>
        </div>

        <div className="w-[1px] h-8 bg-white/10 hidden md:block" />

        {/* Value */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <CurrencyDollar weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-500">Value at Risk</span>
            <span className="font-mono text-amber-400 flex items-baseline gap-1">
              $<AnimatedNumber value={totalDollarLoss} />
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  )
}
