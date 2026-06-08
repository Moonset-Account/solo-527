import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { trafficSim } from '@/engine/TrafficSim';
import { useSimulation } from '@/hooks/useSimulation';
import { useAudio } from '@/hooks/useAudio';
import GameScene from '@/components/scene/GameScene';
import SignalPanel from '@/components/ui/SignalPanel';
import CongestionDash from '@/components/ui/CongestionDash';
import TimeControl from '@/components/ui/TimeControl';
import type { LevelConfig } from '@/types';

const SANDBOX_DEFAULT: LevelConfig = {
  id: 'sandbox',
  name: '沙盒模式',
  description: '自由编辑路口布局和信号灯配置',
  intersections: [
    {
      id: 'int-1',
      position: [0, 0],
      type: 'cross',
      signalPhases: [
        { direction: 'north', greenDuration: 15, cycleLength: 30, busPriority: false },
        { direction: 'south', greenDuration: 15, cycleLength: 30, busPriority: false },
        { direction: 'east', greenDuration: 15, cycleLength: 30, busPriority: false },
        { direction: 'west', greenDuration: 15, cycleLength: 30, busPriority: false },
      ],
    },
  ],
  roads: [
    { id: 'road-n', from: 'int-1', to: 'edge-n', lanes: 2, speedLimit: 40, direction: 'north' },
    { id: 'road-s', from: 'int-1', to: 'edge-s', lanes: 2, speedLimit: 40, direction: 'south' },
    { id: 'road-e', from: 'int-1', to: 'edge-e', lanes: 2, speedLimit: 40, direction: 'east' },
    { id: 'road-w', from: 'int-1', to: 'edge-w', lanes: 2, speedLimit: 40, direction: 'west' },
  ],
  busRoutes: [],
  trafficSchedule: [
    { timeRange: [0, 24], densityMultiplier: 0.5, peakType: 'morning' },
  ],
  targetScore: 0,
  timeLimit: 9999,
  initialCycleLength: 30,
  initialGreenDuration: 15,
};

export default function SandboxPage() {
  const navigate = useNavigate();
  const startLevel = useGameStore((s) => s.startLevel);
  const setPhase = useGameStore((s) => s.setPhase);
  const phase = useGameStore((s) => s.phase);
  const level = useGameStore((s) => s.level);
  const [started, setStarted] = useState(false);

  useSimulation();
  useAudio();

  useEffect(() => {
    if (!started) {
      trafficSim.init(SANDBOX_DEFAULT);
      startLevel(SANDBOX_DEFAULT);
      setStarted(true);
    }
  }, [started]);

  const handleBack = () => {
    setPhase('menu');
    navigate('/');
  };

  if (!started || !level) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a1a]">
      <div className="h-full w-full">
        <GameScene />
      </div>

      <div className="absolute left-3 top-3 z-10">
        <button
          onClick={handleBack}
          className="rounded bg-[#1a1a2e]/80 px-3 py-1.5 font-['Orbitron'] text-[10px] text-white/50 backdrop-blur-sm transition hover:bg-[#1a1a2e] hover:text-white"
        >
          ← 返回
        </button>
      </div>

      <div className="absolute left-3 top-12 z-10 rounded bg-[#f39c12]/20 px-3 py-1 font-['Orbitron'] text-[10px] text-[#f39c12]">
        沙盒模式
      </div>

      <CongestionDash />
      <SignalPanel />
      <TimeControl />
    </div>
  );
}
