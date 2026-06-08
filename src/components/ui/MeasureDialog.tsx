import { useState } from 'react';
import { inputManager } from '@/engine/input/manager';
import { Beaker } from 'lucide-react';

interface MeasureDialogProps {
  targetMl: number;
  tolerance: number;
  reagentName: string;
  onConfirm: (ml: number) => void;
  onCancel: () => void;
}

export default function MeasureDialog({ targetMl, tolerance, reagentName, onConfirm, onCancel }: MeasureDialogProps) {
  const [value, setValue] = useState(0);
  const mode = inputManager.getMode();
  const inRange = Math.abs(value - targetMl) <= tolerance;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#0D4F4F] to-[#0a2e2e] rounded-2xl border-2 border-[#F5C542]/50 p-6 w-80 shadow-[0_0_40px_rgba(245,197,66,0.2)]">
        <div className="flex items-center gap-2 mb-4">
          <Beaker className="w-5 h-5 text-[#F5C542]" />
          <h3 className="text-[#F5C542] font-bold">量取 {reagentName}</h3>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-40 border-2 border-[#4a90a4] rounded-b-lg bg-[#8ecae6]/10 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-300"
              style={{
                height: `${(value / 100) * 100}%`,
                background: `linear-gradient(to top, ${inRange ? '#10b981' : '#F5C542'}88, ${inRange ? '#10b981' : '#F5C542'}44)`,
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-between py-2 px-1">
              {[100, 80, 60, 40, 20, 0].map(mark => (
                <div key={mark} className="flex items-center gap-1">
                  <div className="h-px bg-[#4a90a4]/40 flex-1" />
                  <span className="text-[7px] text-gray-400">{mark}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <span className={`text-3xl font-bold ${inRange ? 'text-emerald-400' : 'text-[#F5C542]'}`}>{value}</span>
            <span className="text-gray-400 text-sm ml-1">mL</span>
          </div>

          <div className="w-full">
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full h-2 bg-[#1a3a3a] rounded-lg appearance-none cursor-pointer accent-[#F5C542]"
            />
            <div className="flex justify-between text-[8px] text-gray-500 mt-1">
              <span>0mL</span>
              <span className={inRange ? 'text-emerald-400' : 'text-gray-400'}>目标: {targetMl}±{tolerance}mL</span>
              <span>100mL</span>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-2 bg-[#0a2e2e] border border-[#2a6a6a] text-gray-300 rounded-lg text-sm hover:border-[#F5C542]/40 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onConfirm(value)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                inRange
                  ? 'bg-[#F5C542] text-[#0a2e2e] hover:bg-[#e8a830]'
                  : 'bg-[#0D4F4F] text-[#F5C542] border border-[#F5C542]/50 hover:bg-[#0D4F4F]/80'
              }`}
            >
              {inRange ? '确认量取' : `量取 ${value}mL`}
            </button>
          </div>

          <div className="text-[10px] text-gray-500">
            {mode === 'keyboard' && '提示：↑↓微调 · Enter确认 · Esc取消'}
            {mode === 'mouse' && '提示：拖动滑块调整量取值'}
            {mode === 'touch' && '提示：滑动调整量取值'}
          </div>
        </div>
      </div>
    </div>
  );
}
