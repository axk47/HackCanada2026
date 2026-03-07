import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { TransferResult } from '@/types';

const STATUS_COLORS = {
  transfer: { main: '#22c55e', emissive: '#16a34a', light: '#4ade80' },
  partial:  { main: '#eab308', emissive: '#a16207', light: '#facc15' },
  lost:     { main: '#ef4444', emissive: '#b91c1c', light: '#f87171' },
};

interface CreditOrbProps {
  result: TransferResult;
  position: [number, number, number];
  onClick: (result: TransferResult) => void;
  isSelected: boolean;
  spawnDelay: number;
}

export default function CreditOrb({ result, position, onClick, isSelected, spawnDelay }: CreditOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [scale, setScale] = useState(0);
  const spawnDone = useRef(false);
  const spawnTimer = useRef(0);

  const colors = STATUS_COLORS[result.status];

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: colors.main,
      emissive: colors.emissive,
      emissiveIntensity: isSelected ? 1.5 : hovered ? 1.0 : 0.6,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.92,
    }),
    [colors, isSelected, hovered]
  );

  useFrame((_, delta) => {
    if (!spawnDone.current) {
      spawnTimer.current += delta;
      const t = Math.max(0, spawnTimer.current - spawnDelay);
      const s = Math.min(1, t * 2.5);
      // Elastic ease
      const elastic = s === 0 ? 0 : s === 1 ? 1 : Math.pow(2, -10 * s) * Math.sin((s * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
      setScale(elastic);
      if (s >= 1) spawnDone.current = true;
    }

    if (meshRef.current) {
      // Pulse scale on selected
      if (isSelected) {
        const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.05;
        meshRef.current.scale.setScalar(scale * pulse);
      } else {
        const target = hovered ? 1.15 : 1.0;
        meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x / scale || 1, target, 0.12) * scale);
      }
      material.emissiveIntensity = isSelected ? 1.5 : hovered ? 1.0 : 0.6;
    }
  });

  const labelCode = result.course.code.split(' ')[0] + ' ' + result.course.code.split(' ').slice(1).join('');

  return (
    <Float speed={1.5 + Math.random() * 0.5} rotationIntensity={0.1} floatIntensity={0.4 + Math.random() * 0.3}>
      <group position={position}>
        {/* Glow point light */}
        <pointLight
          color={colors.light}
          intensity={isSelected ? 2.5 : hovered ? 1.5 : 0.6}
          distance={3.5}
          decay={2}
        />

        {/* Main sphere */}
        <mesh
          ref={meshRef}
          material={material}
          onClick={(e) => { e.stopPropagation(); onClick(result); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[0.55, 32, 32]} />
        </mesh>

        {/* Ring around selected orb */}
        {isSelected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.82, 0.025, 8, 48]} />
            <meshBasicMaterial color={colors.light} transparent opacity={0.7} />
          </mesh>
        )}

        {/* Course code label */}
        <Text
          position={[0, -0.85, 0]}
          fontSize={0.18}
          color={hovered || isSelected ? colors.light : '#64748b'}
          anchorX="center"
          anchorY="top"
          font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff2"
          maxWidth={2}
        >
          {labelCode}
        </Text>
      </group>
    </Float>
  );
}
