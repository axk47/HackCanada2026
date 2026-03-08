import { AnimatePresence, motion } from 'framer-motion'
import { UploadScreen } from './components/UploadScreen'
import { ProcessingScreen } from './components/ProcessingScreen'
import { OrbitalScene } from './components/scene/OrbitalScene'
import { CoursePanel } from './components/CoursePanel'
import { HUD } from './components/HUD'
import { useCredStore } from './store/useCredStore'

function App() {
  const { step } = useCredStore()

  return (
    <div className="min-h-[100dvh] w-full bg-[#09090b] text-zinc-50 selection:bg-emerald-500/30 font-sans relative overflow-hidden">
      
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10"
          >
            <UploadScreen />
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10"
          >
            <ProcessingScreen />
          </motion.div>
        )}

        {step === 'scene' && (
          <motion.div
            key="scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <OrbitalScene />
            <CoursePanel />
            <HUD />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default App
