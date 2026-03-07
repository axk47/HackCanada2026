import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import OrbitalGraph from './OrbitalGraph';
import CourseDetailPanel from './CourseDetailPanel';
import { useCredCheckStore } from '@/store/useCredCheckStore';
import { useEffect, useRef } from 'react';

// Layout map — keep in sync with OrbitalGraph layout logic
function getOrbPosition(results: ReturnType<typeof useCredCheckStore.getState>['results'], code: string): [number, number, number] {
  const groups = {
    transfer: results.filter(r => r.status === 'transfer'),
    partial: results.filter(r => r.status === 'partial'),
    lost: results.filter(r => r.status === 'lost'),
  };

  const rings = [
    { items: groups.transfer, radius: 4.0, ySpread: 1.2 },
    { items: groups.partial,  radius: 7.5, ySpread: 1.8 },
    { items: groups.lost,     radius: 11.0, ySpread: 2.2 },
  ];

  let globalIdx = 0;
  for (const { items, radius, ySpread } of rings) {
    const angleStep = (2 * Math.PI) / Math.max(items.length, 1);
    for (let i = 0; i < items.length; i++) {
      if (items[i].course.code === code) {
        const angle = i * angleStep;
        const y = Math.sin(i * 1.7 + globalIdx) * ySpread;
        const rVar = radius + Math.cos(i * 2.3) * 0.8;
        return [Math.cos(angle) * rVar, y + 1.5, Math.sin(angle) * rVar];
      }
      globalIdx++;
    }
  }
  return [0, 0, 0];
}

function SceneBackground() {
  return (
    <>
      <color attach="background" args={['#020817']} />
      <fog attach="fog" args={['#020817', 18, 45]} />
      <Stars radius={80} depth={50} count={4000} factor={3} saturation={0.15} fade speed={0.4} />
      <Environment preset="night" />
      <ambientLight intensity={0.15} />
      <directionalLight position={[8, 10, 5]} intensity={0.4} color="#38bdf8" />
      <directionalLight position={[-8, -5, -5]} intensity={0.2} color="#7c3aed" />
    </>
  );
}

export default function CredCheckScene() {
  const selectedResult = useCredCheckStore((s) => s.selectedResult);
  const results = useCredCheckStore((s) => s.results);
  const selectResult = useCredCheckStore((s) => s.selectResult);

  // Dismiss panel on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectResult(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectResult]);

  const panelPos = selectedResult
    ? getOrbPosition(results, selectedResult.course.code)
    : null;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Top nav bar */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'linear-gradient(to bottom, rgba(2,8,23,0.95), transparent)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '18px', fontWeight: 700 }}>
          <span style={{ color: '#38bdf8' }}>Cred</span>
          <span style={{ color: '#e2e8f0' }}>Check</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontFamily: '"Space Mono", monospace', fontSize: '11px' }}>
          <span style={{ color: '#22c55e' }}>🟢 Transfer</span>
          <span style={{ color: '#eab308' }}>🟡 Partial</span>
          <span style={{ color: '#ef4444' }}>🔴 Lost</span>
        </div>
        <button
          onClick={() => useCredCheckStore.getState().reset()}
          style={{
            pointerEvents: 'all',
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(56,189,248,0.2)',
            color: '#64748b',
            padding: '6px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
          }}
          id="back-button"
        >
          ← New Analysis
        </button>
      </div>

      <Canvas
        camera={{ position: [0, 4, 18], fov: 58 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        shadows={false}
        onClick={(e) => {
          // Click on canvas background (not a mesh) — deselect
          if ((e.target as HTMLElement).tagName === 'CANVAS') {
            selectResult(null);
          }
        }}
      >
        <PerformanceMonitor>
          <AdaptiveDpr pixelated />
          <SceneBackground />
          <OrbitalGraph />

          {selectedResult && panelPos && (
            <CourseDetailPanel result={selectedResult} position={panelPos} />
          )}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            dampingFactor={0.05}
            enableDamping
            minDistance={5}
            maxDistance={30}
            autoRotate={!selectedResult}
            autoRotateSpeed={0.4}
          />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
