import { Reagent } from '@/types/game';
import { useSettingsStore } from '@/stores/settingsStore';
import { inputManager } from '@/engine/input/manager';
import { AlertTriangle } from 'lucide-react';

interface ReagentPanelProps {
  reagents: Reagent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ReagentPanel({ reagents, selectedId, onSelect }: ReagentPanelProps) {
  const mode = useSettingsStore(s => s.settings.inputMode);
  return (
    <div className="flex flex-col gap-1.5 p-3 w-44 bg-[#0a2e2e]/90 rounded-xl border border-[#1a5a5a] backdrop-blur-sm h-full overflow-y-auto">
      <h3 className="text-[#F5C542] font-bold text-sm mb-1 tracking-wider">试剂</h3>
      {reagents.map((reagent, i) => {
        const isSelected = selectedId === reagent.id;
        return (
          <button
            key={reagent.id}
            onClick={() => onSelect(reagent.id)}
            className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 ${
              isSelected
                ? 'bg-[#F5C542]/20 border border-[#F5C542]/60 shadow-[0_0_8px_rgba(245,197,66,0.3)]'
                : 'bg-[#0D4F4F]/40 border border-transparent hover:border-[#2a6a6a]'
            }`}
          >
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 border border-white/20"
              style={{ backgroundColor: reagent.color }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-white font-medium truncate">{reagent.name}</span>
              <span className="text-[8px] text-gray-400">{reagent.concentration}</span>
            </div>
            {reagent.dangerLevel > 0 && (
              <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${reagent.dangerLevel >= 2 ? 'text-red-400' : 'text-yellow-400'}`} />
            )}
            {mode === 'keyboard' && (
              <span className="text-[8px] text-[#F5C542]/60 ml-auto">{7 + i}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
