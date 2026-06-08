import SettingsPanel from '@/components/ui/SettingsPanel';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#0a0a1a]">
      <div className="absolute left-4 top-4 z-10">
        <button
          onClick={() => navigate('/')}
          className="rounded bg-[#1a1a2e]/80 px-3 py-1.5 font-['Orbitron'] text-[10px] text-white/50 backdrop-blur-sm transition hover:bg-[#1a1a2e] hover:text-white"
        >
          ← 返回
        </button>
      </div>
      <SettingsPanel />
    </div>
  );
}
