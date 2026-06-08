import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Hand, Droplets, Thermometer, ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react';

interface TutorialStep {
  step: number;
  icon: React.ElementType;
  title: string;
  text: string;
  color: string;
  bgColor: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    step: 1,
    icon: FlaskConical,
    title: '欢迎',
    text: '欢迎来到化学实验室！在这里你可以安全地进行化学实验模拟。',
    color: 'var(--accent-green)',
    bgColor: 'rgba(0, 255, 136, 0.1)',
  },
  {
    step: 2,
    icon: Hand,
    title: '选择器材',
    text: '从器材栏中选择实验器材，拖放到实验台上。',
    color: 'var(--accent-blue)',
    bgColor: 'rgba(184, 232, 252, 0.1)',
  },
  {
    step: 3,
    icon: Droplets,
    title: '添加试剂',
    text: '从试剂架选择试剂，添加到对应的器材中。',
    color: 'var(--accent-amber)',
    bgColor: 'rgba(255, 184, 0, 0.1)',
  },
  {
    step: 4,
    icon: Thermometer,
    title: '控制温度',
    text: '使用温度控制区调整温度，观察反应变化。',
    color: 'var(--accent-red)',
    bgColor: 'rgba(255, 68, 68, 0.1)',
  },
  {
    step: 5,
    icon: ClipboardCheck,
    title: '完成实验',
    text: '按照步骤面板的指引完成实验，注意安全提示！',
    color: 'var(--accent-green)',
    bgColor: 'rgba(0, 255, 136, 0.1)',
  },
];

export default function Tutorial() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const step = tutorialSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tutorialSteps.length - 1;
  const Icon = step.icon;

  const goNext = () => {
    if (!isLast) {
      setDirection('right');
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (!isFirst) {
      setDirection('left');
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ background: 'linear-gradient(180deg, #0A2E36 0%, #0D3B46 50%, #12434F 100%)' }}
    >
      <h1
        className="font-display text-3xl md:text-4xl mb-8 tracking-wider"
        style={{ color: 'var(--accent-green)' }}
      >
        TUTORIAL
      </h1>

      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-center gap-2">
          {tutorialSteps.map((s, i) => (
            <div
              key={s.step}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === currentStep ? '32px' : '8px',
                background: i === currentStep ? step.color : 'var(--border-color)',
              }}
            />
          ))}
        </div>
      </div>

      <div
        key={currentStep}
        className={`card-base w-full max-w-lg p-8 mb-8 ${
          direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'
        }`}
        style={{ borderColor: step.color }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-xl"
            style={{ background: step.bgColor, border: `1px solid ${step.color}` }}
          >
            <Icon size={28} style={{ color: step.color }} />
          </div>
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: step.color }}
            >
              Step {step.step} / {tutorialSteps.length}
            </span>
            <h2 className="text-xl font-bold font-body" style={{ color: 'var(--text-primary)' }}>
              {step.title}
            </h2>
          </div>
        </div>

        <div
          className="flex items-center justify-center rounded-lg p-8 mb-6"
          style={{ background: step.bgColor, border: `1px dashed ${step.color}` }}
        >
          <Icon size={64} style={{ color: step.color, opacity: 0.5 }} />
        </div>

        <p className="font-body text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {step.text}
        </p>
      </div>

      <div className="flex items-center justify-between w-full max-w-lg">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            isFirst
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-opacity-20 cursor-pointer'
          }`}
          style={{
            color: 'var(--text-secondary)',
            border: isFirst ? 'none' : '1px solid var(--border-color)',
          }}
          onClick={goPrev}
          disabled={isFirst}
        >
          <ChevronLeft size={18} />
          上一步
        </button>

        <button
          className="font-body text-sm underline cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => navigate('/levels')}
        >
          跳过教程
        </button>

        {isLast ? (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => navigate('/levels')}
          >
            开始实验
          </button>
        ) : (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={goNext}
          >
            下一步
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
