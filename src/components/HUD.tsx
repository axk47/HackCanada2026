import { useEffect } from 'react'
import { motion, useSpring, useTransform, animate } from 'framer-motion'
import { CurrencyDollar, Swap, XCircle, ArrowsSplit } from '@phosphor-icons/react'
import { useCredStore } from '@/store/useCredStore'

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const spring = useSpring(0, { bounce: 0, duration: 1500 })
  const display = useTransform(spring, (current) =>
    decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()
  )
  useEffect(() => { animate(spring, value) }, [spring, value])
  return <motion.span>{display}</motion.span>
}

export function HUD() {
  const { results, step, transcriptSummary, transferStats, destUniversity, isInternational } = useCredStore()

  if (step !== 'scene' || results.length === 0) return null

  // Use pre-computed stats from ProcessingScreen if available
  const transferred = transferStats?.transferredBrockCredits
    ?? results.filter(r => r.status === 'transfer').reduce((s, r) => s + r.credits, 0)

  const lost = transferStats?.lostBrockCredits
    ?? results.filter(r => r.status === 'lost').reduce((s, r) => s + r.credits, 0)

  const review = transferStats?.reviewBrockCredits
    ?? results.filter(r => r.status === 'partial').reduce((s, r) => s + r.credits, 0)

  const valueAtRisk = transferStats?.valueAtRisk
    ?? { min: 0, max: 0, display: '$0' }

  const transferredDest = transferStats?.transferredDestCredits ?? transferred
  const destUnitName    = destUniversity?.creditSystem.unitName ?? 'cr'
  const destShortName   = destUniversity?.name.split(' ')[0] ?? ''

  const year = transcriptSummary?.currentYear ?? 1

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, x: '-50%' }}
      animate={{ y: 0, opacity: 1, x: '-50%' }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
      className="fixed bottom-6 left-1/2 z-30"
    >
      <div className="backdrop-blur-xl bg-zinc-900/80 border border-white/10 rounded-full py-3 px-6 md:px-8 shadow-2xl flex items-center gap-4 md:gap-8 min-w-max">

        {/* Transferred — dual units */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Swap weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-500">Transferred</span>
            <span className="font-mono text-white flex items-baseline gap-1">
              <AnimatedNumber value={transferred} decimals={1} />
              <span className="text-sm text-zinc-400">Brock cr</span>
            </span>
            {destUniversity && transferredDest !== transferred && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {transferredDest.toFixed(1)} {destShortName} {destUnitName}
              </span>
            )}
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

        {/* Needs Review (was Partial) */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <ArrowsSplit weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-500">Review</span>
            <span className="font-mono text-amber-300 flex items-baseline gap-1">
              <AnimatedNumber value={review} decimals={1} />
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

        {/* Value at Risk — real tuition */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <CurrencyDollar weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-500">Value at Risk</span>
            <span className="font-mono text-amber-400 text-sm font-medium">
              {valueAtRisk?.display || '$0'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {isInternational ? 'Intl' : 'Domestic'} estimate
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  )
}
