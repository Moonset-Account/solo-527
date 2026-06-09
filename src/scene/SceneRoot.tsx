import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
const BlendFunction = { NORMAL: 0 };
import { CameraRig } from './CameraRig';
import { Lighting } from './Lighting';
import { Roads } from './roads/Roads';
import { Buildings } from './buildings/Buildings';
import { TrafficLights } from './roads/TrafficLights';
import { AnimationController } from './AnimationController';
import type { SimulationFrame, TrafficLightState, Vehicle } from '@/types';
import { Sky } from '@react-three/drei';

interface SceneRootProps {
  vehicles: Vehicle[];
  lightState: TrafficLightState | null;
  compareFrame?: SimulationFrame | null;
  timeOfDay?: 'day' | 'night';
}

export function SceneRoot({ vehicles, lightState, compareFrame, timeOfDay = 'day' }: SceneRootProps) {
  const isNight = timeOfDay === 'night';
  const fog = useMemo(
    () => isNight
      ? { color: '#050a18', near: 50, far: 180 }
      : { color: '#0a1628', near: 60, far: 200 },
    [isNight]
  );

  return (
    <Canvas
      shadows
      camera={{ fov: 50, near: 0.1, far: 500, position: [50, 50, 50] }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      style={{ width: '100%', height: '100%', background: fog.color }}
    >
      <color attach="background" args={[fog.color]} />
      <fog attach="fog" args={[fog.color, fog.near, fog.far]} />

      <CameraRig target={[0, 0, 0]} distance={65} />
      <Lighting timeOfDay={timeOfDay} />

      <Sky
        distance={450000}
        sunPosition={isNight ? [-80, 8, 50] : [100, 25, 100]}
        inclination={isNight ? 0.05 : 0.48}
        azimuth={isNight ? 0.75 : 0.25}
        rayleigh={isNight ? 0.1 : 0.5}
        turbidity={isNight ? 2 : 8}
        mieCoefficient={isNight ? 0.001 : 0.005}
        mieDirectionalG={isNight ? 0.9 : 0.8}
      />

      <Buildings />
      <Roads roadSize={80} laneCount={4} />
      <TrafficLights state={lightState} />
      <AnimationController
        vehicles={vehicles}
        lightState={lightState}
        compareFrame={compareFrame}
      />

      <EffectComposer multisampling={8} enableNormalPass={false}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.2}
          mipmapBlur
          radius={0.7}
        />
        <Vignette offset={0.25} darkness={0.7} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0008, 0.0012] as any}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </Canvas>
  );
}
