import { useParams, useNavigate } from 'react-router-dom';
import { getKnowledgeCardById } from '@/data/knowledge';
import KnowledgeCardView from '@/components/ui/KnowledgeCardView';
import { ArrowLeft } from 'lucide-react';

export default function Knowledge() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const card = cardId ? getKnowledgeCardById(cardId) : null;

  if (!card) {
    return (
      <div className="w-full h-screen bg-[#0a2e2e] flex items-center justify-center">
        <p className="text-gray-400">未找到知识卡片</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#0a2e2e] via-[#0D4F4F] to-[#0a2e2e] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-400 hover:text-[#F5C542] transition-colors text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <KnowledgeCardView
          card={card}
          onNext={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
