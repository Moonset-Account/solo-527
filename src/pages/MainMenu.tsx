import { useNavigate } from 'react-router-dom';
import MenuBackground from '@/components/menu/MenuBackground';
import NeonButton from '@/components/ui/NeonButton';
import { useAudio } from '@/hooks/useAudio';

export default function MainMenu() {
  const navigate = useNavigate();
  const { play } = useAudio();

  const handleClick = (path: string) => {
    play('button-click');
    navigate(path);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center">
      <MenuBackground />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-center mb-4">
          <h1
            className="text-5xl md:text-7xl font-bold tracking-wider mb-3"
            style={{
              fontFamily: 'Orbitron, monospace',
              color: '#00ff88',
              textShadow: '0 0 20px #00ff8888, 0 0 40px #00ff8844, 0 0 60px #00ff8822',
            }}
          >
            信号灯指挥官
          </h1>
          <p
            className="text-lg md:text-xl tracking-widest"
            style={{
              fontFamily: 'Orbitron, monospace',
              color: '#ff8800',
              textShadow: '0 0 10px #ff880066',
            }}
          >
            TRAFFIC LIGHT COMMANDER
          </p>
        </div>

        <div className="flex flex-col gap-4 w-64">
          <NeonButton variant="green" size="lg" onClick={() => handleClick('/levels')}>
            开始游戏
          </NeonButton>
          <NeonButton variant="orange" size="md" onClick={() => handleClick('/game/sandbox')}>
            沙盒模式
          </NeonButton>
          <NeonButton variant="green" size="md" onClick={() => handleClick('/levels')}>
            关卡选择
          </NeonButton>
        </div>

        <p className="text-white/30 text-sm mt-8">
          调整红绿灯周期，疏导城市交通
        </p>
      </div>
    </div>
  );
}
