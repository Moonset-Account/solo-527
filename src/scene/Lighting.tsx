interface LightingProps {
  timeOfDay?: 'day' | 'night';
}

export function Lighting({ timeOfDay = 'day' }: LightingProps) {
  const isNight = timeOfDay === 'night';

  return (
    <>
      <ambientLight
        intensity={isNight ? 0.15 : 0.35}
        color={isNight ? '#4455aa' : '#8899bb'}
      />
      <directionalLight
        position={isNight ? [30, 60, 20] : [40, 80, 30]}
        intensity={isNight ? 0.2 : 0.6}
        color={isNight ? '#6688cc' : '#bbd4ff'}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
      <hemisphereLight
        args={
          isNight
            ? (['#1a2a4a', '#0a1530', 0.25] as any)
            : (['#5a7fb8', '#1a2540', 0.4] as any)
        }
      />
      <pointLight
        position={[-14, 5, -14]}
        color="#ff3333"
        intensity={isNight ? 2.5 : 1.5}
        distance={isNight ? 40 : 30}
        decay={2}
      />
      <pointLight
        position={[14, 5, 14]}
        color="#33ff55"
        intensity={isNight ? 2.0 : 1.2}
        distance={isNight ? 40 : 30}
        decay={2}
      />
      <pointLight
        position={[14, 5, -14]}
        color="#33ff55"
        intensity={isNight ? 2.0 : 1.2}
        distance={isNight ? 40 : 30}
        decay={2}
      />
      <pointLight
        position={[-14, 5, 14]}
        color="#ff3333"
        intensity={isNight ? 2.5 : 1.5}
        decay={2}
        distance={isNight ? 40 : 30}
      />
      {isNight && (
        <>
          <pointLight
            position={[0, 12, 0]}
            color="#ffdd88"
            intensity={0.8}
            distance={60}
            decay={2}
          />
          <pointLight
            position={[-30, 6, 0]}
            color="#ffaacc"
            intensity={0.5}
            distance={25}
            decay={2}
          />
          <pointLight
            position={[30, 6, 0]}
            color="#88ddff"
            intensity={0.5}
            distance={25}
            decay={2}
          />
          <pointLight
            position={[0, 6, -30]}
            color="#aaffcc"
            intensity={0.5}
            distance={25}
            decay={2}
          />
          <pointLight
            position={[0, 6, 30]}
            color="#ffccaa"
            intensity={0.5}
            distance={25}
            decay={2}
          />
        </>
      )}
    </>
  );
}
