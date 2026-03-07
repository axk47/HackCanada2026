import { useState, useCallback, useRef } from 'react';
import { ONTARIO_UNIVERSITIES } from '@/constants/universities';
import { useCredCheckStore } from '@/store/useCredCheckStore';
import { parsePdfTranscript } from '@/services/pdfParser';
import { analyzeTransfers } from '@/services/geminiService';

export default function UploadScreen() {
  const { setStep, setFromUniversity, setToUniversity, setCourses, setResults, fromUniversity, toUniversity } = useCredCheckStore();

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setError(null);
    setFile(f);
    try {
      const courses = await parsePdfTranscript(f);
      if (courses.length === 0) {
        setError("No courses detected. Try a clearer transcript PDF.");
        return;
      }
      setCourses(courses);
      setParsedCount(courses.length);
    } catch {
      setError("Failed to parse PDF. Make sure it's text-based (not scanned).");
    }
  }, [setCourses]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file || !fromUniversity || !toUniversity || !parsedCount) return;
    setStep('analyzing');
    try {
      const courses = await parsePdfTranscript(file);
      setCourses(courses);
      const results = await analyzeTransfers(courses, fromUniversity, toUniversity);
      setResults(results);
      setStep('results');
    } catch {
      setStep('upload');
      setError('Analysis failed. Check your API key and internet connection.');
    }
  };

  const canAnalyze = !!file && !!fromUniversity && !!toUniversity && !!parsedCount;

  const s: Record<string, React.CSSProperties> = {
    root: {
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'auto',
      padding: '48px 16px',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(14,165,233,0.08) 0%, transparent 70%)',
    },
    grid: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      backgroundImage: 'linear-gradient(rgba(30,58,95,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.25) 1px, transparent 1px)',
      backgroundSize: '60px 60px',
    },
    inner: {
      position: 'relative',
      zIndex: 10,
      width: '100%',
      maxWidth: '640px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      animation: 'fadeIn 0.6s ease-out forwards',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 12px',
      borderRadius: '999px',
      fontSize: '11px',
      fontFamily: '"Space Mono", monospace',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      border: '1px solid rgba(56,189,248,0.3)',
      color: '#38bdf8',
      background: 'rgba(56,189,248,0.05)',
      marginBottom: '8px',
    },
    dot: {
      width: '6px', height: '6px', borderRadius: '50%',
      background: '#22c55e',
      animation: 'pulse 2s ease-in-out infinite',
    },
    h1: {
      fontSize: '52px',
      fontFamily: '"Space Mono", monospace',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
      margin: 0,
    },
    tagline: {
      fontSize: '17px',
      fontFamily: '"IBM Plex Sans", sans-serif',
      color: '#64748b',
      marginTop: '8px',
      lineHeight: 1.5,
    },
    statsRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: '40px',
      padding: '16px 0',
      borderTop: '1px solid #1e3a5f',
      borderBottom: '1px solid #1e3a5f',
    },
    statItem: {
      textAlign: 'center' as const,
    },
    statValue: {
      fontSize: '26px',
      fontFamily: '"Space Mono", monospace',
      fontWeight: 700,
      color: '#38bdf8',
      lineHeight: 1,
    },
    statLabel: {
      fontSize: '11px',
      color: '#64748b',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      marginTop: '4px',
      fontFamily: '"Space Mono", monospace',
    },
    dropZone: {
      borderRadius: '16px',
      border: '2px dashed #1e3a5f',
      minHeight: '160px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    dropInner: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '8px',
      padding: '40px',
      textAlign: 'center' as const,
    },
    selectors: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
    },
    label: {
      fontSize: '11px',
      fontFamily: '"Space Mono", monospace',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      color: '#38bdf8',
      marginBottom: '6px',
      display: 'block',
    },
    select: {
      width: '100%',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '14px',
      fontFamily: '"IBM Plex Sans", sans-serif',
      outline: 'none',
      background: 'rgba(15,23,42,0.8)',
      border: '1px solid #1e3a5f',
      color: '#64748b',
      cursor: 'pointer',
    },
    cta: {
      width: '100%',
      padding: '16px',
      fontSize: '15px',
      fontFamily: '"Space Mono", monospace',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    errorBox: {
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#f87171',
      fontFamily: '"IBM Plex Sans", sans-serif',
    },
    footer: {
      textAlign: 'center' as const,
      fontSize: '11px',
      fontFamily: '"Space Mono", monospace',
      color: '#334155',
    },
  };

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.inner}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={s.badge}>
            <span style={s.dot} />
            HackCanada 2026
          </div>
          <h1 style={s.h1}>
            <span style={{ color: '#38bdf8' }}>Cred</span>
            <span style={{ color: '#e2e8f0' }}>Check</span>
          </h1>
          <p style={s.tagline}>
            Upload your transcript. See every credit you're losing —<br />
            and what it's costing you in dollars.
          </p>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Ontario Universities', value: '45+' },
            { label: 'Avg Cost / Credit', value: '$800' },
            { label: 'Analysis Time', value: '<30s' },
          ].map(({ label, value }) => (
            <div key={label} style={s.statItem}>
              <div style={s.statValue}>{value}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          style={{
            ...s.dropZone,
            border: `2px dashed ${isDragging ? '#38bdf8' : file ? '#22c55e' : '#1e3a5f'}`,
            background: isDragging ? 'rgba(56,189,248,0.04)' : file ? 'rgba(34,197,94,0.04)' : 'rgba(15,23,42,0.4)',
            boxShadow: isDragging ? '0 0 30px rgba(56,189,248,0.15)' : file ? '0 0 30px rgba(34,197,94,0.1)' : 'none',
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          id="pdf-drop-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            id="pdf-upload"
          />
          <div style={s.dropInner}>
            {file ? (
              <>
                <div style={{ fontSize: '36px' }}>✅</div>
                <div style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, color: '#22c55e', fontSize: '14px' }}>{file.name}</div>
                {parsedCount !== null && (
                  <div style={{ fontSize: '13px', color: '#64748b', fontFamily: '"IBM Plex Sans", sans-serif' }}>
                    Detected <strong style={{ color: '#e2e8f0' }}>{parsedCount} courses</strong> — click to replace
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '44px', opacity: 0.4 }}>📄</div>
                <div style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: '14px', color: '#e2e8f0' }}>
                  Drop your transcript here
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', fontFamily: '"IBM Plex Sans", sans-serif' }}>
                  or click to browse — PDF only
                </div>
                <div style={{ fontSize: '11px', marginTop: '8px', color: '#334155', fontFamily: '"Space Mono", monospace' }}>
                  Parsed in your browser — no data leaves your computer
                </div>
              </>
            )}
          </div>
        </div>

        {error && <div style={s.errorBox}><span>⚠️</span> {error}</div>}

        {/* University selectors */}
        <div style={s.selectors}>
          {[
            { label: 'FROM University', val: fromUniversity, set: setFromUniversity, id: 'from-uni' },
            { label: 'TO University', val: toUniversity, set: setToUniversity, id: 'to-uni' },
          ].map(({ label, val, set, id }) => (
            <div key={id}>
              <label style={s.label} htmlFor={id}>{label}</label>
              <select
                id={id}
                value={val}
                onChange={(e) => set(e.target.value)}
                style={{ ...s.select, border: `1px solid ${val ? '#38bdf8' : '#1e3a5f'}`, color: val ? '#e2e8f0' : '#64748b' }}
              >
                <option value="" disabled>Select university…</option>
                {ONTARIO_UNIVERSITIES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          id="analyze-button"
          style={{
            ...s.cta,
            cursor: canAnalyze ? 'pointer' : 'not-allowed',
            background: canAnalyze ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)' : 'rgba(30,58,95,0.4)',
            color: canAnalyze ? '#020817' : '#64748b',
            boxShadow: canAnalyze ? '0 0 30px rgba(56,189,248,0.3)' : 'none',
          }}
          disabled={!canAnalyze}
          onClick={handleAnalyze}
        >
          {canAnalyze ? `⚡ Analyze ${parsedCount} Courses` : 'Upload transcript + select universities to begin'}
        </button>

        <p style={s.footer}>
          Powered by Gemini AI · Data from ONTransfer.ca · Built at HackCanada 2026
        </p>
      </div>
    </div>
  );
}
