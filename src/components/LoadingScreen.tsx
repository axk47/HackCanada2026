import { useEffect, useState } from 'react';
import { useCredCheckStore } from '@/store/useCredCheckStore';

const PHASES = [
  'Parsing transcript…',
  'Connecting to Gemini AI…',
  'Cross-referencing ONTransfer database…',
  'Analyzing credit equivalencies…',
  'Calculating dollar impact…',
  'Generating recommendations…',
];

export default function LoadingScreen() {
  const courses = useCredCheckStore((s) => s.courses);
  const fromUniversity = useCredCheckStore((s) => s.fromUniversity);
  const toUniversity = useCredCheckStore((s) => s.toUniversity);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1));
    }, 3500);
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => { clearInterval(phaseTimer); clearInterval(dotTimer); };
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-10"
      style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%), var(--color-bg)',
      }}
    >
      {/* Animated orbital rings */}
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        {/* Outer ring */}
        <div className="absolute rounded-full border" style={{
          width: 170, height: 170,
          borderColor: 'rgba(56,189,248,0.15)',
          animation: 'spin-slow 8s linear infinite',
          borderTopColor: 'var(--color-accent)',
        }} />
        {/* Mid ring */}
        <div className="absolute rounded-full border" style={{
          width: 120, height: 120,
          borderColor: 'rgba(34,197,94,0.15)',
          animation: 'spin-slow 5s linear infinite reverse',
          borderRightColor: 'var(--color-green)',
        }} />
        {/* Inner ring */}
        <div className="absolute rounded-full border" style={{
          width: 70, height: 70,
          borderColor: 'rgba(234,179,8,0.15)',
          animation: 'spin-slow 3s linear infinite',
          borderTopColor: 'var(--color-yellow)',
        }} />
        {/* Core */}
        <div className="w-10 h-10 rounded-full animate-pulse-glow" style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.6), rgba(56,189,248,0.1))',
          boxShadow: '0 0 30px rgba(56,189,248,0.4)',
        }} />
        {/* Orbiting dots */}
        <div className="absolute w-3 h-3 rounded-full" style={{
          background: 'var(--color-green)',
          boxShadow: '0 0 8px var(--color-green)',
          top: '8px', left: '50%', marginLeft: '-6px',
          animation: 'orbit 5s linear infinite',
          transformOrigin: '6px 77px',
        }} />
        <div className="absolute w-2.5 h-2.5 rounded-full" style={{
          background: 'var(--color-red)',
          boxShadow: '0 0 8px var(--color-red)',
          top: '30px', right: '8px',
          animation: 'orbit 3.5s linear infinite reverse',
          transformOrigin: '4px 55px',
        }} />
        <div className="absolute w-2 h-2 rounded-full" style={{
          background: 'var(--color-yellow)',
          boxShadow: '0 0 8px var(--color-yellow)',
          bottom: '10px', left: '10px',
          animation: 'orbit 7s linear infinite',
          transformOrigin: '4px -30px',
        }} />
      </div>

      {/* Status */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="font-mono text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          {PHASES[phaseIdx]}<span style={{ color: 'var(--color-accent)' }}>{dots}</span>
        </div>
        <div className="text-sm font-sans" style={{ color: 'var(--color-muted)' }}>
          Analyzing <span style={{ color: 'var(--color-text)' }}>{courses.length} courses</span> ·{' '}
          <span style={{ color: 'var(--color-accent)' }}>{fromUniversity}</span>
          <span style={{ color: 'var(--color-muted)' }}> → </span>
          <span style={{ color: 'var(--color-accent)' }}>{toUniversity}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(30,58,95,0.5)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${((phaseIdx + 1) / PHASES.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--color-accent), var(--color-green))',
            boxShadow: '0 0 10px rgba(56,189,248,0.5)',
          }}
        />
      </div>

      <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
        This may take 15–30 seconds for large transcripts
      </p>
    </div>
  );
}
