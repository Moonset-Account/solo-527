import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSaveStore } from '@/stores/saveStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getLevelById, getLevelsOrdered } from '@/data/levels';
import { getExperimentById } from '@/data/experiments';
import { getReagentById, reagents as allReagents } from '@/data/reagents';
import { getApparatusById, apparatus as allApparatus } from '@/data/apparatus';
import { experimentEngine } from '@/engine/experiment/engine';
import { eventEmitter } from '@/engine/events/emitter';
import LabCanvas from '@/components/lab/LabCanvas';
import StepPanel from '@/components/ui/StepPanel';
import ApparatusPanel from '@/components/ui/ApparatusPanel';
import ReagentPanel from '@/components/ui/ReagentPanel';
import TemperatureControl from '@/components/ui/TemperatureControl';
import ErrorBanner from '@/components/ui/ErrorBanner';
import HintButton from '@/components/ui/HintButton';
import { ExperimentStep, LabObject, PlayTracker } from '@/types/game';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';

export default function Lab() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { setPhase, setStepIndex, setTotalSteps, setError, setSafetyNote, setHint, setTracker, addLabObject, setEffects, temperature, setTemperature, selectedApparatus, selectApparatus, selectedReagent, selectReagent, resetLab, isPaused, setPaused } = useGameStore();
  const completeLevel = useSaveStore(s => s.completeLevel);
  const inputMode = useSettingsStore(s => s.settings.inputMode);
  const [currentStep, setCurrentStep] = useState<ExperimentStep | null>(null);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [expDone, setExpDone] = useState(false);
  const [usedApparatus, setUsedApparatus] = useState<string[]>([]);

  const level = levelId ? getLevelById(levelId) : null;
  const experiment = level ? getExperimentById(level.experimentId) : null;

  useEffect(() => {
    if (!level || !experiment) { navigate('/'); return; }
    resetLab();
    setPhase('playing');
    setTotalSteps(experiment.steps.length);
    setHintsLeft(level.hintCount);
    experimentEngine.startExperiment(experiment, level.id, level.hintCount);

    const onStepCurrent = (step: ExperimentStep) => { setCurrentStep(step); };
    const onStepComplete = () => { setStepIndex(Math.floor(experimentEngine.getProgress() * experiment.steps.length)); };
    const onStepError = (data: { message: string; safetyNote?: string }) => { setError(data.message); setSafetyNote(data.safetyNote || null); };
    const onExpComplete = (data: { success: boolean; tracker: PlayTracker }) => {
      if (data.success) {
        setExpDone(true);
        setTracker(data.tracker);
        completeLevel(level.id, data.tracker);
      }
    };

    eventEmitter.on('step:current', onStepCurrent as (...a: unknown[]) => void);
    eventEmitter.on('step:complete', onStepComplete as (...a: unknown[]) => void);
    eventEmitter.on('step:error', onStepError as (...a: unknown[]) => void);
    eventEmitter.on('experiment:complete', onExpComplete as (...a: unknown[]) => void);

    return () => {
      eventEmitter.off('step:current', onStepCurrent as (...a: unknown[]) => void);
      eventEmitter.off('step:complete', onStepComplete as (...a: unknown[]) => void);
      eventEmitter.off('step:error', onStepError as (...a: unknown[]) => void);
      eventEmitter.off('experiment:complete', onExpComplete as (...a: unknown[]) => void);
      experimentEngine.reset();
    };
  }, [levelId]);

  const handleApparatusSelect = useCallback((id: string) => {
    selectApparatus(id);
    if (currentStep?.action === 'select_apparatus' && currentStep.target === id) {
      const result = experimentEngine.performAction('select_apparatus', id);
      if (result.correct) {
        addLabObject({ id: `placed_${id}_${Date.now()}`, type: 'apparatus', refId: id, x: 400 + Math.random() * 80 - 40, y: 300, width: 60, height: 70, placed: true });
        setUsedApparatus(prev => [...prev, id]);
        selectApparatus(null);
      }
    }
  }, [currentStep]);

  const handleReagentSelect = useCallback((id: string) => {
    selectReagent(id);
    if (currentStep?.action === 'add_reagent' && currentStep.target === id) {
      experimentEngine.performAction('add_reagent', id);
      selectReagent(null);
    } else if (currentStep?.action === 'drop' && currentStep.target === id) {
      experimentEngine.performAction('drop', id);
      selectReagent(null);
    }
  }, [currentStep]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (!currentStep || isPaused) return;
    const actionMap: Record<string, string> = { stir: 'stir', observe: 'observe', pour: 'pour', filter: 'filter', heat: 'heat' };
    const action = actionMap[currentStep.action];
    if (action) experimentEngine.performAction(action, currentStep.target);
  }, [currentStep, isPaused]);

  const handleTempChange = useCallback((temp: number) => {
    setTemperature(temp);
    if (currentStep?.action === 'control_temperature') {
      const targetTemp = parseFloat(currentStep.target.split(':')[1] || '0');
      if (Math.abs(temp - targetTemp) <= currentStep.tolerance) {
        experimentEngine.performAction('control_temperature', currentStep.target, temp);
      }
    }
  }, [currentStep]);

  const handleHint = useCallback(() => {
    const h = experimentEngine.useHint();
    if (h) { setHint(h); setHintsLeft(prev => prev - 1); }
  }, []);

  const handleRetry = useCallback(() => {
    if (!level || !experiment) return;
    experimentEngine.reset();
    resetLab();
    setPhase('playing');
    setTotalSteps(experiment.steps.length);
    setHintsLeft(level.hintCount);
    setExpDone(false);
    setUsedApparatus([]);
    experimentEngine.startExperiment(experiment, level.id, level.hintCount);
    setCurrentStep(experimentEngine.getCurrentStep());
  }, [level, experiment]);

  const error = useGameStore(s => s.error);
  const safetyNote = useGameStore(s => s.safetyNote);
  const hint = useGameStore(s => s.hint);
  const stepIndex = useGameStore(s => s.currentStepIndex);
  const tracker = useGameStore(s => s.tracker);

  if (!level || !experiment) return null;

  if (expDone && tracker) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-[#0a2e2e] to-[#0D4F4F] flex flex-col items-center justify-center gap-6">
        <h2 className="text-3xl font-bold text-emerald-400">实验成功！</h2>
        <div className="text-6xl font-bold text-[#F5C542]">{tracker.score}分</div>
        <div className="flex gap-4">
          <button onClick={() => navigate(`/knowledge/${level.knowledgeCardId}`)} className="px-6 py-2.5 bg-[#F5C542] text-[#0a2e2e] font-bold rounded-full hover:bg-[#e8a830] transition-all">
            查看知识卡片
          </button>
          <button onClick={() => navigate(`/result/${level.id}`)} className="px-6 py-2.5 bg-[#0D4F4F] border border-[#F5C542]/50 text-[#F5C542] font-bold rounded-full hover:bg-[#0D4F4F]/80 transition-all">
            查看结算
          </button>
        </div>
      </div>
    );
  }

  const showTempControl = currentStep?.action === 'control_temperature' || temperature > 0;

  return (
    <div className="w-full h-screen bg-[#0a2e2e] flex flex-col relative">
      <ErrorBanner message={error} safetyNote={safetyNote} onDismiss={() => setError(null)} />

      <div className="flex items-center gap-3 px-4 py-2 bg-[#0a2e2e]/80 border-b border-[#1a5a5a]">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-400 hover:text-[#F5C542] transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <span className="text-[#F5C542] font-bold text-sm">{level.title}</span>
        {level.newRules.length > 0 && (
          <span className="text-orange-400 text-xs">新规则：{level.newRules.join('、')}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <HintButton hintsLeft={hintsLeft} onClick={handleHint} hint={hint} onDismiss={() => setHint(null)} />
          <button onClick={handleRetry} className="p-1.5 text-gray-400 hover:text-[#F5C542] transition-colors" title="重试">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => { setPaused(!isPaused); isPaused ? experimentEngine.resume() : experimentEngine.pause(); }} className="p-1.5 text-gray-400 hover:text-[#F5C542] transition-colors" title="暂停">
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-2 p-2 min-h-0">
        <StepPanel steps={experiment.steps} currentStepIndex={stepIndex} />
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <LabCanvas onCanvasClick={handleCanvasClick} />
          <ApparatusPanel
            apparatus={experiment.requiredApparatus.map(id => getApparatusById(id)!).filter(Boolean)}
            selectedId={selectedApparatus}
            onSelect={handleApparatusSelect}
            usedIds={usedApparatus}
          />
        </div>
        <div className="flex flex-col gap-2">
          <ReagentPanel
            reagents={experiment.requiredReagents.map(id => getReagentById(id)!).filter(Boolean)}
            selectedId={selectedReagent}
            onSelect={handleReagentSelect}
          />
          {showTempControl && (
            <TemperatureControl
              temperature={temperature}
              targetTemp={currentStep?.action === 'control_temperature' ? parseFloat(currentStep.target.split(':')[1] || '0') : undefined}
              tolerance={currentStep?.tolerance}
              onChange={handleTempChange}
              disabled={isPaused}
            />
          )}
        </div>
      </div>

      {currentStep && !isPaused && (
        <div className="px-4 py-2 bg-[#0D4F4F]/80 border-t border-[#1a5a5a] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#F5C542] animate-pulse" />
          <span className="text-white text-sm">当前操作：{currentStep.description}</span>
          {currentStep.safetyNote && (
            <span className="text-orange-400 text-xs ml-2">⚠ {currentStep.safetyNote}</span>
          )}
        </div>
      )}

      {isPaused && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-6">游戏暂停</h2>
          <div className="flex gap-4">
            <button onClick={() => { setPaused(false); experimentEngine.resume(); }} className="px-6 py-2.5 bg-[#F5C542] text-[#0a2e2e] font-bold rounded-full hover:bg-[#e8a830] transition-all">
              继续
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-transparent border border-white/30 text-white rounded-full hover:border-white/60 transition-all">
              返回主菜单
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
