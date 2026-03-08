import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, AdaptiveDpr, AdaptiveEvents, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useCredStore } from '@/store/useCredStore'
import type { CourseResult } from '@/types'

// Fibonacci sphere point generation
function getFibonacciSpherePoints(samples: number, radius = 14) {
  const points: THREE.Vector3[] = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = phi * i
    points.push(new THREE.Vector3(
      Math.cos(theta) * radiusAtY * radius,
      y * radius,
      Math.sin(theta) * radiusAtY * radius
    ))
  }
  return points
}

// ── Nebula particles ──────────────────────────────────────────────────────────
function NebulaField() {
  const meshRef = useRef<THREE.Points>(null)
  const count = 500

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 16
      const theta = Math.random() * Math.PI * 2
      const phi2 = Math.acos(2 * Math.random() - 1)
      pos[i * 3]     = r * Math.sin(phi2) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi2) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi2)
      const t = Math.random()
      if (t < 0.55) { col[i*3]=0.06; col[i*3+1]=0.73; col[i*3+2]=0.51 }       // emerald
      else if (t < 0.78) { col[i*3]=0.96; col[i*3+1]=0.25; col[i*3+2]=0.37 }   // rose
      else { col[i*3]=0.95; col[i*3+1]=0.62; col[i*3+2]=0.07 }                 // amber
    }
    return { positions: pos, colors: col }
  }, [])

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.018
    }
  })

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return g
  }, [positions, colors])

  return (
    <points ref={meshRef} geometry={geo}>
      <pointsMaterial size={0.16} vertexColors transparent opacity={0.65} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ── Glowing transfer lines ────────────────────────────────────────────────────
function TransferLines({ positions, results }: { positions: THREE.Vector3[], results: CourseResult[] }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null)

  const geo = useMemo(() => {
    const transferIdx: number[] = []
    results.forEach((r, i) => { if (r.status === 'transfer') transferIdx.push(i) })

    const pts: number[] = []
    transferIdx.forEach(i => {
      const p1 = positions[i]
      const nearest = transferIdx
        .filter(j => j !== i)
        .map(j => ({ j, dist: p1.distanceTo(positions[j]) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2)
      nearest.forEach(({ j }) => {
        const p2 = positions[j]
        pts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
      })
    })

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [positions, results])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 1.2) * 0.15
  })

  if (geo.attributes.position?.count === 0) return null

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial ref={matRef} color="#10b981" transparent opacity={0.4} />
    </lineSegments>
  )
}

// ── Crystal gem orb ───────────────────────────────────────────────────────────
function CrystalOrb({ course, position, index, baseRadius, labelRef }: {
  course: CourseResult
  position: THREE.Vector3
  index: number
  baseRadius: number
  labelRef: React.RefObject<HTMLDivElement | null>
}) {
  const coreRef  = useRef<THREE.Mesh>(null)
  const cageRef  = useRef<THREE.Mesh>(null)
  const ringRef  = useRef<THREE.Mesh>(null)
  const hovered  = useRef(false)
  const { setSelectedCourse, selectedCourse } = useCredStore()
  const isSelected = selectedCourse?.code === course.code

  const r = baseRadius + course.credits * 0.06

  const color = new THREE.Color(
    course.status === 'transfer' ? '#10b981' :
    course.status === 'lost'     ? '#f43f5e' : '#f59e0b'
  )
  const glow = new THREE.Color(
    course.status === 'transfer' ? '#34d399' :
    course.status === 'lost'     ? '#fb7185' : '#fbbf24'
  )
  const hexColor =
    course.status === 'transfer' ? '#10b981' :
    course.status === 'lost'     ? '#f43f5e' : '#f59e0b'

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const breathe = 1 + Math.sin(t * 1.3 + index * 0.8) * 0.035
    const boost = isSelected ? 1.5 : hovered.current ? 1.25 : 1
    const s = breathe * boost

    if (coreRef.current) coreRef.current.scale.setScalar(s)
    if (cageRef.current) {
      // Slowly rotate the diamond cage
      cageRef.current.rotation.y = t * 0.15 + index * 0.4
      cageRef.current.rotation.x = t * 0.09 + index * 0.3
      cageRef.current.scale.setScalar(s)
    }
    if (ringRef.current) {
      // Ring tilts and spins for a gyroscope effect
      ringRef.current.rotation.z = t * 0.5 + index * 0.6
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3 + index) * 0.4
      ringRef.current.scale.setScalar(s)
    }
  })

  const labelText =
    course.status === 'transfer' ? 'Transfers ✓' :
    course.status === 'lost'     ? 'Credit Lost ✗' : 'Partial Credit'

  return (
    <Float speed={1.0 + (index % 4) * 0.25} rotationIntensity={0.1} floatIntensity={0.5}>
      <group
        position={position}
        onClick={e => { e.stopPropagation(); setSelectedCourse(course) }}
        onPointerEnter={e => {
          e.stopPropagation()
          hovered.current = true
          document.body.style.cursor = 'pointer'
          if (labelRef.current) {
            labelRef.current.style.display = 'block'
            labelRef.current.style.color = hexColor
            labelRef.current.textContent = `${course.code}  ·  ${labelText}`
          }
        }}
        onPointerLeave={e => {
          e.stopPropagation()
          hovered.current = false
          document.body.style.cursor = 'auto'
          if (labelRef.current) labelRef.current.style.display = 'none'
        }}
      >
        {/* Solid gem core — classic 20-face icosahedron (diamond look) */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 1.4 : 0.7}
            metalness={0.2}
            roughness={0.05}
          />
        </mesh>

        {/* Outer cage — clean 8-face octahedron wireframe (NOT subdivided) */}
        <mesh ref={cageRef}>
          <octahedronGeometry args={[r * 1.55, 0]} />
          <meshBasicMaterial
            color={glow}
            wireframe
            transparent
            opacity={isSelected ? 0.5 : 0.18}
          />
        </mesh>

        {/* Ring — gyroscope-style orbit */}
        <mesh ref={ringRef}>
          <torusGeometry args={[r * 1.8, r * 0.035, 6, 64]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.8 : 0.4} />
        </mesh>

        {/* Sparkles on selected/hovered */}
        {(isSelected || hovered.current) && (
          <Sparkles count={16} scale={r * 3} size={0.7} speed={0.4} color={glow} opacity={0.9} />
        )}
      </group>
    </Float>
  )
}

