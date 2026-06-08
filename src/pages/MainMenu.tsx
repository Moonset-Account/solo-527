import { useNavigate } from 'react-router-dom';
import { useSaveStore } from '@/stores/saveStore';
import { FlaskConical, Play, Settings, BookOpen, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MainMenu() {
  const navigate = useNavigate();
  const save = useSaveStore(s => s.save);
  const resetSave = useSaveStore(s => s.resetSave);
  const [showParticles, setShowParticles] = useState(true);
  const hasSave = save.completedLevels.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => setShowParticles(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#0a2e2e] via-[#0D4F4F] to-[#0a2e2e] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#F5C542] animate-float"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 animate-fadeIn">
          <FlaskConical className="w-16 h-16 text-[#F5C542] drop-shadow-[0_0_20px_rgba(245,197,66,0.5)]" />
          <h1 className="text-5xl font-bold text-[#F5C542] tracking-wider drop-shadow-[0_0_30px_rgba(245,197,66,0.3)]" style={{ fontFamily: '"ZCOOL KuaiLe", cursive' }}>
            化学实验室
          </h1>
          <p className="text-gray-300 text-sm tracking-widest">安全操作 · 严谨实验 · 快乐学习</p>
        </div>

        <div className="flex flex-col gap-3 w-64 animate-slideUp">
          <button
            onClick={() => navigate('/tutorial')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F5C542] text-[#0a2e2e] font-bold rounded-full hover:bg-[#e8a830] transition-all hover:shadow-[0_0_20px_rgba(245,197,66,0.4)] hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5" /> 开始实验
          </button>

          {hasSave && (
            <button
              onClick={() => navigate(`/lab/level_${save.currentLevel}`)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0D4F4F] border border-[#F5C542]/50 text-[#F5C542] font-bold rounded-full hover:bg-[#0D4F4F]/80 transition-all hover:shadow-[0_0_15px_rgba(245,197,66,0.2)]"
            >
              <Play className="w-5 h-5" /> 继续实验
            </button>
          )}

          <button
            onClick={() => navigate('/records')}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-transparent border border-[#2a6a6a] text-gray-300 rounded-full hover:border-[#F5C542]/40 hover:text-[#F5C542] transition-all"
          >
            <BookOpen className="w-4 h-4" /> 实验记录
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-transparent border border-[#2a6a6a] text-gray-300 rounded-full hover:border-[#F5C542]/40 hover:text-[#F5C542] transition-all"
          >
            <Settings className="w-4 h-4" /> 设置
          </button>

          {hasSave && (
            <button
              onClick={() => { if (confirm('确定要重置所有存档吗？此操作不可撤销。')) resetSave(); }}
              className="flex items-center justify-center gap-2 px-4 py-1.5 text-gray-500 text-xs hover:text-red-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> 重置存档
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
