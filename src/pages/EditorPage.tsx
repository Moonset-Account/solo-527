import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LevelConfig, IntersectionConfig, RoadConfig, SignalPhaseConfig } from '@/types';
import * as AudioTrigger from '@/engine/AudioTrigger';

const DEFAULT_INTERSECTION: IntersectionConfig = {
  id: 'int-1',
  position: [0, 0],
  type: 'cross',
  signalPhases: [
    { direction: 'north', greenDuration: 15, cycleLength: 30, busPriority: false },
    { direction: 'south', greenDuration: 15, cycleLength: 30, busPriority: false },
    { direction: 'east', greenDuration: 15, cycleLength: 30, busPriority: false },
    { direction: 'west', greenDuration: 15, cycleLength: 30, busPriority: false },
  ],
};

export default function EditorPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LevelConfig>({
    id: 'custom',
    name: '自定义关卡',
    description: '用户自建关卡',
    intersections: [{ ...DEFAULT_INTERSECTION, signalPhases: DEFAULT_INTERSECTION.signalPhases.map((p) => ({ ...p })) }],
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
    targetScore: 50,
    timeLimit: 120,
    initialCycleLength: 30,
    initialGreenDuration: 15,
  });

  const [jsonOutput, setJsonOutput] = useState('');

  const handleExport = () => {
    const json = JSON.stringify(config, null, 2);
    setJsonOutput(json);
    AudioTrigger.playUIClick();
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level-${config.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    AudioTrigger.playUIClick();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.intersections && data.roads) {
          setConfig(data);
          AudioTrigger.playUIClick();
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  const updateConfig = (updates: Partial<LevelConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateTargetScore = (v: number) => updateConfig({ targetScore: v });
  const updateTimeLimit = (v: number) => updateConfig({ timeLimit: v });
  const updateName = (v: string) => updateConfig({ name: v });

  return (
    <div className="min-h-screen bg-[#0a0a1a] p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-['Orbitron'] text-xl font-bold text-white/90">
            关卡编辑器
          </h1>
          <button
            onClick={() => navigate('/')}
            className="rounded bg-white/5 px-4 py-2 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            ← 返回
          </button>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-white/10 bg-[#1a1a2e] p-5">
            <h2 className="mb-3 font-['Orbitron'] text-sm font-bold text-white/70">
              基本信息
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-16 text-[10px] text-white/40">名称</span>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateName(e.target.value)}
                  className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 outline-none focus:border-[#0abde3]/30"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-[10px] text-white/40">目标评分</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={config.targetScore}
                  onChange={(e) => updateTargetScore(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded bg-white/10 accent-[#2ecc71]"
                />
                <span className="w-8 text-right text-[10px] text-white/60">
                  ≤{config.targetScore}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-[10px] text-white/40">时间限制</span>
                <input
                  type="range"
                  min={60}
                  max={600}
                  step={30}
                  value={config.timeLimit}
                  onChange={(e) => updateTimeLimit(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded bg-white/10 accent-[#0abde3]"
                />
                <span className="w-12 text-right text-[10px] text-white/60">
                  {config.timeLimit}s
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#1a1a2e] p-5">
            <h2 className="mb-3 font-['Orbitron'] text-sm font-bold text-white/70">
              路口配置 ({config.intersections.length})
            </h2>
            <p className="text-[10px] text-white/30">
              通过编辑 JSON 数据自定义路口布局。当前支持 cross / t-junction / complex 类型。
            </p>
            {config.intersections.map((ic, idx) => (
              <div key={ic.id} className="mt-3 rounded border border-white/5 bg-white/5 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-white/60">{ic.id}</span>
                  <span className="text-[10px] text-white/30">{ic.type}</span>
                  <span className="text-[10px] text-white/20">
                    ({ic.position[0]}, {ic.position[1]})
                  </span>
                </div>
                <div className="mt-1 text-[9px] text-white/20">
                  {ic.signalPhases.length} 相位
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-white/10 bg-[#1a1a2e] p-5">
            <h2 className="mb-3 font-['Orbitron'] text-sm font-bold text-white/70">
              道路配置 ({config.roads.length})
            </h2>
            {config.roads.map((road) => (
              <div key={road.id} className="mt-1 text-[10px] text-white/30">
                {road.from} → {road.to} | {road.lanes}车道 | {road.speedLimit}km/h
              </div>
            ))}
          </section>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex-1 rounded bg-[#0abde3]/20 px-4 py-2 font-['Orbitron'] text-xs text-[#0abde3] transition hover:bg-[#0abde3]/30"
            >
              预览 JSON
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 rounded bg-[#2ecc71]/20 px-4 py-2 font-['Orbitron'] text-xs text-[#2ecc71] transition hover:bg-[#2ecc71]/30"
            >
              下载 JSON
            </button>
            <label className="flex-1 cursor-pointer rounded bg-[#f39c12]/20 px-4 py-2 text-center font-['Orbitron'] text-xs text-[#f39c12] transition hover:bg-[#f39c12]/30">
              导入 JSON
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {jsonOutput && (
            <div className="rounded-lg border border-white/10 bg-[#0a0a1a] p-4">
              <pre className="max-h-60 overflow-auto text-[10px] text-white/40">
                {jsonOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
