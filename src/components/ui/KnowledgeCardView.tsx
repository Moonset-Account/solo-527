import { useState } from 'react';
import { KnowledgeCard } from '@/types/game';
import { BookOpen, Shield, Globe, FlaskConical, ArrowRight } from 'lucide-react';

interface KnowledgeCardViewProps {
  card: KnowledgeCard;
  onNext?: () => void;
}

export default function KnowledgeCardView({ card, onNext }: KnowledgeCardViewProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 p-8 max-w-lg mx-auto">
      <h2 className="text-[#F5C542] text-xl font-bold">知识卡片</h2>
      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full perspective-1000"
      >
        <div className={`relative w-full min-h-[320px] transition-transform duration-700 transform-style-preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
          <div className={`absolute inset-0 backface-hidden rounded-2xl p-6 border-2 border-[#F5C542]/50 bg-gradient-to-br from-[#0D4F4F] to-[#0a2e2e] shadow-[0_0_30px_rgba(245,197,66,0.15)] ${flipped ? 'pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-6 h-6 text-[#F5C542]" />
              <h3 className="text-[#F5C542] text-lg font-bold">{card.title}</h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-gray-200 text-sm leading-relaxed">{card.principle}</p>
            </div>
            {card.relatedFormula && (
              <div className="mt-4 p-3 bg-[#0a2e2e] rounded-lg border border-[#1a5a5a]">
                <code className="text-[#F5C542] text-sm font-mono">{card.relatedFormula}</code>
              </div>
            )}
            <p className="text-gray-500 text-xs mt-4 text-center">点击翻转查看安全提示与应用</p>
          </div>
          <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl p-6 border-2 border-emerald-500/50 bg-gradient-to-br from-[#0D4F4F] to-[#0a2e2e] shadow-[0_0_30px_rgba(16,185,129,0.15)] ${!flipped ? 'pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h3 className="text-emerald-400 text-lg font-bold">安全须知</h3>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed mb-5">{card.safetyNote}</p>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div>
                <h4 className="text-sky-400 text-xs font-bold mb-1">生活中的应用</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{card.realWorldApplication}</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-4 text-center">点击翻转返回</p>
          </div>
        </div>
      </button>
      {onNext && (
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#F5C542] text-[#0a2e2e] font-bold rounded-full hover:bg-[#e8a830] transition-all hover:shadow-[0_0_15px_rgba(245,197,66,0.4)]"
        >
          查看结算 <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
