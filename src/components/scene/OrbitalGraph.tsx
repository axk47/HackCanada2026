import CreditOrb from './CreditOrb';
import { useCredCheckStore } from '@/store/useCredCheckStore';
import type { TransferResult } from '@/types';

function layoutOrbs(results: TransferResult[]): Array<{ result: TransferResult; pos: [number, number, number]; delay: number }> {
  const layout: Array<{ result: TransferResult; pos: [number, number, number]; delay: number }> = [];

  // Group by status — transfers inner ring, partial middle, lost outer
  const groups = {
    transfer: results.filter(r => r.status === 'transfer'),
    partial: results.filter(r => r.status === 'partial'),
    lost: results.filter(r => r.status === 'lost'),
  };

  const rings: Array<{ items: TransferResult[]; radius: number; ySpread: number }> = [
    { items: groups.transfer, radius: 4.0, ySpread: 1.2 },
    { items: groups.partial,  radius: 7.5, ySpread: 1.8 },
    { items: groups.lost,     radius: 11.0, ySpread: 2.2 },
  ];

  let globalIdx = 0;

  for (const { items, radius, ySpread } of rings) {
    if (items.length === 0) continue;
    const angleStep = (2 * Math.PI) / items.length;
    items.forEach((result, i) => {
      const angle = i * angleStep;
      // Add slight vertical offset and Z jitter for depth
      const y = (Math.sin(i * 1.7 + globalIdx) * ySpread);
      const rVar = radius + Math.cos(i * 2.3) * 0.8;
      const pos: [number, number, number] = [
        Math.cos(angle) * rVar,
        y,
        Math.sin(angle) * rVar,
      ];
      layout.push({ result, pos, delay: globalIdx * 0.08 });
      globalIdx++;
    });
  }

  return layout;
}

export default function OrbitalGraph() {
  const results = useCredCheckStore((s) => s.results);
  const selectedResult = useCredCheckStore((s) => s.selectedResult);
  const selectResult = useCredCheckStore((s) => s.selectResult);

  const orbLayout = layoutOrbs(results);

  const handleOrbClick = (result: TransferResult) => {
    selectResult(selectedResult?.course.code === result.course.code ? null : result);
  };

  return (
    <group>
      {orbLayout.map(({ result, pos, delay }) => (
        <CreditOrb
          key={result.course.code}
          result={result}
          position={pos}
          onClick={handleOrbClick}
          isSelected={selectedResult?.course.code === result.course.code}
          spawnDelay={delay}
        />
      ))}
    </group>
  );
}
