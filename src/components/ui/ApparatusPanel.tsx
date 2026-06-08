import { Apparatus } from '@/types/game';
import { inputManager } from '@/engine/input/manager';

interface ApparatusPanelProps {
  apparatus: Apparatus[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  usedIds: string[];
}

export default function ApparatusPanel({ apparatus, selectedId, onSelect, usedIds }: ApparatusPanelProps) {
  const mode = inputManager.getMode();
  return (
    <div className="flex items-center gap-2 p-2.5 bg-[#0a2e2e]/90 rounded-xl border border-[#1a5a5a] backdrop-blur-sm">
      <span className="text-[#F5C542] text-xs font-bold mr-1 flex-shrink-0">器材</span>
      <div className="flex gap-2 overflow-x-auto">
        {apparatus.map((item, i) => {
          const isUsed = usedIds.includes(item.id);
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => !isUsed && onSelect(item.id)}
              disabled={isUsed}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[56px] transition-all duration-200 ${
                isSelected
                  ? 'bg-[#F5C542]/25 border-2 border-[#F5C542] shadow-[0_0_10px_rgba(245,197,66,0.4)] scale-105'
                  : isUsed
                  ? 'bg-[#1a3a3a]/50 border border-transparent opacity-40'
                  : 'bg-[#0D4F4F]/60 border border-[#2a6a6a] hover:border-[#F5C542]/40 hover:bg-[#0D4F4F]'
              }`}
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center text-lg ${isSelected ? 'bg-[#F5C542]/20' : 'bg-[#1a4a4a]'}`}>
                {item.type === 'beaker' ? '🧪' : item.type === 'flask' ? '⚗️' : item.type === 'test_tube' ? '🧫' : item.type === 'thermometer' ? '🌡️' : item.type === 'bunsen_burner' ? '🔥' : item.type === 'dropper' ? '💧' : item.type === 'stirrer' ? '🥢' : item.type === 'funnel' ? '🔺' : '🧫'}
              </div>
              <span className="text-[9px] text-gray-300 whitespace-nowrap">{item.name}</span>
              {mode === 'keyboard' && !isUsed && (
                <span className="text-[8px] text-[#F5C542]/60">{i + 1}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
