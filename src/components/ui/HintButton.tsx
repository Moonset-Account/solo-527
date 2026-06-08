import { Lightbulb } from 'lucide-react';

interface HintButtonProps {
  hintsLeft: number;
  onClick: () => void;
  hint: string | null;
  onDismiss: () => void;
}

export default function HintButton({ hintsLeft, onClick, hint, onDismiss }: HintButtonProps) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={hintsLeft <= 0}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          hintsLeft > 0
            ? 'bg-[#F5C542]/20 border border-[#F5C542]/50 text-[#F5C542] hover:bg-[#F5C542]/30 hover:shadow-[0_0_10px_rgba(245,197,66,0.3)]'
            : 'bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        <Lightbulb className="w-3.5 h-3.5" />
        提示 ({hintsLeft})
      </button>
      {hint && (
        <div className="absolute bottom-full mb-2 left-0 right-0 min-w-[200px] z-40 animate-fadeIn">
          <div className="bg-[#0D4F4F]/95 backdrop-blur-sm border border-[#F5C542]/40 rounded-lg p-3 shadow-lg">
            <p className="text-white text-xs leading-relaxed">{hint}</p>
            <button onClick={onDismiss} className="text-[#F5C542] text-[10px] mt-1.5 hover:underline">知道了</button>
          </div>
        </div>
      )}
    </div>
  );
}
