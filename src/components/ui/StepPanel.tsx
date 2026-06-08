import { ExperimentStep } from '@/types/game';
import { Check, Circle, AlertTriangle } from 'lucide-react';

interface StepPanelProps {
  steps: ExperimentStep[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

export default function StepPanel({ steps, currentStepIndex, onStepClick }: StepPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 p-3 w-56 bg-[#0a2e2e]/90 rounded-xl border border-[#1a5a5a] backdrop-blur-sm h-full overflow-y-auto">
      <h3 className="text-[#F5C542] font-bold text-sm mb-1 tracking-wider">实验步骤</h3>
      {steps.map((step, i) => {
        const isCompleted = i < currentStepIndex;
        const isCurrent = i === currentStepIndex;
        const isFuture = i > currentStepIndex;
        return (
          <button
            key={step.id}
            onClick={() => onStepClick?.(i)}
            className={`flex items-start gap-2 p-2 rounded-lg text-left transition-all duration-300 ${
              isCurrent
                ? 'bg-[#F5C542]/20 border border-[#F5C542]/60 shadow-[0_0_12px_rgba(245,197,66,0.3)]'
                : isCompleted
                ? 'bg-[#0D4F4F]/60 border border-transparent'
                : 'bg-transparent border border-transparent opacity-50'
            }`}
          >
            <span className="mt-0.5 flex-shrink-0">
              {isCompleted ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : isCurrent ? (
                <Circle className="w-4 h-4 text-[#F5C542] fill-[#F5C542]" />
              ) : (
                <Circle className="w-4 h-4 text-gray-500" />
              )}
            </span>
            <span className={`text-xs leading-relaxed ${isCompleted ? 'text-emerald-300 line-through' : isCurrent ? 'text-white font-medium' : 'text-gray-400'}`}>
              {step.description}
            </span>
            {step.safetyNote && isCurrent && (
              <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
            )}
          </button>
        );
      })}
      <div className="mt-2 pt-2 border-t border-[#1a5a5a]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[#0a2e2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F5C542] to-[#e8a830] rounded-full transition-all duration-500"
              style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-[#F5C542]">{currentStepIndex}/{steps.length}</span>
        </div>
      </div>
    </div>
  );
}
