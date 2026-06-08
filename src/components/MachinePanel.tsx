import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { MACHINE_TYPES } from "@/config/machines";
import { LEVEL_CONFIGS } from "@/config/levels";
import type { Direction } from "@/game/types";
import { soundManager } from "@/game/sound";

const DIRECTION_ICONS: Record<Direction, React.ReactNode> = {
  up: <ArrowUp size={14} />,
  down: <ArrowDown size={14} />,
  left: <ArrowLeft size={14} />,
  right: <ArrowRight size={14} />,
};

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

export default function MachinePanel() {
  const coins = useGameStore((s) => s.coins);
  const currentLevelId = useGameStore((s) => s.currentLevelId);
  const selectedMachineType = useGameStore((s) => s.selectedMachineType);
  const selectedDirection = useGameStore((s) => s.selectedDirection);
  const selectMachineType = useGameStore((s) => s.selectMachineType);
  const setSelectedDirection = useGameStore((s) => s.setSelectedDirection);
  const removeMode = useGameStore((s) => s.removeMode);
  const toggleRemoveMode = useGameStore((s) => s.toggleRemoveMode);

  const levelConfig = currentLevelId
    ? LEVEL_CONFIGS.find((l) => l.id === currentLevelId)
    : null;

  const availableIds = levelConfig ? levelConfig.availableMachines : Object.keys(MACHINE_TYPES);
  const levelMachines = availableIds
    .map((id) => MACHINE_TYPES[id])
    .filter(Boolean);

  return (
    <div className="industrial-panel px-2 py-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 border-2 transition-all cursor-pointer
            ${removeMode
              ? "border-factory-red bg-factory-red/20 shadow-[0_0_8px_rgba(196,75,75,0.5)]"
              : "border-factory-border bg-factory-panel hover:border-factory-cream/50"
            }`}
          onClick={() => {
            soundManager.play("click");
            toggleRemoveMode();
          }}
        >
          <Trash2 size={18} className={removeMode ? "text-factory-red" : "text-factory-cream"} />
          <span className={`font-terminal text-xs ${removeMode ? "text-factory-red" : "text-factory-cream/70"}`}>拆除</span>
        </button>

        <div className="w-px h-10 bg-factory-border flex-shrink-0" />

        {levelMachines.map((machine) => {
          const isSelected = selectedMachineType === machine.id;
          const canAfford = coins >= machine.cost;
          return (
            <button
              key={machine.id}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 border-2 transition-all cursor-pointer
                ${isSelected
                  ? "border-factory-accent bg-factory-accent/20 shadow-[0_0_8px_rgba(196,93,44,0.5)]"
                  : canAfford
                    ? "border-factory-border bg-factory-panel hover:border-factory-cream/50"
                    : "border-factory-rivet bg-factory-dark opacity-50"
                }`}
              onClick={() => {
                soundManager.play("click");
                selectMachineType(machine.id);
              }}
              disabled={!canAfford && !isSelected}
            >
              <span className="font-terminal text-lg text-factory-cream">{machine.name}</span>
              <span className={`font-terminal text-sm ${canAfford ? "text-factory-gold" : "text-factory-red"}`}>
                ⬡{machine.cost}
              </span>
            </button>
          );
        })}

        {(selectedMachineType || removeMode) && (
          <div className="flex-shrink-0 flex flex-col items-center gap-1 ml-2 pl-2 border-l border-factory-border">
            <span className="font-terminal text-xs text-factory-cream/70">方向</span>
            <div className="grid grid-cols-2 gap-1">
              {DIRECTIONS.map((dir) => (
                <button
                  key={dir}
                  className={`p-1 border transition-all cursor-pointer
                    ${selectedDirection === dir
                      ? "border-factory-accent bg-factory-accent/30"
                      : "border-factory-border bg-factory-panel hover:border-factory-cream/50"
                    }`}
                  onClick={() => {
                    soundManager.play("click");
                    setSelectedDirection(dir);
                  }}
                >
                  {DIRECTION_ICONS[dir]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
