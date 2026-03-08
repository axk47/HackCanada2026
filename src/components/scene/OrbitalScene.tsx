import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { useCredStore } from '@/store/useCredStore'
import type { CourseResult } from '@/types'

// Fibonacci sphere point generation
function getFibonacciSpherePoints(samples: number, radius = 10) {
  const points: THREE.Vector3[] = []
  const phi = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = phi * i

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    points.push(new THREE.Vector3(x * radius, y * radius, z * radius))
  }
  return points
}

function TransferLines({ positions, results }: { positions: THREE.Vector3[], results: CourseResult[] }) {
  const linesRef = useRef<THREE.LineSegments>(null)
  const materialRef = useRef<THREE.LineBasicMaterial>(null)

  const lineGeometry = useMemo(() => {
    // Collect all 'transfer' indices
    const transferIndices: number[] = []
    results.forEach((r, i) => {
      if (r.status === 'transfer') transferIndices.push(i)
    })

    const points: number[] = []
    
    // Connect each to its 2 nearest transfer neighbors
    transferIndices.forEach((i) => {
      const p1 = positions[i]
      
      const distances = transferIndices
        .filter(j => j !== i)
        .map(j => ({ j, dist: p1.distanceTo(positions[j]) }))
        .sort((a, b) => a.dist - b.dist)
        
      const nearest = distances.slice(0, 2)
      
      nearest.forEach(({ j }) => {
        const p2 = positions[j]
        // Add exact line
        points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
        // Add slight offsets to fake width
        points.push(p1.x + 0.01, p1.y, p1.z + 0.01, p2.x + 0.01, p2.y, p2.z + 0.01)
        points.push(p1.x - 0.01, p1.y, p1.z - 0.01, p2.x - 0.01, p2.y, p2.z - 0.01)
      })
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    return geometry
  }, [positions, results])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      // Oscillate opacity between 0.15 and 0.35
      materialRef.current.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 2) * 0.1
    }
  })

  if (lineGeometry.attributes.position.count === 0) return null

  return (
    <lineSegments geometry={lineGeometry} ref={linesRef}>
      <lineBasicMaterial ref={materialRef} color="#10b981" transparent opacity={0.25} />
    </lineSegments>
  )
}

export function OrbitalScene() {
  const { results, selectedCourse } = useCredStore()
  const labelRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (labelRef.current) {
        labelRef.current.style.left = e.clientX + 'px'
        labelRef.current.style.top = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  // Calculate fixed positions once
  const positions = useMemo(() => {
    return getFibonacciSpherePoints(results.length, 12)
  }, [results.length])

  // Base radius based on total courses
  const baseRadius = useMemo(() => {
    if (results.length === 0) return 1
    return Math.max(0.3, Math.min(1.2, 8 / Math.sqrt(results.length)))
  }, [results.length])

  return (
    <div className="absolute inset-0 w-full h-full bg-[#09090b]">
      <Canvas 
        camera={{ position: [0, 0, 22], fov: 55 }} 
        gl={{ antialias: true, alpha: false }}
        performance={{ min: 0.5 }}
        frameloop="demand"
      >
        <color attach="background" args={['#09090b']} />
        
        <AdaptiveDpr />
        <AdaptiveEvents />

        <Stars radius={120} depth={60} count={2000} factor={3} fade />
        
        <ambientLight intensity={0.15} />
        <hemisphereLight color="#1a2a1a" groundColor="#0a0a0a" intensity={1.2} />
        <pointLight position={[15, 15, 15]} intensity={2.0} color="#ffffff" />
        <pointLight position={[-15, -10, -5]} intensity={1.0} color="#10b981" />
        <pointLight position={[0, -20, 10]} intensity={0.5} color="#ef4444" />
        <pointLight position={[0, 20, 10]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-10, -5, -10]} intensity={0.8} color="#10b981" />
        
        <OrbitControls 
          makeDefault
          autoRotate={!selectedCourse} 
          autoRotateSpeed={0.3} 
          enableDamping 
          dampingFactor={0.06}
          maxDistance={40}
          minDistance={5}
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
      </Canvas>

      {/* Global CSS Hover Label */}
      <div
        ref={labelRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          display: 'none',
          background: 'rgba(9,9,11,0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          padding: '4px 10px',
          fontFamily: 'Geist Mono, monospace',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          color: '#ffffff',
          zIndex: 1000,
          transform: 'translate(-50%, -130%)',
          whiteSpace: 'nowrap',
        }}
      />
    </div>
  )
}

const MemoizedOrb = React.memo(CourseOrb)

function CourseOrb({ course, position, index, baseRadius, labelRef }: { course: CourseResult, position: THREE.Vector3, index: number, baseRadius: number, labelRef: React.RefObject<HTMLDivElement | null> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const hoveredRef = useRef(false)
  const { setSelectedCourse, selectedCourse } = useCredStore()

  const isSelected = selectedCourse?.code === course.code

  // Specific orb radius + weighting based on credits
  const orbRadius = baseRadius + (course.credits * 0.06)

  // Colors based on status (desaturated slightly for premium feel)
  const statusColor = 
    course.status === 'transfer' ? '#10b981' : // Emerald
    course.status === 'lost' ? '#f43f5e' :     // Rose
    '#f59e0b'                                  // Amber

  // Smooth scale transition and breathing animation
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    
    // Target base scale
    const targetBase = isSelected ? 1.5 : hoveredRef.current ? 1.3 : 1
    
    // Calculate final target including breathing (only breathe if not selected)
    const targetScale = isSelected 
      ? targetBase 
      : targetBase + Math.sin(clock.getElapsedTime() * 1.5 + index) * 0.05
      
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
  })

  const labelStatusText = course.status === 'transfer' ? 'Transfers Cleanly' : course.status === 'lost' ? 'Lost' : 'Partial'

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <group position={position}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedCourse(course)
          }}
          onPointerEnter={(e) => {
            e.stopPropagation()
            hoveredRef.current = true
            document.body.style.cursor = 'pointer'
            if (labelRef.current) {
              labelRef.current.style.display = 'block'
              labelRef.current.style.color = statusColor
              labelRef.current.textContent = `${course.code}  •  ${labelStatusText}`
            }
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            hoveredRef.current = false
            document.body.style.cursor = 'auto'
            if (labelRef.current) {
              labelRef.current.style.display = 'none'
            }
          }}
        >
          <sphereGeometry args={[orbRadius, 64, 64]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.18}
            metalness={0.4}
            roughness={0.2}
          />
        </mesh>
      </group>
    </Float>
  )
}
