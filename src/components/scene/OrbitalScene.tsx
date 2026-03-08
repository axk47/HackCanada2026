import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useCredStore } from '@/store/useCredStore'
import type { CourseResult } from '@/types'

// ── Seeded pseudo-random (deterministic so layout never shifts) ────────────────
function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ── Constellation layout ──────────────────────────────────────────────────────
// Three "constellations" spread across the sky:
//   Transferred  →  right+top arc    (large cluster, most stars)
//   Review       →  lower-center     (medium cluster)
//   Lost         →  upper-left       (small, tight cluster)
function getConstellationPositions(results: CourseResult[]): THREE.Vector3[] {
  // Use likelyOutcome for cluster grouping if available, fallback to status
  const getGroup = (r: CourseResult) =>
    r.likelyOutcome ?? (r.status === 'partial' ? 'review' : r.status)

  const groups: Record<string, number[]> = { transfer: [], review: [], lost: [] }
  results.forEach((r, i) => {
    const g = getGroup(r)
    ;(groups[g] ??= []).push(i)
  })

  const positions = new Array(results.length).fill(null).map(() => new THREE.Vector3())

  // Cluster centers spread wide across the sky, generous radii
  const clusterConfig = {
    transfer: { cx:  11, cy:  2,  cz:  0, rx: 16, ry: 8,  rz: 8,  seed: 42  },
    review:   { cx:  -3, cy: -7,  cz: -2, rx: 8,  ry: 5,  rz: 6,  seed: 77  },
    lost:     { cx: -14, cy:  4,  cz:  2, rx: 6,  ry: 6,  rz: 5,  seed: 111 },
  }

  for (const status of ['transfer', 'review', 'lost'] as const) {
    const idxs = groups[status]
    if (idxs.length === 0) continue
    const { cx, cy, cz, rx, ry, rz, seed } = clusterConfig[status]
    const rng = seededRng(seed)

    idxs.forEach((globalIdx, j) => {
      const angle = j * 2.399963          // golden angle
      const r = Math.sqrt(j / Math.max(idxs.length - 1, 1))

      const x = cx + Math.cos(angle) * r * rx + (rng() - 0.5) * 2.0
      const y = cy + (rng() - 0.5) * ry
      const z = cz + Math.sin(angle) * r * rz + (rng() - 0.5) * 2.0

      positions[globalIdx] = new THREE.Vector3(x, y, z)
    })
  }

  // Repulsion pass — push any two orbs that overlap until min spacing is met
  const MIN_DIST = 3.2
  for (let pass = 0; pass < 25; pass++) {
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const diff = positions[i].clone().sub(positions[j])
        const dist = diff.length()
        if (dist < MIN_DIST && dist > 0.001) {
          const push = diff.normalize().multiplyScalar((MIN_DIST - dist) * 0.5)
          positions[i].add(push)
          positions[j].sub(push)
        }
      }
    }
  }

  return positions
}

