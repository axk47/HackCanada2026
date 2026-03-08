import { useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { FilePdf, ArrowRight, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react'
import { useCredStore } from '@/store/useCredStore'
import { ONTARIO_UNIVERSITIES } from '@/data/universities'

export function UploadScreen() {
  const {
    setStep,
    fromUniversity, toUniversity,
    setFromUniversity, setToUniversity,
    targetProgram, setTargetProgram,
    setUploadedFile,
  } = useCredStore()

  const [fromSearch, setFromSearch] = useState(fromUniversity)
  const [toSearch, setToSearch] = useState(toUniversity)
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Magnetic button physics
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width * 20 - 10)
    y.set((e.clientY - rect.top) / rect.height * 20 - 10)
  }

  const handleMouseLeave = () => { x.set(0); y.set(0) }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const acceptFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }
    setError(null)
    setFile(f)
    setUploadedFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) acceptFile(e.dataTransfer.files[0])
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) acceptFile(e.target.files[0])
  }

  const startAnalysis = () => {
    if (!file || !fromUniversity || !toUniversity) return
    setStep('processing')
  }

  const filteredFrom = ONTARIO_UNIVERSITIES.filter(u => u.toLowerCase().includes(fromSearch.toLowerCase()))
  const filteredTo = ONTARIO_UNIVERSITIES.filter(u => u.toLowerCase().includes(toSearch.toLowerCase()))
  const canAnalyze = !!file && !!fromUniversity && !!toUniversity

  return (
    <div className="flex h-[100dvh] w-full bg-[#09090b] text-zinc-50 overflow-hidden">

      {/* Background Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], borderRadius: ['20%', '50%', '20%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-emerald-900/40 blur-[120px] rounded-full"
        />
      </div>

      {/* LEFT — Scrollable Form */}
      <div className="w-full md:w-[55%] h-[100dvh] overflow-y-auto relative z-10">
        <div className="flex flex-col min-h-full px-8 md:px-16 py-16 max-w-lg">

          {/* Hero */}
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl tracking-tighter leading-[1.1] font-medium text-white">
              Stop losing credits{' '}
              to the <span className="text-emerald-400">transfer void.</span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-[45ch] leading-relaxed">
              See exactly which courses transfer, what gets lost, and the dollar value of your missing credits in 10 seconds.
            </p>
          </div>

          <div className="space-y-6">
            {/* FROM Selector */}
            <div className="space-y-2 relative">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Origin Institution</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search university..."
                  value={fromSearch}
                  onChange={(e) => { setFromSearch(e.target.value); setFromOpen(true) }}
                  onFocus={() => setFromOpen(true)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-colors"
                />
                <MagnifyingGlass className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              </div>
              {fromOpen && filteredFrom.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 max-h-60 overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-1 z-50 shadow-2xl">
                  {filteredFrom.map(u => (
                    <button key={u} onClick={() => { setFromUniversity(u); setFromSearch(u); setFromOpen(false) }}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">{u}</button>
                  ))}
                </div>
              )}
            </div>

            {/* TO Selector */}
            <div className="space-y-2 relative">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Destination Institution</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search university..."
                  value={toSearch}
                  onChange={(e) => { setToSearch(e.target.value); setToOpen(true) }}
                  onFocus={() => setToOpen(true)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-colors"
                />
                <MagnifyingGlass className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              </div>
              {toOpen && filteredTo.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 max-h-60 overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-1 z-50 shadow-2xl">
                  {filteredTo.map(u => (
                    <button key={u} onClick={() => { setToUniversity(u); setToSearch(u); setToOpen(false) }}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">{u}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Target Program */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Target Program (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Computer Science (Honours)"
                value={targetProgram}
                onChange={(e) => setTargetProgram(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-colors"
              />
            </div>

            {/* File status chip */}
            {file && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <FilePdf size={20} weight="fill" className="text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300 truncate">{file.name}</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-rose-400 bg-rose-400/10 px-4 py-3 rounded-xl border border-rose-400/20">
                <WarningCircle size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* CTA */}
            <div className="pt-2 pb-12">
              <motion.button
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                whileTap={{ scale: 0.98 }}
                style={{ x: mouseXSpring, y: mouseYSpring }}
                onClick={startAnalysis}
                disabled={!canAnalyze}
                className="group flex items-center justify-center gap-3 w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-8 py-4 rounded-full font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Analyze Credits</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              {!file && (
                <p className="text-center text-xs text-zinc-600 mt-3">Upload your transcript PDF on the right to continue</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Fixed Drop Zone */}
      <div className="hidden md:flex w-[45%] fixed right-0 top-0 h-[100dvh] p-8 z-10 flex-col">
        <div
          onDragEnter={handleDrag} onDragLeave={handleDrag}
          onDragOver={handleDrag} onDrop={handleDrop}
          className={`flex-1 flex flex-col items-center justify-center rounded-[2.5rem] backdrop-blur-xl transition-all duration-300 relative overflow-hidden group border
            ${dragActive ? 'bg-emerald-500/10 border-emerald-500/50 scale-[0.98]' : 'bg-white/5 border-white/10'}
            ${file ? 'border-emerald-500/30' : ''}
            shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
          `}
        >
          <input
            type="file" accept="application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />

          <motion.div
            animate={dragActive ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors
              ${dragActive || file ? 'bg-emerald-500 text-zinc-950' : 'bg-white/10 text-zinc-400 group-hover:bg-white/20 group-hover:text-white'}
            `}
          >
            <FilePdf size={40} weight={file ? 'fill' : 'regular'} />
          </motion.div>

          {file ? (
            <div className="text-center px-8">
              <p className="text-xl font-medium text-white bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/30 mb-3 truncate max-w-xs">{file.name}</p>
              <p className="text-zinc-500 text-sm">Ready to analyze</p>
            </div>
          ) : (
            <div className="text-center px-6">
              <p className="text-2xl font-medium text-white mb-2">Drop Transcript PDF</p>
              <p className="text-zinc-500 text-sm max-w-[25ch] mx-auto">
                Upload your unofficial transcript. No data leaves your browser until you click Analyze.
              </p>
            </div>
          )}

          <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-[2.5rem]" style={{ strokeDasharray: '12, 12' }}>
            <rect x="0" y="0" width="100%" height="100%" rx="40" fill="none"
              stroke={dragActive ? '#10b981' : 'rgba(255,255,255,0.1)'}
              strokeWidth="2" className={`transition-colors ${dragActive ? 'animate-pulse' : ''}`} />
          </svg>
        </div>
      </div>
    </div>
  )
}
