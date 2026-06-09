import { useMemo } from 'react';

interface BuildingProps {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  windowColor?: string;
  windowPattern?: 'grid' | 'random' | 'none';
}

function Building({
  position,
  size,
  color,
  windowColor = '#ffd89b',
  windowPattern = 'random',
}: BuildingProps) {
  const windows = useMemo(() => {
    if (windowPattern === 'none') return null;
    const list: Array<{ pos: [number, number, number]; lit: boolean; rot?: number }> = [];
    const [w, h, d] = size;
    const cols = Math.max(2, Math.floor(w / 2));
    const rows = Math.max(1, Math.floor(h / 3));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2 + 0.5) * (w / cols);
        const y = -h / 2 + 1.5 + r * (h / rows);
        const lit =
          windowPattern === 'grid'
            ? true
            : Math.random() > 0.35;
        list.push({ pos: [x, y, d / 2 + 0.01], lit });
        list.push({ pos: [x, y, -d / 2 - 0.01], lit: Math.random() > 0.35 });
      }
    }
    return list;
  }, [size, windowPattern]);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.15}
        />
      </mesh>

      <mesh position={[0, size[1] + 0.2, 0]} receiveShadow>
        <boxGeometry args={[size[0] * 1.05, 0.4, size[2] * 1.05]} />
        <meshStandardMaterial color="#1a1a1f" roughness={0.9} />
      </mesh>

      {windows &&
        windows.map((w, i) => (
          <mesh
            key={i}
            position={w.pos}
            rotation={w.pos[2] < 0 ? [0, Math.PI, 0] : undefined}
          >
            <planeGeometry args={[0.9, 1.6]} />
            <meshStandardMaterial
              color={w.lit ? windowColor : '#2a2f3a'}
              emissive={w.lit ? windowColor : '#000000'}
              emissiveIntensity={w.lit ? 0.4 : 0}
            />
          </mesh>
        ))}
    </group>
  );
}

export function Buildings() {
  const configs = useMemo<BuildingProps[]>(
    () => [
      { position: [-30, 0, -30], size: [10, 18, 10], color: '#3a4a5f', windowPattern: 'random' },
      { position: [-22, 0, -35], size: [8, 25, 8], color: '#4a5568', windowPattern: 'random' },
      { position: [-38, 0, -22], size: [7, 14, 9], color: '#2d3748', windowPattern: 'grid' },

      { position: [30, 0, -30], size: [12, 22, 10], color: '#434e68', windowPattern: 'random' },
      { position: [22, 0, -38], size: [6, 30, 6], color: '#3a455a', windowPattern: 'random' },
      { position: [35, 0, -20], size: [9, 16, 8], color: '#2b3345', windowPattern: 'random' },

      { position: [-30, 0, 30], size: [10, 20, 12], color: '#404b63', windowPattern: 'random' },
      { position: [-20, 0, 38], size: [8, 15, 7], color: '#35415a', windowPattern: 'grid' },
      { position: [-38, 0, 22], size: [7, 28, 7], color: '#505e7a', windowPattern: 'random' },

      { position: [30, 0, 30], size: [11, 19, 9], color: '#47536b', windowPattern: 'random' },
      { position: [38, 0, 20], size: [7, 24, 8], color: '#33405a', windowPattern: 'random' },
      { position: [22, 0, 35], size: [8, 14, 10], color: '#3d4a66', windowPattern: 'grid' },

      { position: [-65, 0, 0], size: [10, 16, 14], color: '#3a4560', windowPattern: 'random' },
      { position: [-60, 0, 22], size: [7, 22, 8], color: '#46536e', windowPattern: 'random' },
      { position: [-60, 0, -22], size: [8, 18, 8], color: '#2f3a52', windowPattern: 'grid' },

      { position: [65, 0, 0], size: [10, 26, 12], color: '#4a5872', windowPattern: 'random' },
      { position: [60, 0, -25], size: [8, 14, 8], color: '#36415a', windowPattern: 'random' },
      { position: [60, 0, 25], size: [8, 20, 10], color: '#3f4c69', windowPattern: 'random' },

      { position: [0, 0, -65], size: [14, 18, 10], color: '#44506a', windowPattern: 'random' },
      { position: [25, 0, -60], size: [8, 22, 7], color: '#333e58', windowPattern: 'random' },
      { position: [-25, 0, -60], size: [9, 16, 8], color: '#495672', windowPattern: 'grid' },

      { position: [0, 0, 65], size: [12, 24, 11], color: '#3d4a66', windowPattern: 'random' },
      { position: [25, 0, 60], size: [8, 18, 9], color: '#465471', windowPattern: 'random' },
      { position: [-25, 0, 60], size: [9, 12, 8], color: '#34415a', windowPattern: 'grid' },
    ],
    []
  );

  const trees = useMemo(() => {
    const list: Array<[number, number, number]> = [];
    const spots: Array<[number, number]> = [
      [-50, -12], [-50, 12], [50, -12], [50, 12],
      [-12, -50], [12, -50], [-12, 50], [12, 50],
      [-45, -35], [-35, -45], [35, -45], [45, -35],
      [-45, 35], [-35, 45], [35, 45], [45, 35],
    ];
    for (const [x, z] of spots) {
      list.push([x, 0, z]);
    }
    return list;
  }, []);

  return (
    <group>
      {configs.map((cfg, i) => (
        <Building key={`bld_${i}`} {...cfg} />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#0d1320" roughness={1} />
      </mesh>

      {trees.map((pos, i) => (
        <group key={`tree_${i}`} position={pos}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 2, 8]} />
            <meshStandardMaterial color="#4a3525" roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <coneGeometry args={[1.8, 4, 8]} />
            <meshStandardMaterial color="#1a4d2e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 5, 0]} castShadow>
            <coneGeometry args={[1.2, 2.5, 8]} />
            <meshStandardMaterial color="#236b43" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const r = 95;
        return (
          <mesh key={`dist_bld_${i}`} position={[
            Math.cos(angle) * r,
            0,
            Math.sin(angle) * r,
          ]}>
            <boxGeometry args={[15, 10 + Math.sin(i) * 3, 15]} />
            <meshStandardMaterial
              color="#1a2235"
              roughness={1}
            />
          </mesh>
        );
      })}
    </group>
  );
}