const MemoizedOrb = React.memo(CrystalOrb)

// ── Main scene ────────────────────────────────────────────────────────────────
export function OrbitalScene() {
  const { results, selectedCourse, fromUniversity, toUniversity } = useCredStore()
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (labelRef.current) {
        labelRef.current.style.left = e.clientX + 'px'
        labelRef.current.style.top  = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const positions = useMemo(() => getFibonacciSpherePoints(results.length, 14), [results.length])
  const baseRadius = useMemo(() =>
    results.length === 0 ? 1 : Math.max(0.35, Math.min(1.1, 7 / Math.sqrt(results.length))),
    [results.length]
  )

  const shortFrom = (fromUniversity || 'Origin').replace(/\s+university$/i, '').replace(/\s+of\s+\w+$/i, '').trim()
  const shortTo   = (toUniversity  || 'Dest.'  ).replace(/\s+university$/i, '').replace(/\s+of\s+\w+$/i, '').trim()

  return (
    <div className="absolute inset-0 w-full h-full" style={{ background: '#050508' }}>

      {/* University route header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', justifyContent: 'center', paddingTop: '20px',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px',
          padding: '9px 24px', display: 'flex', alignItems: 'center', gap: '10px',
          fontFamily: 'ui-monospace, monospace',
        }}>
          <span style={{ fontSize: '11px', letterSpacing: '0.14em', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>{shortFrom}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>→</span>
          <span style={{ fontSize: '11px', letterSpacing: '0.14em', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 700 }}>{shortTo}</span>
          <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{results.length} courses</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', top: '72px', right: '20px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none' }}>
        {[
          { color: '#10b981', label: 'Transfers' },
          { color: '#f43f5e', label: 'Lost' },
          { color: '#f59e0b', label: 'Partial' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</span>
          </div>
        ))}
      </div>

      <Canvas
        camera={{ position: [0, 0, 24], fov: 52 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        performance={{ min: 0.5 }}
        frameloop="always"
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#050508']} />
        <AdaptiveDpr />
        <AdaptiveEvents />

        <ambientLight intensity={0.1} />
        <pointLight position={[20, 20, 20]} intensity={3.0} color="#ffffff" />
        <pointLight position={[-20, -10, -10]} intensity={1.5} color="#10b981" />
        <pointLight position={[10, -20, 15]} intensity={0.8} color="#f43f5e" />
        <pointLight position={[0, 25, 5]} intensity={2.0} color="#6ee7b7" />

        <Stars radius={150} depth={80} count={3000} factor={2.5} fade saturation={0.4} />
        <NebulaField />

        {/* ✅ OrbitControls — no AutoCamera competing with it */}
        <OrbitControls
          makeDefault
          autoRotate={!selectedCourse}
          autoRotateSpeed={0.3}
          enableDamping
          dampingFactor={0.06}
          maxDistance={45}
          minDistance={5}
          enablePan={false}
        />

        <group>
          <TransferLines positions={positions} results={results} />
          {results.map((course, i) => (
            <MemoizedOrb
              key={course.code}
              course={course}
              position={positions[i]}
              index={i}
              baseRadius={baseRadius}
              labelRef={labelRef}
            />
          ))}
        </group>

        <EffectComposer>
          <Bloom
            intensity={1.6}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.85}
            blendFunction={BlendFunction.ADD}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0004, 0.0004] as unknown as THREE.Vector2}
          />
        </EffectComposer>
      </Canvas>

      {/* Hover label */}
      <div
        ref={labelRef}
        style={{
          position: 'fixed', pointerEvents: 'none', display: 'none',
          background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
          padding: '5px 12px', fontFamily: 'ui-monospace, monospace',
          fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em',
          color: '#fff', zIndex: 1000, transform: 'translate(-50%, -140%)',
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  )
}
