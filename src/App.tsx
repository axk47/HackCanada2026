import { useCredCheckStore } from '@/store/useCredCheckStore';
import UploadScreen from '@/components/UploadScreen';
import LoadingScreen from '@/components/LoadingScreen';
import CredCheckScene from '@/components/scene/CredCheckScene';
import HUD from '@/components/HUD';

export default function App() {
  const step = useCredCheckStore((s) => s.step);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020817', overflow: 'hidden' }}>
      {/* DIAGNOSTIC TEST ELEMENT — remove if you see this */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'red', color: 'white', fontSize: '24px', padding: '8px 16px', fontFamily: 'monospace' }}>
        ✅ REACT IS RENDERING — step: {step}
      </div>
      {step === 'upload' && <UploadScreen />}
      {step === 'analyzing' && <LoadingScreen />}
      {step === 'results' && (
        <>
          <CredCheckScene />
          <HUD />
        </>
      )}
    </div>
  );
}
