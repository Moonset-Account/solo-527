import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getExperimentById } from '@/data/experiments';
import { getReagentById } from '@/data/reagents';
import { getApparatusById } from '@/data/apparatus';
import { experimentEngine } from '@/engine/experiment/engine';
import { eventEmitter } from '@/engine/events/emitter';
import { inputManager, InputAction } from '@/engine/input/manager';
import LabCanvas from '@/components/lab/LabCanvas';
import StepPanel from '@/components/ui/StepPanel';
import ApparatusPanel from '@/components/ui/ApparatusPanel';
import ReagentPanel from '@/components/ui/ReagentPanel';
import ErrorBanner from '@/components/ui/ErrorBanner';
import HintButton from '@/components/ui/HintButton';
import { LabObject, ExperimentStep, ReactionEffect } from '@/types/game';
import { ArrowLeft, ArrowRight, Sparkles, Eye } from 'lucide-react';

export default function Tutorial() {
  const navigate = useNavigate();
  const { setPhase, setStepIndex, setTotalSteps, setError, setSafetyNote, setHint, setTracker, addLabObject, setEffects, temperature, setTemperature, selectedApparatus, selectApparatus, selectedReagent, selectReagent, resetLab } = useGameStore();
  const inputMode = useSettingsStore(s => s.settings.inputMode);
  const [currentStep, setCurrentStep] = useState<ExperimentStep | null>(null);
  const [hintsLeft, setHintsLeft] = useState(5);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [inputModeKey, setInputModeKey] = useState(0);
  const experiment = getExperimentById('tutorial')!;

  const apparatusList = experiment.requiredApparatus.map(id => getApparatusById(id)!).filter(Boolean);
  const reagentList = experiment.requiredReagents.map(id => getReagentById(id)!).filter(Boolean);

  useEffect(() => {
    inputManager.setMode(inputMode);
    resetLab();
    setPhase('tutorial');
    setTotalSteps(experiment.steps.length);
    experimentEngine.startExperiment(experiment, 'level_0', 5);
    const step = experimentEngine.getCurrentStep();
    setCurrentStep(step);
    setStepIndex(0);
    addLabObject({ id: 'lab_bench_bg', type: 'apparatus', refId: 'beaker', x: 400, y: 300, width: 60, height: 70, placed: false });

    const onStepCurrent = (step: ExperimentStep) => { setCurrentStep(step); };
    const onStepComplete = () => { setStepIndex(Math.round(experimentEngine.getProgress() * experiment.steps.length)); };
    const onStepError = (data: { message: string; safetyNote?: string }) => { setError(data.message); setSafetyNote(data.safetyNote || null); };
    const onExpComplete = (data: { success: boolean; tracker: any }) => {
      if (data.success) {
        setTutorialDone(true);
        setTracker(data.tracker);
      }
    };
    const onReactionEffects = (effects: ReactionEffect[]) => {
      const positioned = effects.map(e => ({
        ...e,
        x: 400 + (Math.random() * 60 - 30),
        y: 280 + (Math.random() * 40 - 20),
      }));
      setEffects(positioned);
      setTimeout(() => setEffects([]), Math.max(...effects.map(e => e.duration)) + 500);
    };
    const onModeChanged = () => { setInputModeKey(k => k + 1); };

    eventEmitter.on('step:current', onStepCurrent as (...a: unknown[]) => void);
    eventEmitter.on('step:complete', onStepComplete as (...a: unknown[]) => void);
    eventEmitter.on('step:error', onStepError as (...a: unknown[]) => void);
    eventEmitter.on('experiment:complete', onExpComplete as (...a: unknown[]) => void);
    eventEmitter.on('reaction:effects', onReactionEffects as (...a: unknown[]) => void);
    eventEmitter.on('input:modeChanged', onModeChanged as (...a: unknown[]) => void);

    return () => {
      eventEmitter.off('step:current', onStepCurrent as (...a: unknown[]) => void);
      eventEmitter.off('step:complete', onStepComplete as (...a: unknown[]) => void);
      eventEmitter.off('step:error', onStepError as (...a: unknown[]) => void);
      eventEmitter.off('experiment:complete', onExpComplete as (...a: unknown[]) => void);
      eventEmitter.off('reaction:effects', onReactionEffects as (...a: unknown[]) => void);
      eventEmitter.off('input:modeChanged', onModeChanged as (...a: unknown[]) => void);
    };
  }, []);

  useEffect(() => {
    if (inputMode !== 'keyboard') return;
    const handleInputAction = (action: InputAction) => {
      if (!currentStep) return;
      switch (action.type) {
        case 'select': {
          const idx = parseInt(action.target?.split('_')[1] || '0');
          const app = apparatusList[idx];
          if (app) handleApparatusSelect(app.id);
          break;
        }
        case 'add': {
          const idx = parseInt(action.target?.split('_')[1] || '0');
          const reagent = reagentList[idx];
          if (reagent) handleReagentSelect(reagent.id);
          break;
        }
        case 'confirm': {
          performCanvasAction();
          break;
        }
        case 'hint': {
          handleHint();
          break;
        }
      }
    };
    const unsub = eventEmitter.on('input:action', handleInputAction as (...a: unknown[]) => void);
    return () => { unsub(); };
  }, [inputMode, currentStep, apparatusList, reagentList]);

  const handleApparatusSelect = useCallback((id: string) => {
    selectApparatus(id);
    if (currentStep?.action === 'select_apparatus' && currentStep.target === id) {
      const result = experimentEngine.performAction('select_apparatus', id);
      if (result.correct) {
        const app = getApparatusById(id);
        if (app) {
          addLabObject({
            id: `placed_${id}_${Date.now()}`,
            type: 'apparatus',
            refId: id,
            x: 400 + Math.random() * 80 - 40,
            y: 300,
            width: 60,
            height: 70,
            placed: true,
          });
        }
        selectApparatus(null);
      }
    }
  }, [currentStep, selectApparatus, addLabObject]);

  const handleReagentSelect = useCallback((id: string) => {
    selectReagent(id);
    if (currentStep?.action === 'add_reagent' && currentStep.target === id) {
      const result = experimentEngine.performAction('add_reagent', id);
      if (result.correct) {
        selectReagent(null);
      }
    } else {
      selectReagent(null);
    }
  }, [currentStep, selectReagent]);

  const performCanvasAction = useCallback(() => {
    if (!currentStep) return;
    const actionMap: Record<string, string> = {
      stir: 'stir', observe: 'observe', pour: 'pour',
    };
    const action = actionMap[currentStep.action];
    if (action) {
      const result = experimentEngine.performAction(action, currentStep.target);
      if (result.correct && currentStep.action === 'observe') {
        const effects = experimentEngine.getEffects();
        if (effects.length > 0) {
          const positioned = effects.map(e => ({
            ...e,
            x: 400 + (Math.random() * 60 - 30),
            y: 280 + (Math.random() * 40 - 20),
          }));
          setEffects(positioned);
          setTimeout(() => setEffects([]), Math.max(...effects.map(e => e.duration)) + 500);
        }
      }
    }
  }, [currentStep]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (inputMode === 'keyboard') return;
    performCanvasAction();
  }, [inputMode, performCanvasAction]);

  useEffect(() => {
    if (inputMode !== 'touch') return;
    const handleTouch = (pos: { x: number; y: number }) => {
      if (!currentStep) return;
      handleCanvasClick(pos.x, pos.y);
    };
    const unsub = eventEmitter.on('input:touch', handleTouch as (...a: unknown[]) => void);
    return () => { unsub(); };
  }, [inputMode, currentStep, handleCanvasClick]);

  const handleHint = useCallback(() => {
    const hint = experimentEngine.useHint();
    if (hint) {
      setHint(hint);
      setHintsLeft(prev => prev - 1);
    }
  }, []);

  const error = useGameStore(s => s.error);
  const safetyNote = useGameStore(s => s.safetyNote);
  const hint = useGameStore(s => s.hint);
  const stepIndex = useGameStore(s => s.currentStepIndex);

  const isCanvasAction = currentStep && ['stir', 'observe', 'pour'].includes(currentStep.action);

  const inputHint = currentStep ? (() => {
    const m = inputMode;
    switch (currentStep.action) {
      case 'select_apparatus': return m === 'keyboard' ? `按 1-${apparatusList.length} 选择器材` : '点击底部器材选择';
      case 'add_reagent': return m === 'keyboard' ? `按 ${apparatusList.length + 1}-${apparatusList.length + reagentList.length} 选择试剂` : '点击右侧试剂添加';
      case 'stir': case 'observe': case 'pour':
        return m === 'keyboard' ? '按 Space 确认操作' : '点击实验台或操作按钮';
      default: return '';
    }
  })() : '';

  if (tutorialDone) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-[#0a2e2e] to-[#0D4F4F] flex flex-col items-center justify-center gap-6">
        <Sparkles className="w-16 h-16 text-[#F5C542] animate-bounce" />
        <h2 className="text-3xl font-bold text-[#F5C542]">教程完成！</h2>
        <p className="text-gray-300 text-center max-w-md">你已经掌握了实验的基本操作，准备好迎接真正的挑战了吗？</p>
        <button
          onClick={() => navigate('/lab/level_1')}
          className="flex items-center gap-2 px-8 py-3 bg-[#F5C542] text-[#0a2e2e] font-bold rounded-full hover:bg-[#e8a830] transition-all hover:shadow-[0_0_20px_rgba(245,197,66,0.4)] hover:scale-105"
        >
          开始关卡 <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#0a2e2e] flex flex-col relative">
      <ErrorBanner message={error} safetyNote={safetyNote} onDismiss={() => setError(null)} />

      <div className="flex items-center gap-3 px-4 py-2 bg-[#0a2e2e]/80 border-b border-[#1a5a5a]">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-400 hover:text-[#F5C542] transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <span className="text-[#F5C542] font-bold text-sm">教程：实验室入门</span>
        <div className="ml-auto">
          <HintButton hintsLeft={hintsLeft} onClick={handleHint} hint={hint} onDismiss={() => setHint(null)} />
        </div>
      </div>

      <div className="flex-1 flex gap-2 p-2 min-h-0">
        <StepPanel steps={experiment.steps} currentStepIndex={stepIndex} />

        <div className="flex-1 flex flex-col gap-2 min-w-0 relative">
          <LabCanvas onCanvasClick={handleCanvasClick} />
          {isCanvasAction && inputMode !== 'keyboard' && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={performCanvasAction}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F5C542]/90 text-[#0a2e2e] font-bold rounded-full text-sm hover:bg-[#F5C542] transition-all shadow-lg animate-pulse"
              >
                <Eye className="w-4 h-4" />
                {currentStep?.action === 'observe' ? '观察反应' :
                 currentStep?.action === 'stir' ? '搅拌' :
                 currentStep?.action === 'pour' ? '倒入' : '操作'}
              </button>
            </div>
          )}
          <ApparatusPanel
            key={`tut_app_${inputModeKey}`}
            apparatus={apparatusList}
            selectedId={selectedApparatus}
            onSelect={handleApparatusSelect}
            usedIds={[]}
          />
        </div>

        <ReagentPanel
          key={`tut_reg_${inputModeKey}`}
          reagents={reagentList}
          selectedId={selectedReagent}
          onSelect={handleReagentSelect}
        />
      </div>

      {currentStep && (
        <div className="px-4 py-2 bg-[#0D4F4F]/80 border-t border-[#1a5a5a] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#F5C542] animate-pulse" />
          <span className="text-white text-sm">当前操作：{currentStep.description}</span>
          {inputHint && (
            <span className="text-[#F5C542]/70 text-xs ml-2 border border-[#F5C542]/30 px-2 py-0.5 rounded">{inputHint}</span>
          )}
        </div>
      )}
    </div>
  );
}