// ── Department-grouped lines ──────────────────────────────────────────────────
// Lines connect courses from the SAME academic department (shared code prefix).
// Line color = transfer success ratio for that department:
//   green  → ≥67% of dept courses transfer
//   amber  → 33–66% transfer (mixed)
//   rose   → <33% transfer (mostly lost)
function DepartmentLines({ positions, results }: {
  positions: THREE.Vector3[]
  results: CourseResult[]
}) {
  const matRef = useRef<THREE.LineBasicMaterial>(null)

  const geo = useMemo(() => {
    // Parse dept prefix: first block of uppercase letters in the code ("COSC 1P02" → "COSC")
    const getDept = (code: string) => code.match(/^[A-Z]+/)?.[0] ?? 'GEN'

    // Group indices by department
    const depts: Record<string, number[]> = {}
    results.forEach((r, i) => {
      const d = getDept(r.code)
      ;(depts[d] ??= []).push(i)
    })
    const getOutcome = (r: CourseResult) => r.likelyOutcome

    const pts: number[] = []
    const cols: number[] = []

    for (const idxs of Object.values(depts)) {
      if (idxs.length < 2) continue   // lone course — no line to draw

      // Transfer success ratio for this department
      const transferCount = idxs.filter(i => getOutcome(results[i]) === 'transfer').length
      const ratio = transferCount / idxs.length
      const c = ratio >= 0.67
        ? new THREE.Color('#22c55e')   // mostly transfers  → emerald
        : ratio <= 0.33
          ? new THREE.Color('#ef4444') // mostly lost       → red
          : new THREE.Color('#f59e0b') // mixed             → amber

      // Connect each course to its single nearest course in the same dept
      // (nearest-neighbor MST-like — keeps it sparse and readable)
      const connected = new Set<string>()
      idxs.forEach(i => {
        const nearest = idxs
          .filter(j => j !== i)
          .sort((a, b) =>
            positions[i].distanceTo(positions[a]) -
            positions[i].distanceTo(positions[b])
          )[0]

        const key = [Math.min(i, nearest), Math.max(i, nearest)].join('-')
        if (connected.has(key)) return
        connected.add(key)

        const p1 = positions[i], p2 = positions[nearest]
        pts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
        cols.push(c.r, c.g, c.b, c.r, c.g, c.b)
      })
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    g.setAttribute('color',    new THREE.Float32BufferAttribute(cols, 3))
    return g
  }, [positions, results])

  useFrame(({ clock }) => {
    if (matRef.current)
      matRef.current.opacity = 0.38 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1
  })

  if (!geo.attributes.position || geo.attributes.position.count === 0) return null

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial ref={matRef} vertexColors transparent opacity={0.4} />
    </lineSegments>
  )
}


