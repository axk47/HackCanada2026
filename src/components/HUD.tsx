import { useEffect, useRef, useState } from 'react';
import { useCredCheckStore } from '@/store/useCredCheckStore';

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const startVal = useRef(0);

  useEffect(() => {
    startVal.current = display;
    startTime.current = null;
    const target = value;

    const animate = (time: number) => {
      if (!startTime.current) startTime.current = time;
      const elapsed = time - startTime.current;
      const duration = 1800;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal.current + (target - startVal.current) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

export default function HUD() {
  const { results, totalCreditHours, lostCreditHours, transferCreditHours, partialCreditHours, totalDollarLoss, fromUniversity, toUniversity } = useCredCheckStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const lostCount = results.filter(r => r.status === 'lost').length;
  const partialCount = results.filter(r => r.status === 'partial').length;
  const transferCount = results.filter(r => r.status === 'transfer').length;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 20,
        padding: '0 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(2,8,23,0.9) 0%, transparent 100%)',
      }}
    >
      {/* Transfer path label */}
      <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: '#38bdf8', letterSpacing: '0.08em', opacity: 0.7 }}>
        {fromUniversity} → {toUniversity}
      </div>

      {/* Main stats row */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {/* Transfers */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 20px', borderRadius: '12px',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          minWidth: '100px',
        }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '22px', fontWeight: 700, color: '#4ade80' }}>
            <AnimatedNumber value={transferCount} />
          </div>
          <div style={{ fontSize: '10px', color: '#4ade80', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Space Mono", monospace' }}>Transfer</div>
          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: '"Space Mono", monospace' }}>
            <AnimatedNumber value={transferCreditHours} suffix=" cr" />
          </div>
        </div>

        {/* Partials */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 20px', borderRadius: '12px',
          background: 'rgba(234,179,8,0.08)',
          border: '1px solid rgba(234,179,8,0.2)',
          minWidth: '100px',
        }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '22px', fontWeight: 700, color: '#facc15' }}>
            <AnimatedNumber value={partialCount} />
          </div>
          <div style={{ fontSize: '10px', color: '#facc15', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Space Mono", monospace' }}>Partial</div>
          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: '"Space Mono", monospace' }}>
            <AnimatedNumber value={partialCreditHours} suffix=" cr" />
          </div>
        </div>

        {/* Lost */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 20px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          minWidth: '100px',
        }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '22px', fontWeight: 700, color: '#f87171' }}>
            <AnimatedNumber value={lostCount} />
          </div>
          <div style={{ fontSize: '10px', color: '#f87171', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Space Mono", monospace' }}>Lost</div>
          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: '"Space Mono", monospace' }}>
            <AnimatedNumber value={lostCreditHours} suffix=" cr" />
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: 'rgba(56,189,248,0.15)', margin: '0 8px', alignSelf: 'stretch' }} />

        {/* Dollar loss — big hero stat */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '10px 28px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.4)',
          boxShadow: totalDollarLoss > 0 ? '0 0 30px rgba(239,68,68,0.12)' : 'none',
        }}>
          <div style={{ fontSize: '10px', color: '#f87171', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"Space Mono", monospace', marginBottom: '2px' }}>
            💸 Est. Dollar Loss
          </div>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '28px', fontWeight: 700, color: '#f87171', lineHeight: 1 }}>
            -$<AnimatedNumber value={totalDollarLoss} />
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: '"Space Mono", monospace', marginTop: '2px' }}>
            @ $800/credit · Ontario avg
          </div>
        </div>

        {/* Total */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 20px', borderRadius: '12px',
          background: 'rgba(56,189,248,0.06)',
          border: '1px solid rgba(56,189,248,0.15)',
          minWidth: '100px',
        }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '22px', fontWeight: 700, color: '#38bdf8' }}>
            <AnimatedNumber value={results.length} />
          </div>
          <div style={{ fontSize: '10px', color: '#38bdf8', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Space Mono", monospace' }}>Total</div>
          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: '"Space Mono", monospace' }}>
            <AnimatedNumber value={totalCreditHours} suffix=" cr" />
          </div>
        </div>
      </div>

      <div style={{ fontSize: '10px', color: '#334155', fontFamily: '"Space Mono", monospace' }}>
        Click any orb to see details · Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
