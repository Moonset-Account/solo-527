import { useGameStore } from '@/store/useGameStore';
import type { SignalPhaseConfig } from '@/types';
import * as AudioTrigger from '@/engine/AudioTrigger';

export default function SignalPanel() {
  const intersections = useGameStore((s) => s.intersections);
  const selectedIntersection = useGameStore((s) => s.selectedIntersection);
  const selectIntersection = useGameStore((s) => s.selectIntersection);
  const adjustSignal = useGameStore((s) => s.adjustSignal);
  const level = useGameStore((s) => s.level);

  if (!level) return null;

  const intersection = intersections.find((i) => i.id === selectedIntersection);
  if (!intersection) {
    return (
      <div className="absolute right-3 top-16 w-72 rounded-lg border border-white/10 bg-[#1a1a2e]/90 p-4 backdrop-blur-sm">
        <h3 className="mb-3 font-['Orbitron'] text-sm font-bold text-white/80">
          信号灯控制
        </h3>
        <p className="text-xs text-white/40">
          点击路口查看信号灯配置
        </p>
        <div className="mt-3 space-y-2">
          {level.intersections.map((ic) => (
            <button
              key={ic.id}
              onClick={() => selectIntersection(ic.id)}
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {ic.id} ({ic.type})
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handlePhaseChange = (
    direction: string,
    field: keyof SignalPhaseConfig,
    value: number | boolean,
  ) => {
    const before = intersection.phases.map((p) => ({ ...p }));
    const after = intersection.phases.map((p) =>
      p.direction === direction ? { ...p, [field]: value } : p,
    );
    adjustSignal(intersection.id, before, after);
    AudioTrigger.playSignalChange();
  };

  return (
    <div className="absolute right-3 top-16 w-80 rounded-lg border border-white/10 bg-[#1a1a2e]/90 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-['Orbitron'] text-sm font-bold text-white/80">
          {intersection.id} 信号灯
        </h3>
        <button
          onClick={() => selectIntersection(null)}
          className="text-xs text-white/40 transition hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {intersection.phases.map((phase) => (
          <div
            key={phase.direction}
            className="rounded border border-white/5 bg-white/5 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-white/70">
                {directionLabel(phase.direction)}
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    phase.busPriority ? '#2ecc71' : '#e74c3c',
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-12 text-[10px] text-white/40">周期</span>
                <input
                  type="range"
                  min={15}
                  max={90}
                  value={phase.cycleLength}
                  onChange={(e) =>
                    handlePhaseChange(
                      phase.direction,
                      'cycleLength',
                      Number(e.target.value),
                    )
                  }
                  className="h-1 flex-1 cursor-pointer appearance-none rounded bg-white/10 accent-[#2ecc71]"
                />
                <span className="w-8 text-right text-[10px] text-white/60">
                  {phase.cycleLength}s
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-12 text-[10px] text-white/40">绿灯</span>
                <input
                  type="range"
                  min={5}
                  max={Math.floor(phase.cycleLength * 0.8)}
                  value={phase.greenDuration}
                  onChange={(e) =>
                    handlePhaseChange(
                      phase.direction,
                      'greenDuration',
                      Number(e.target.value),
                    )
                  }
                  className="h-1 flex-1 cursor-pointer appearance-none rounded bg-white/10 accent-[#2ecc71]"
                />
                <span className="w-8 text-right text-[10px] text-white/60">
                  {phase.greenDuration}s
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">公交优先</span>
                <button
                  onClick={() =>
                    handlePhaseChange(
                      phase.direction,
                      'busPriority',
                      !phase.busPriority,
                    )
                  }
                  className={`rounded px-2 py-0.5 text-[10px] transition ${
                    phase.busPriority
                      ? 'bg-[#2ecc71]/20 text-[#2ecc71]'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  {phase.busPriority ? '开' : '关'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function directionLabel(dir: string): string {
  const map: Record<string, string> = {
    north: '北 ↑',
    south: '南 ↓',
    east: '东 →',
    west: '西 ←',
  };
  return map[dir] ?? dir;
}
