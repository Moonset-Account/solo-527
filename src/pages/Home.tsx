import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { FlaskConical, BookOpen, Settings, Terminal } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function ParticleBackground() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `rgba(0, 255, 136, ${p.opacity})`,
            animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTitleVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    { label: '开始游戏', icon: FlaskConical, path: '/levels', btnClass: 'btn-primary' },
    { label: '教程', icon: BookOpen, path: '/tutorial', btnClass: 'btn-amber' },
    { label: '设置', icon: Settings, path: '/settings', btnClass: 'btn-primary' },
    { label: '调试日志', icon: Terminal, path: '/debug', btnClass: 'btn-primary' },
  ];

  return (
    <div
      className="relative flex flex-col items-center justify-center h-screen overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A2E36 0%, #0D3B46 50%, #12434F 100%)' }}
    >
      <ParticleBackground />

      <div
        className={`relative z-10 flex flex-col items-center transition-all duration-700 ${
          titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h1
          className="font-display text-6xl md:text-8xl tracking-widest mb-4"
          style={{
            color: 'var(--accent-green)',
            textShadow: '0 0 20px rgba(0,255,136,0.6), 0 0 40px rgba(0,255,136,0.3), 0 0 80px rgba(0,255,136,0.15)',
          }}
        >
          CHEM LAB
        </h1>

        <p
          className="font-body text-lg md:text-xl mb-16 tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          化学实验室教学模拟
        </p>

        <div className="flex flex-col gap-4 w-64">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className={`${item.btnClass} flex items-center justify-center gap-3 w-full animate-fade-in-up`}
                style={{ animationDelay: `${index * 100 + 300}ms`, animationFillMode: 'both' }}
                onClick={() => navigate(item.path)}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="absolute bottom-6 text-xs font-body"
        style={{ color: 'var(--text-secondary)', opacity: 0.4 }}
      >
        Chem Lab v1.0
      </div>
    </div>
  );
}
