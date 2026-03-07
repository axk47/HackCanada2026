import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Text, Float } from '@react-three/drei'
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

export function OrbitalScene() {
  const { results, selectedCourse } = useCredStore()
  
  // Calculate fixed positions once
  const positions = useMemo(() => {
    return getFibonacciSpherePoints(results.length, 12)
  }, [results.length])

  return (
    <div className="absolute inset-0 w-full h-full bg-[#09090b]">
      <Canvas camera={{ position: [0, 0, 22], fov: 55 }} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={['#09090b']} />
        
        <Stars radius={120} depth={60} count={6000} factor={3} fade />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[20, 20, 20]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-20, -20, -20]} intensity={0.5} color="#a1a1aa" />
        
        <OrbitControls 
          autoRotate={!selectedCourse} 
          autoRotateSpeed={0.3} 
          enableDamping 
          dampingFactor={0.06}
          maxDistance={40}
          minDistance={5}
        />

        <group>
          {results.map((course, i) => (
            <CourseOrb 
              key={course.code} 
              course={course} 
              position={positions[i]} 
              index={i} 
            />
          ))}
        </group>
      </Canvas>
    </div>
  )
}

function CourseOrb({ course, position, index }: { course: CourseResult, position: THREE.Vector3, index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedCourse, selectedCourse } = useCredStore()

  const isSelected = selectedCourse?.code === course.code

  // Colors based on status (desaturated slightly for premium feel)
  const colorHex = 
    course.status === 'transfer' ? '#10b981' : // Emerald
    course.status === 'lost' ? '#f43f5e' :     // Rose
    '#f59e0b'                                  // Amber

  const baseScale = isSelected ? 1.5 : hovered ? 1.3 : 1
  
  // Breathing animation
  useFrame(({ clock }) => {
    if (!meshRef.current || isSelected) return
    const t = clock.getElapsedTime()
    // Stagger breathing by index
    const pulse = Math.sin(t * 1.5 + index) * 0.05
    meshRef.current.scale.setScalar(baseScale + pulse)
  })

  // Smooth scale transition on hover/select
  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.scale.lerp(new THREE.Vector3(baseScale, baseScale, baseScale), 0.1)
  })

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <group position={position}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedCourse(course)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
        >
          <sphereGeometry args={[isSelected ? 0.7 : 0.5, 32, 32]} />
          <meshStandardMaterial 
            color={colorHex} 
            emissive={colorHex}
            emissiveIntensity={hovered || isSelected ? 0.5 : 0.15}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>

        {/* Floating Label */}
        {(hovered || isSelected) && (
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {course.code}
          </Text>
        )}
      </group>
    </Float>
  )
}
