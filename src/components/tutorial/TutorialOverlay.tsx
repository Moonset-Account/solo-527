import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { saveManager } from '@/game/SaveManager';
import { X, ChevronRight, Sparkles, HelpCircle } from 'lucide-react';

export function TutorialOverlay() {
  const {
    status,
    tutorialStep,
    setTutorialStep,
    skipTutorial,
    currentLevel,
  } = useGameStore();

  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  const steps = currentLevel?.tutorialSteps || [];
  const currentStep = steps[tutorialStep];

  useEffect(() => {
    if (status === 'tutorial') {
      setTimeout(() => {
        setVisible(true);
        setAnimating(true);
      }, 300);
    } else {
      setVisible(false);
    }
  }, [status]);

  if (status !== 'tutorial' || !visible || !currentStep) return null;

  const isLast = tutorialStep >= steps.length - 1;
  const isFirst = tutorialStep === 0;

  const handleNext = () => {
    setAnimating(false);
    setTimeout(() => {
      if (isLast) {
        saveManager.recordTutorial(false);
        setTutorialStep(-1);
        useGameStore.getState().setStatus('playing');
      } else {
        setTutorialStep(tutorialStep + 1);
      }
      setAnimating(true);
    }, 200);
  };

  const handleSkip = () => {
    skipTutorial();
    setVisible(false);
  };

  const positionClasses = {
    top: 'top-16 left-1/2 -translate-x-1/2',
    bottom: 'bottom-40 left-1/2 -translate-x-1/2',
    left: 'top-1/3 left-[22rem]',
    right: 'top-1/3 right-8',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }[currentStep.position || 'center'];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          animating ? 'bg-slate-950/70 backdrop-blur-sm' : 'bg-slate-950/0'
        } ${currentStep.highlightElement ? 'pointer-events-auto' : ''}`}
        onClick={currentStep.highlightElement ? undefined : handleSkip}
      />

      <div
        className={`absolute transition-all duration-500 ease-out ${positionClasses} pointer-events-auto ${
          animating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
        style={{ maxWidth: currentStep.position === 'center' ? '28rem' : '24rem' }}
      >
        <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/95 to-cyan-950/50 rounded-2xl border border-cyan-400/30 shadow-2xl shadow-cyan-500/20 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-cyan-400 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                      教程 {tutorialStep + 1}/{steps.length}
                    </span>
                  </div>
                  <h3
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    {currentStep.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed mb-5">
              {currentStep.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === tutorialStep
                        ? 'w-6 bg-cyan-400 shadow-lg shadow-cyan-400/50'
                        : i < tutorialStep
                          ? 'w-3 bg-cyan-600'
                          : 'w-3 bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={() => setTutorialStep(tutorialStep - 1)}
                    className="px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-sm font-medium transition-colors"
                  >
                    上一步
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  className="px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <HelpCircle className="w-4 h-4" />
                  跳过
                </button>
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/30 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {isLast ? '开始游戏' : '下一步'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {currentStep.position === 'left' && (
          <div
            className="absolute top-8 -right-2 w-4 h-4 bg-slate-900/95 border-r border-t border-cyan-400/30 rotate-45"
          />
        )}
        {currentStep.position === 'right' && (
          <div
            className="absolute top-8 -left-2 w-4 h-4 bg-slate-900/95 border-l border-b border-cyan-400/30 rotate-45"
          />
        )}
      </div>
    </div>
  );
}