// ── Nebula dust ───────────────────────────────────────────────────────────────
function NebulaField() {
  const ref = useRef<THREE.Points>(null)
  const count = 350

  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const rng = seededRng(999)
    for (let i = 0; i < count; i++) {
      const r = 22 + rng() * 16
      const th = rng() * Math.PI * 2
      const ph = Math.acos(2 * rng() - 1)
      pos[i*3]   = r * Math.sin(ph) * Math.cos(th)
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th)
      pos[i*3+2] = r * Math.cos(ph)
      const t = rng()
      if (t < 0.55) { col[i*3]=0.06; col[i*3+1]=0.73; col[i*3+2]=0.51 }
      else if (t < 0.78) { col[i*3]=0.96; col[i*3+1]=0.25; col[i*3+2]=0.37 }
      else { col[i*3]=0.95; col[i*3+1]=0.62; col[i*3+2]=0.07 }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    return g
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.01
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.13} vertexColors transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ── Crystal gem orb ───────────────────────────────────────────────────────────
function CourseGem({ course, position, index, baseRadius, labelRef }: {
  course: CourseResult
  position: THREE.Vector3
  index: number
  baseRadius: number
  labelRef: React.RefObject<HTMLDivElement | null>
}) {
  const coreRef = useRef<THREE.Mesh>(null)
  const cageRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const hovered = useRef(false)
  const { setSelectedCourse, selectedCourse } = useCredStore()
  const isSelected = selectedCourse?.code === course.code

  const r = baseRadius + course.credits * 0.06

  // Use likelyOutcome for color if available, fallback to legacy status
  const outcome = course.likelyOutcome ?? (course.status === 'partial' ? 'review' : course.status)
  const colHex =
    outcome === 'transfer' ? '#22c55e' :
    outcome === 'lost'     ? '#ef4444' : '#f59e0b'  // review = amber

  const color   = useMemo(() => new THREE.Color(colHex), [colHex])
  const glowCol = useMemo(() => new THREE.Color(colHex).multiplyScalar(1.5), [colHex])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const s = (1 + Math.sin(t * 1.3 + index * 0.8) * 0.035) *
              (isSelected ? 1.6 : hovered.current ? 1.28 : 1)

    if (coreRef.current) {
      coreRef.current.scale.setScalar(s)
      ;(coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isSelected ? 1.8 : hovered.current ? 1.1 : 0.7
    }
    if (cageRef.current) {
      cageRef.current.rotation.y = t * 0.18 + index * 0.4
      cageRef.current.rotation.x = t * 0.12 + index * 0.3
      cageRef.current.scale.setScalar(s)
      ;(cageRef.current.material as THREE.MeshBasicMaterial).opacity = isSelected ? 0.5 : 0.2
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.55 + index * 0.5
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.35 + index) * 0.35
      ringRef.current.scale.setScalar(s)
    }
  })

  const labelText =
    outcome === 'transfer' ? 'Likely Transfers ✓' :
    outcome === 'lost'     ? 'Likely Lost ✗' : 'Needs Review'

  return (
    <Float speed={0.9 + (index % 4) * 0.2} rotationIntensity={0.08} floatIntensity={0.4}>
      <group
        position={position}
        onClick={e => { e.stopPropagation(); setSelectedCourse(course) }}
        onPointerEnter={e => {
          e.stopPropagation()
          hovered.current = true
          document.body.style.cursor = 'pointer'
          if (labelRef.current) {
            labelRef.current.style.display = 'block'
            labelRef.current.style.color = colHex
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
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} metalness={0.25} roughness={0.08} />
        </mesh>
        <mesh ref={cageRef}>
          <octahedronGeometry args={[r * 1.55, 0]} />
          <meshBasicMaterial color={glowCol} wireframe transparent opacity={0.2} />
        </mesh>
        <mesh ref={ringRef}>
          <torusGeometry args={[r * 1.8, r * 0.035, 6, 64]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.85 : 0.4} />
        </mesh>
      </group>
    </Float>
  )
}

const MemoizedGem = React.memo(CourseGem)

// ── Main scene ────────────────────────────────────────────────────────────────
export function OrbitalScene() {
  const { results, selectedCourse, fromUniversity, toUniversity, transferStats, destUniversity, transcriptSummary } = useCredStore()
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

  const positions  = useMemo(() => getConstellationPositions(results), [results])
  const baseRadius = useMemo(() =>
    results.length === 0 ? 0.6 : Math.max(0.3, Math.min(0.85, 6 / Math.sqrt(results.length))),
    [results.length]
  )

  const shortFrom = (fromUniversity || 'Origin').replace(/\s+university$/i, '').replace(/\s+of\s+\w+$/i, '').trim()
  const shortTo   = (toUniversity  || 'Dest.'  ).replace(/\s+university$/i, '').replace(/\s+of\s+\w+$/i, '').trim()

  return (
    <div className="absolute inset-0 w-full h-full" style={{ background: '#050508' }}>

      {/* Header */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:20, display:'flex', justifyContent:'center', paddingTop:'20px', pointerEvents:'none' }}>
        <div style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'100px', padding:'9px 24px', display:'flex', alignItems:'center', gap:'10px', fontFamily:'ui-monospace,monospace' }}>
          <span style={{ fontSize:'11px', letterSpacing:'0.14em', color:'#10b981', textTransform:'uppercase', fontWeight:700 }}>{shortFrom}</span>
          <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'14px' }}>→</span>
          <span style={{ fontSize:'11px', letterSpacing:'0.14em', color:'#6ee7b7', textTransform:'uppercase', fontWeight:700 }}>{shortTo}</span>
          <span style={{ width:'1px', height:'14px', background:'rgba(255,255,255,0.1)', margin:'0 2px' }} />
          <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{results.length} courses</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ position:'absolute', top:'72px', right:'20px', zIndex:20, display:'flex', flexDirection:'column', gap:'8px', pointerEvents:'none' }}>
        {[
          { color:'#10b981', label:'Transferred' },
          { color:'#f59e0b', label:'Partial'     },
          { color:'#f43f5e', label:'Lost'        },
        ].map(({ color, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:color, boxShadow:`0 0 7px ${color}` }} />
            <span style={{ fontSize:'10px', letterSpacing:'0.1em', color:'rgba(255,255,255,0.45)', fontFamily:'monospace', textTransform:'uppercase' }}>{label}</span>
          </div>
        ))}

        {/* Line key */}
        <div style={{ width:'100%', height:'1px', background:'rgba(255,255,255,0.07)', margin:'4px 0' }} />
        <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'2px' }}>Lines = department</div>
        {[
          { color:'#10b981', label:'All transfer' },
          { color:'#f59e0b', label:'Mixed'        },
          { color:'#f43f5e', label:'Mostly lost'  },
        ].map(({ color, label }) => (
          <div key={'line-'+label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'14px', height:'1.5px', background:color, boxShadow:`0 0 4px ${color}` }} />
            <span style={{ fontSize:'9px', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>{label}</span>
          </div>
        ))}
      </div>

      <Canvas
        camera={{ position:[0, 4, 38], fov:54 }}
        gl={{ antialias:true, alpha:false, toneMapping:THREE.ACESFilmicToneMapping, toneMappingExposure:1.0 }}
        performance={{ min:0.5 }}
        frameloop="always"
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#050508']} />
        <AdaptiveDpr />
        <AdaptiveEvents />

        <ambientLight intensity={0.06} />
        <pointLight position={[10, 10, 10]} intensity={3.5} color="#ffffff" />
        <pointLight position={[-15, 5, 5]} intensity={1.8} color="#10b981" />
        <pointLight position={[5, -10, -5]} intensity={1.2} color="#f43f5e" />

        <Stars radius={160} depth={90} count={4000} factor={2.8} fade saturation={0.25} />
        <NebulaField />

        <OrbitControls
          makeDefault
          autoRotate={!selectedCourse}
          autoRotateSpeed={0.18}
          enableDamping
          dampingFactor={0.05}
          maxDistance={50}
          minDistance={5}
          enablePan={false}
        />

        <group>
          <DepartmentLines positions={positions} results={results} />
          {results.map((course, i) => (
            <MemoizedGem
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
            intensity={1.8}
            luminanceThreshold={0.12}
            luminanceSmoothing={0.88}
            blendFunction={BlendFunction.ADD}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Hover label */}
      <div ref={labelRef} style={{ position:'fixed', pointerEvents:'none', display:'none', background:'rgba(5,5,8,0.9)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'5px 12px', fontFamily:'ui-monospace,monospace', fontSize:'11px', fontWeight:'700', letterSpacing:'0.08em', color:'#fff', zIndex:1000, transform:'translate(-50%,-140%)', whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }} />

      {/* GPA badges */}
      {(transferStats?.destGPA !== undefined || transcriptSummary?.gpa) && (
        <div style={{ position:'absolute', top:'60px', left:'50%', transform:'translateX(-50%)', zIndex:20, display:'flex', gap:'10px', pointerEvents:'none' }}>
          {transcriptSummary?.gpa && (
            <div style={{ background:'rgba(9,9,11,0.85)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'100px', padding:'5px 16px', fontFamily:'ui-monospace,monospace', fontSize:'12px', display:'flex', gap:'6px' }}>
              <span style={{ color:'rgba(255,255,255,0.4)' }}>Brock GPA</span>
              <span style={{ color:'#fff', fontWeight:700 }}>{transcriptSummary.gpa.toFixed(2)}/4.0</span>
            </div>
          )}
          {transferStats?.destGPA !== undefined && destUniversity && (
            <div style={{ background:'rgba(9,9,11,0.85)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'100px', padding:'5px 16px', fontFamily:'ui-monospace,monospace', fontSize:'12px', display:'flex', gap:'6px' }}>
              <span style={{ color:'rgba(255,255,255,0.4)' }}>{destUniversity.name.split(' ')[0]} GPA</span>
              <span style={{ color:'#6ee7b7', fontWeight:700 }}>{transferStats.destGPA}/{destUniversity.gpaScale.type.replace('-point','')}</span>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ position:'absolute', bottom:'90px', left:'50%', transform:'translateX(-50%)', zIndex:20, textAlign:'center', pointerEvents:'none', whiteSpace:'nowrap' }}>
        <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', fontFamily:'ui-monospace,monospace' }}>
          Outcomes are estimates only — official assessment confirmed after admission.{' '}
        </span>
        {destUniversity && (
          <a href={destUniversity.transferCreditUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', fontFamily:'ui-monospace,monospace', textDecoration:'underline', pointerEvents:'all' }}>
            {destUniversity.name.split(' ')[0]} transfer policy →
          </a>
        )}
      </div>
    </div>
  )
}
