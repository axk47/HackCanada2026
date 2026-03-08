import { useState, useCallback, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { FilePdf, ArrowRight, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react'
import { useCredStore } from '@/store/useCredStore'
import { ONTARIO_UNIVERSITIES } from '@/data/universities'
import { usePDFParser, extractTranscriptData } from '@/hooks/usePDFParser'
import { useGeminiAnalysis } from '@/hooks/useGeminiAnalysis'

export function UploadScreen() {
  const { 
    setStep, fromUniversity, toUniversity, setFromUniversity, setToUniversity, 
    setTranscriptText, setTranscriptSummary, setParsedCourses,
    transcriptSummary, parsedCourses,
    targetProgram, setTargetProgram,
    manualGpa, setManualGpa,
    manualProgram, setManualProgram
  } = useCredStore()
  const { parseFile, parsing, error: parseError } = usePDFParser()
  const { analyze, error: aiError } = useGeminiAnalysis()

  const [fromSearch, setFromSearch] = useState(fromUniversity)
  const [toSearch, setToSearch] = useState(toUniversity)
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // Magnetic button physics
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct * 20)
    y.set(yPct * 20)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const parseAndExtract = async (f: File) => {
    try {
      const text = await parseFile(f)
      setTranscriptText(text)
      const { summary, courses } = extractTranscriptData(text)
      setTranscriptSummary(summary)
      setParsedCourses(courses)
    } catch (err) {
      console.error("Extraction error:", err)
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
        await parseAndExtract(droppedFile)
      }
    }
  }, [parseFile, setTranscriptText, setTranscriptSummary, setParsedCourses])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setFile(f)
      await parseAndExtract(f)
    }
  }

  const startAnalysis = async () => {
    if (!file || !fromUniversity || !toUniversity || !transcriptSummary) return
    
    setAnalyzing(true)
    setStep('processing')
  }

  const filteredFrom = ONTARIO_UNIVERSITIES.filter(u => u.toLowerCase().includes(fromSearch.toLowerCase()))
  const filteredTo = ONTARIO_UNIVERSITIES.filter(u => u.toLowerCase().includes(toSearch.toLowerCase()))

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-[#09090b] text-zinc-50 overflow-hidden relative">
      
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            borderRadius: ["20%", "50%", "20%"]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-emerald-900/40 blur-[120px] rounded-full mix-blend-screen"
        />
      </div>

      {/* Left Column: Form & CTA */}
      <div className="w-full md:w-[55%] min-h-[50dvh] md:min-h-[100dvh] relative z-10 flex flex-col justify-center px-8 md:px-20 py-12">
        
        <div className="space-y-4 mb-16">
          <h1 className="text-4xl md:text-6xl tracking-tighter leading-[1.1] font-medium text-white">
            Stop losing credits <br/>
            to the <span className="text-emerald-400">transfer void.</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-[45ch] leading-relaxed">
            See exactly which courses transfer, what gets lost, and the dollar value of your missing credits in 10 seconds.
          </p>
        </div>

        <div className="space-y-8 max-w-md">
          {/* FROM Selector */}
          <div className="space-y-2 relative">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">origin institution</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search university..."
                value={fromSearch}
                onChange={(e) => {
                  setFromSearch(e.target.value)
                  setFromOpen(true)
                }}
                onFocus={() => setFromOpen(true)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              />
              <MagnifyingGlass className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            </div>
            
            {fromOpen && filteredFrom.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 max-h-60 overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-1 z-50 shadow-2xl">
                {filteredFrom.map(u => (
                  <button
                    key={u}
                    onClick={() => {
                      setFromUniversity(u)
                      setFromSearch(u)
                      setFromOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TO Selector */}
          <div className="space-y-2 relative">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">destination institution</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search university..."
                value={toSearch}
                onChange={(e) => {
                  setToSearch(e.target.value)
                  setToOpen(true)
                }}
                onFocus={() => setToOpen(true)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              />
              <MagnifyingGlass className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            </div>
            
            {toOpen && filteredTo.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 max-h-60 overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-1 z-50 shadow-2xl">
                {filteredTo.map(u => (
                  <button
                    key={u}
                    onClick={() => {
                      setToUniversity(u)
                      setToSearch(u)
                      setToOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TARGET PROGRAM INPUT */}
          <div className="space-y-2 relative">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Target Program (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Computer Science (Honours)"
              value={targetProgram}
              onChange={(e) => setTargetProgram(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            />
          </div>

          {(parseError || aiError) && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-400/10 px-4 py-3 rounded-xl border border-rose-400/20">
              <WarningCircle size={20} />
              <p className="text-sm">{parseError || aiError}</p>
            </div>
          )}

          {/* TRANSCRIPT SUMMARY CARD */}
          {transcriptSummary && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] mb-8">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Transcript Detected</h3>
              <div className="space-y-3 font-medium text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Credits Completed</span>
                  <span className="text-white">{transcriptSummary.totalCreditsCompleted.toFixed(1)} cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Estimated Year</span>
                  <span className="text-white">{transcriptSummary.currentYear}{transcriptSummary.currentYear === 1 ? 'st' : transcriptSummary.currentYear === 2 ? 'nd' : transcriptSummary.currentYear === 3 ? 'rd' : 'th'} Year</span>
                </div>
                <div className="flex justify-between items-center h-8">
                  <span className="text-zinc-400">GPA</span>
                  {transcriptSummary.gpa !== null ? (
                    <span className="text-white">{transcriptSummary.gpa.toFixed(2)} / 4.0</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 text-xs hidden md:inline">Grades not found</span>
                      <input 
                        type="number" 
                        min="0" max="4" step="0.1" 
                        placeholder="e.g. 3.0"
                        value={manualGpa}
                        onChange={(e) => setManualGpa(e.target.value)}
                        className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-right focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Courses Found</span>
                  <span className="text-white">{parsedCourses.length} courses</span>
                </div>
                <div className="flex justify-between items-center h-8">
                  <span className="text-zinc-400">Program</span>
                  {transcriptSummary.programDetected ? (
                    <span className="text-white truncate max-w-[150px] text-right" title={transcriptSummary.programDetected}>{transcriptSummary.programDetected}</span>
                  ) : (
                    <input 
                      type="text" 
                      placeholder="Program (optional)"
                      value={manualProgram}
                      onChange={(e) => setManualProgram(e.target.value)}
                      className="w-40 bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-right focus:outline-none focus:border-emerald-500/50"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Magnetic CTA */}
          <div className="pt-4">
            <motion.button
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              whileTap={{ scale: 0.98 }}
              style={{ x: mouseXSpring, y: mouseYSpring }}
              onClick={startAnalysis}
              disabled={!file || !fromUniversity || !toUniversity || analyzing || parsing}
              className="group relative flex items-center justify-center gap-3 w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-8 py-4 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{analyzing || parsing ? 'Preparing analysis...' : 'Analyze Credits'}</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Right Column: Drag & Drop Zone */}
      <div className="w-full md:w-[45%] p-4 md:p-8 relative z-10 flex flex-col">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex-1 flex flex-col items-center justify-center min-h-[40dvh] rounded-[2.5rem] backdrop-blur-xl transition-all duration-300 relative overflow-hidden group border
            ${dragActive ? 'bg-emerald-500/10 border-emerald-500/50 scale-[0.98]' : 'bg-white/5 border-white/10'}
            ${file ? 'border-emerald-500/30' : ''}
            shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
          `}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          
          <motion.div 
            animate={dragActive ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors
              ${dragActive || file ? 'bg-emerald-500 text-zinc-950' : 'bg-white/10 text-zinc-400 group-hover:bg-white/20 group-hover:text-white'}
            `}
          >
            <FilePdf size={40} weight={file ? "fill" : "regular"} />
          </motion.div>

          {file ? (
            <div className="text-center">
              <p className="text-xl font-medium text-white bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/30">
                {file.name}
              </p>
              <p className="text-zinc-500 mt-3 text-sm">Ready to analyze</p>
            </div>
          ) : (
            <div className="text-center px-6">
              <p className="text-2xl font-medium text-white mb-2">Drop Transcript PDF</p>
              <p className="text-zinc-500 text-sm max-w-[25ch] mx-auto">
                Upload your unofficial transcript. No data leaves your browser until you hit analyze.
              </p>
            </div>
          )}

          {/* Animated dashed border overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-[2.5rem]" style={{ strokeDasharray: '12, 12' }}>
            <rect x="0" y="0" width="100%" height="100%" rx="40" fill="none" stroke={dragActive ? '#10b981' : 'rgba(255,255,255,0.1)'} strokeWidth="2" className={`transition-colors ${dragActive ? 'animate-pulse' : ''}`} />
          </svg>
        </div>
      </div>

    </div>
  )
}
