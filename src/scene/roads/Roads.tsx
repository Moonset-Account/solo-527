import { useMemo } from 'react';

interface RoadsProps {
  roadSize?: number;
  laneCount?: number;
}

export function Roads({ roadSize = 80, laneCount = 4 }: RoadsProps) {
  const roadMaterialProps = useMemo(
    () => ({
      color: '#1a1f2b',
      roughness: 0.85,
      metalness: 0.05,
    }),
    []
  );

  const laneMarkingProps = useMemo(
    () => ({
      color: '#f5f5f5',
      emissive: '#f5f5f5',
      emissiveIntensity: 0.2,
    }),
    []
  );

  const laneWidth = 3.5;
  const halfLanes = laneCount / 2;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[laneWidth * laneCount, roadSize * 2 + 16]} />
        <meshStandardMaterial {...roadMaterialProps} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roadSize * 2 + 16, laneWidth * laneCount]} />
        <meshStandardMaterial {...roadMaterialProps} />
      </mesh>

      {[-0.5, 0.5].map((side, idx) => (
        <group key={`ns_${idx}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={`ns_${idx}_dash_${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[side * laneWidth * 0.5, 0.02, (i - 3) * 16]}
            >
              <planeGeometry args={[0.2, 8]} />
              <meshStandardMaterial {...laneMarkingProps} />
            </mesh>
          ))}
        </group>
      ))}

      {[-0.5, 0.5].map((side, idx) => (
        <group key={`ew_${idx}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={`ew_${idx}_dash_${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[(i - 3) * 16, 0.02, side * laneWidth * 0.5]}
            >
              <planeGeometry args={[8, 0.2]} />
              <meshStandardMaterial {...laneMarkingProps} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[laneWidth * laneCount, laneWidth * laneCount]} />
        <meshStandardMaterial color="#252b3a" roughness={0.9} />
      </mesh>

      {[-1, 1].map((dir, idx) => (
        <group key={`stop_ns_${idx}`}>
          {[-1, 0, 1].map((laneOffset) => (
            <mesh
              key={`stop_${idx}_${laneOffset}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[
                laneOffset * laneWidth * 0.5 + (laneOffset === 0 ? -1 : 0),
                0.04,
                dir * (8 + (dir === 1 ? 1 : 0)),
              ]}
            >
              <planeGeometry args={[laneWidth * 0.9, 0.4]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.1}
              />
            </mesh>
          ))}
        </group>
      ))}

      {[-1, 1].map((dir, idx) => (
        <group key={`stop_ew_${idx}`}>
          {[-1, 0, 1].map((laneOffset) => (
            <mesh
              key={`stop_${idx}_${laneOffset}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[
                dir * (8 + (dir === 1 ? 1 : 0)),
                0.04,
                laneOffset * laneWidth * 0.5 + (laneOffset === 0 ? -1 : 0),
              ]}
            >
              <planeGeometry args={[0.4, laneWidth * 0.9]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.1}
              />
            </mesh>
          ))}
        </group>
      ))}

      <group>
        {Array.from({ length: 8 }).map((_, i) => {
          const positions = [
            [-60, -10],
            [60, -10],
            [-60, 10],
            [60, 10],
            [-10, -60],
            [10, -60],
            [-10, 60],
            [10, 60],
          ];
          const [x, z] = positions[i];
          const isVertical = Math.abs(x) > 30;
          return (
            <mesh
              key={`sidewalk_${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[x, 0.06, z]}
              receiveShadow
            >
              <boxGeometry
                args={[isVertical ? 8 : 20, 0.2, isVertical ? 20 : 8]}
              />
              <meshStandardMaterial color="#3a3f4b" roughness={0.95} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
