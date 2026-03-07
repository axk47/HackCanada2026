import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { useCredCheckStore } from '@/store/useCredCheckStore';
import { speakText, stopVoice, buildVoiceSummary } from '@/services/ttsService';
import type { TransferResult } from '@/types';

const STATUS_LABELS = {
  transfer: { label: '✅ Transfers', cls: 'status-transfer' },
  partial:  { label: '🟡 Partial Credit', cls: 'status-partial' },
  lost:     { label: '❌ Lost', cls: 'status-lost' },
};

interface CourseDetailPanelProps {
  result: TransferResult;
  position: [number, number, number];
}

export default function CourseDetailPanel({ result, position }: CourseDetailPanelProps) {
  const selectResult = useCredCheckStore((s) => s.selectResult);
  const isPlayingVoice = useCredCheckStore((s) => s.isPlayingVoice);
  const setIsPlayingVoice = useCredCheckStore((s) => s.setIsPlayingVoice);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    return () => { stopVoice(); setIsPlayingVoice(false); };
  }, [result.course.code]);

  const handleSpeak = async () => {
    if (isPlayingVoice) {
      stopVoice();
      setIsPlayingVoice(false);
      return;
    }
    setIsPlayingVoice(true);
    try {
      await speakText(buildVoiceSummary(result));
    } catch (e) {
      console.warn('TTS error:', e);
    } finally {
      setIsPlayingVoice(false);
    }
  };

  const statusInfo = STATUS_LABELS[result.status];
  const { course, dollarValue, explanation, recommendation, equivalentCourse } = result;

  return (
    <Html
      position={position}
      center
      distanceFactor={12}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        style={{
          width: '320px',
          background: 'rgba(7, 15, 30, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '20px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(56,189,248,0.05)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.95)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          fontFamily: '"IBM Plex Sans", sans-serif',
          color: '#e2e8f0',
          userSelect: 'none',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: '#38bdf8', letterSpacing: '0.1em', marginBottom: '4px', textTransform: 'uppercase' }}>
              {course.code}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3, maxWidth: '220px' }}>
              {course.name}
            </div>
          </div>
          <button
            onClick={() => { stopVoice(); setIsPlayingVoice(false); selectResult(null); }}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px', borderRadius: '4px' }}
          >×</button>
        </div>

        {/* Status + credits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span className={statusInfo.cls}>{statusInfo.label}</span>
          <span style={{ fontSize: '12px', color: '#64748b', fontFamily: '"Space Mono", monospace' }}>
            {course.creditHours} cr hrs
          </span>
          {course.grade && (
            <span style={{ fontSize: '12px', color: '#64748b', fontFamily: '"Space Mono", monospace' }}>
              Grade: {course.grade}
            </span>
          )}
        </div>

        {/* Equivalent course */}
        {equivalentCourse && (
          <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ fontSize: '10px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Space Mono", monospace', marginBottom: '2px' }}>Transfers as</div>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{equivalentCourse}</div>
          </div>
        )}

        {/* Dollar value — only show if losing money */}
        {dollarValue > 0 && (
          <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Estimated loss</span>
            <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '18px', fontWeight: 700, color: '#f87171' }}>
              -{dollarValue.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
            </span>
          </div>
        )}

        {/* Explanation */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Space Mono", monospace', marginBottom: '4px' }}>Why</div>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#cbd5e1', margin: 0 }}>{explanation}</p>
        </div>

        {/* Recommendation */}
        <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
          <div style={{ fontSize: '10px', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Space Mono", monospace', marginBottom: '4px' }}>What you can do</div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#cbd5e1', margin: 0 }}>{recommendation}</p>
        </div>

        {/* Voice button */}
        <button
          onClick={handleSpeak}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: '"Space Mono", monospace',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            background: isPlayingVoice ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.1)',
            border: `1px solid ${isPlayingVoice ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.3)'}`,
            color: isPlayingVoice ? '#f87171' : '#38bdf8',
          }}
          id={`voice-btn-${course.code.replace(/\s/g, '-')}`}
        >
          <span>{isPlayingVoice ? '⏹' : '🔊'}</span>
          <span>{isPlayingVoice ? 'Stop' : 'Hear Summary'}</span>
          {isPlayingVoice && (
            <span style={{ display: 'inline-flex', gap: '2px' }}>
              {[0, 0.1, 0.2].map((d) => (
                <span key={d} style={{
                  display: 'inline-block', width: '3px', height: '10px', borderRadius: '2px',
                  background: '#f87171', animation: `pulse-glow 0.7s ease-in-out ${d}s infinite alternate`,
                  verticalAlign: 'middle',
                }} />
              ))}
            </span>
          )}
        </button>
      </div>
    </Html>
  );
}
