import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Thermometer,
  Flame,
  RotateCcw,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Beaker,
  Droplets,
  Lightbulb,
  X,
} from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useLevelStore } from '@/stores/levelStore';
import { useDebugStore } from '@/stores/debugStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { LabRenderer } from '@/engine/renderer';
import { StepValidator } from '@/engine/stepValidator';
import type { Equipment, Reagent, StepAction, ReactionResult } from '@/types';
import type { EquipmentType, ReactionEffect } from '@/types';

const EQUIPMENT_SIZES: Record<string, { w: number; h: number }> = {
  beaker: { w: 80, h: 100 },
  flask: { w: 70, h: 120 },
  test_tube: { w: 30, h: 110 },
  alcohol_lamp: { w: 50, h: 60 },
  thermometer: { w: 30, h: 120 },
  stirring_rod: { w: 20, h: 130 },
  dropper: { w: 30, h: 100 },
  graduated_cylinder: { w: 40, h: 120 },
  petri_dish: { w: 80, h: 30 },
  funnel: { w: 50, h: 70 },
  filter_paper: { w: 60, h: 10 },
  glass_rod: { w: 20, h: 130 },
  crucible: { w: 50, h: 50 },
  tripod: { w: 70, h: 50 },
  wire_gauze: { w: 70, h: 10 },
};

function getTempColor(temp: number): string {
  if (temp < 10) return 'var(--accent-blue)';
  if (temp < 40) return 'var(--accent-green)';
  if (temp < 80) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function Game() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<LabRenderer | null>(null);
  const validatorRef = useRef(new StepValidator());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const equipmentPosIndexRef = useRef(0);

  const [showHints, setShowHints] = useState(false);
  const [observationLog, setObservationLog] = useState<string[]>([]);
  const [pendingReagent, setPendingReagent] = useState<Reagent | null>(null);
  const [reagentAmount, setReagentAmount] = useState<number>(10);

  const {
    currentLevel,
    currentStepIndex,
    temperature,
    placedEquipment,
    addedReagents,
    isHeating,
    isStirring,
    reactions,
    errors,
    isPaused,
    isComplete,
    isFailed,
    failureReason,
    safetyAlerts,
    accuracy,
    elapsedTime,
    initLevel,
    advanceStep,
    setTemperature: setStoreTemp,
    toggleHeating,
    toggleStirring,
    placeEquipment: placeStoreEquipment,
    addReagent: addStoreReagent,
    addReaction,
    addError,
    addSafetyAlert,
    clearSafetyAlerts,
    setPaused,
    setComplete,
    setFailed,
    resetGame,
    updateElapsedTime,
    setAccuracy,
  } = useGameStore();

  const { getLevelById } = useLevelStore();
  const { addLog } = useDebugStore();
  const { debugMode, showFps } = useSettingsStore();
  const debugFps = useDebugStore((s) => s.fps);

  const level = useMemo(() => {
    if (!levelId) return undefined;
    return getLevelById(levelId);
  }, [levelId, getLevelById]);

  const steps = useMemo(() => {
    if (!currentLevel) return [];
    return currentLevel.steps;
  }, [currentLevel]);

  const currentStep = useMemo(() => {
    if (currentStepIndex >= steps.length) return null;
    return steps[currentStepIndex];
  }, [currentStepIndex, steps]);

  const availableEquipment = useMemo(() => {
    return currentLevel?.equipment ?? [];
  }, [currentLevel]);

  const availableReagents = useMemo(() => {
    return currentLevel?.reagents ?? [];
  }, [currentLevel]);

  const handleValidateAndAdvance = useCallback(
    (playerAction: StepAction) => {
      if (!currentStep || isPaused || isComplete || isFailed) return;

      const gameState = useGameStore.getState();
      const result = validatorRef.current.validate(currentStep, gameState, playerAction);

      addLog('step_validate', `步骤${currentStepIndex + 1}验证: ${result.success ? '成功' : '失败'}`, {
        action: playerAction,
        result,
      });

      if (result.errors.length > 0) {
        for (const err of result.errors) {
          addError(err);
          if (err.severity === 'critical') {
            addSafetyAlert(err.message, 'critical');
            setFailed(err.message);
            return;
          }
          if (err.severity === 'error') {
            addSafetyAlert(err.message, 'error');
          } else {
            addSafetyAlert(err.message, 'warning');
          }
        }
      }

      if (result.warnings.length > 0) {
        for (const w of result.warnings) {
          addSafetyAlert(w, 'warning');
        }
      }

      if (result.stepComplete) {
        const storeState = useGameStore.getState();
        const penalty = result.errors.filter((e) => e.severity === 'warning').length * 2;
        if (penalty > 0) {
          setAccuracy(Math.max(0, storeState.accuracy - penalty));
        }

        if (currentStep.expectedResult) {
          const expected = currentStep.expectedResult;
          const reactionResult: ReactionResult = {
            id: `reaction_${Date.now()}`,
            name: expected.description,
            description: expected.description,
            color: expected.colorTo,
            hasPrecipitate: expected.effects?.includes('precipitate'),
            hasGas: expected.effects?.includes('gas_release') || expected.effects?.includes('bubble'),
          };
          addReaction(reactionResult);
          setObservationLog((prev) => [...prev, expected.description]);

          if (rendererRef.current && expected.effects) {
            rendererRef.current.setReactionEffects(expected.effects as ReactionEffect[]);
          }

          if (rendererRef.current && expected.colorTo && storeState.placedEquipment.length > 0) {
            const lastContainer = [...storeState.placedEquipment].reverse().find((e) =>
              ['beaker', 'flask', 'test_tube', 'graduated_cylinder'].includes(e.type),
            );
            if (lastContainer) {
              const liquidLevel = Math.min(0.7, storeState.addedReagents.length * 0.15 + 0.1);
              rendererRef.current.updateLiquid(
                lastContainer.type as EquipmentType,
                liquidLevel,
                expected.colorTo,
              );
            }
          }
        }

        advanceStep();
      }
    },
    [currentStep, currentStepIndex, isPaused, isComplete, isFailed, addError, addSafetyAlert, setFailed, setAccuracy, addReaction, advanceStep, addLog],
  );

  const handlePlaceEquipment = useCallback(
    (eq: Equipment) => {
      if (isPaused || isComplete || isFailed) return;
      const alreadyPlaced = useGameStore.getState().placedEquipment.some((e) => e.id === eq.id);
      if (alreadyPlaced) return;

      placeStoreEquipment(eq);

      if (rendererRef.current) {
        const canvasW = canvasRef.current?.width ?? 600;
        const canvasH = canvasRef.current?.height ?? 400;
        const size = EQUIPMENT_SIZES[eq.type] ?? { w: 60, h: 60 };
        const tableY = canvasH * 0.75;
        const idx = equipmentPosIndexRef.current;
        equipmentPosIndexRef.current += 1;
        const spacing = canvasW / 5;
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const x = spacing * (col + 0.5) - size.w / 2;
        const y = tableY - size.h - row * 20;

        rendererRef.current.addObject({
          type: eq.type as EquipmentType,
          x,
          y,
          width: size.w,
          height: size.h,
          liquidLevel: 0,
          liquidColor: 'transparent',
          isSelected: false,
        });
      }

      addLog('place_equipment', `放置器材: ${eq.name}`, { equipmentId: eq.id });

      handleValidateAndAdvance({
        type: 'place_equipment',
        equipmentId: eq.id,
      });
    },
    [isPaused, isComplete, isFailed, placeStoreEquipment, handleValidateAndAdvance, addLog],
  );

  const REAGENT_ACTION_TYPES = new Set(['add_reagent', 'drop', 'pour', 'measure']);

  const handleAddReagent = useCallback(
    (reagent: Reagent) => {
      if (isPaused || isComplete || isFailed) return;

      const gameState = useGameStore.getState();
      const container = [...gameState.placedEquipment].reverse().find((e) =>
        ['beaker', 'flask', 'test_tube', 'graduated_cylinder'].includes(e.type),
      );
      if (!container) {
        addSafetyAlert('请先放置容器再添加试剂', 'error');
        return;
      }

      const stepSuggestedAmount = currentStep?.action?.amount ?? 10;
      setReagentAmount(stepSuggestedAmount);
      setPendingReagent(reagent);
    },
    [isPaused, isComplete, isFailed, addSafetyAlert, currentStep],
  );

  const confirmAddReagent = useCallback(
    (reagent: Reagent, amount: number) => {
      if (isPaused || isComplete || isFailed) return;

      const gameState = useGameStore.getState();
      const container = [...gameState.placedEquipment].reverse().find((e) =>
        ['beaker', 'flask', 'test_tube', 'graduated_cylinder'].includes(e.type),
      );
      if (!container) {
        addSafetyAlert('请先放置容器再添加试剂', 'error');
        return;
      }

      addStoreReagent(reagent, amount, container.id);

      if (rendererRef.current) {
        const liquidLevel = Math.min(0.8, gameState.addedReagents.length * 0.15 + 0.15);
        rendererRef.current.updateLiquid(
          container.type as EquipmentType,
          liquidLevel,
          reagent.color,
        );
      }

      const actionType = currentStep?.action?.type ?? 'add_reagent';
      const normalizedType = REAGENT_ACTION_TYPES.has(actionType) ? actionType : 'add_reagent';

      addLog('add_reagent', `添加试剂: ${reagent.name}(${reagent.formula}) ${amount}${actionType === 'drop' ? '滴' : 'mL'}`, { reagentId: reagent.id, amount });

      handleValidateAndAdvance({
        type: normalizedType,
        reagentId: reagent.id,
        equipmentId: container.id,
        amount,
      });

      setPendingReagent(null);
    },
    [isPaused, isComplete, isFailed, addStoreReagent, addSafetyAlert, handleValidateAndAdvance, addLog, currentStep],
  );

  const handleTemperatureChange = useCallback(
    (temp: number) => {
      if (isPaused || isComplete || isFailed) return;
      setStoreTemp(temp);
      if (rendererRef.current) {
        rendererRef.current.setTemperature(temp);
      }
    },
    [isPaused, isComplete, isFailed, setStoreTemp],
  );

  const handleToggleHeating = useCallback(() => {
    if (isPaused || isComplete || isFailed) return;
    toggleHeating();
    const newHeating = useGameStore.getState().isHeating;
    if (rendererRef.current) {
      rendererRef.current.setHeating(newHeating);
    }
    addLog('toggle_heating', newHeating ? '开始加热' : '停止加热');

    handleValidateAndAdvance({ type: newHeating ? 'heat' : 'cool' });
  }, [isPaused, isComplete, isFailed, toggleHeating, handleValidateAndAdvance, addLog]);

  const handleToggleStirring = useCallback(() => {
    if (isPaused || isComplete || isFailed) return;
    toggleStirring();
    const newStirring = useGameStore.getState().isStirring;
    if (rendererRef.current) {
      rendererRef.current.setStirring(newStirring);
    }
    addLog('toggle_stirring', newStirring ? '开始搅拌' : '停止搅拌');

    handleValidateAndAdvance({ type: 'stir' });
  }, [isPaused, isComplete, isFailed, toggleStirring, handleValidateAndAdvance, addLog]);

  const handleObserve = useCallback(() => {
    if (isPaused || isComplete || isFailed) return;
    addLog('observe', '执行观察操作');
    handleValidateAndAdvance({ type: 'observe', observation: '' });
  }, [isPaused, isComplete, isFailed, handleValidateAndAdvance, addLog]);

  const handleRecord = useCallback(() => {
    if (isPaused || isComplete || isFailed) return;
    addLog('record', '记录实验结果');
    handleValidateAndAdvance({ type: 'record', observation: '' });
  }, [isPaused, isComplete, isFailed, handleValidateAndAdvance, addLog]);

  const handlePause = useCallback(() => {
    setPaused(!isPaused);
  }, [isPaused, setPaused]);

  const handleRetry = useCallback(() => {
    resetGame();
    equipmentPosIndexRef.current = 0;
    setObservationLog([]);
    setShowHints(false);
    setPendingReagent(null);
    setReagentAmount(10);
    if (level) {
      initLevel(level);
    }
    if (rendererRef.current) {
      rendererRef.current.clearObjects();
      rendererRef.current.setHeating(false);
      rendererRef.current.setStirring(false);
      rendererRef.current.setTemperature(25);
      rendererRef.current.setReactionEffects([]);
    }
  }, [level, resetGame, initLevel]);

  useEffect(() => {
    if (!levelId || !level) return;
    initLevel(level);
    addLog('init_level', `初始化关卡: ${level.name}`, { levelId });
  }, [levelId, level, initLevel, addLog]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width ?? 600;
    canvas.height = rect?.height ?? 400;

    const renderer = new LabRenderer(canvas);
    rendererRef.current = renderer;

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !rendererRef.current) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        rendererRef.current.resize(rect.width, rect.height);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isPaused && !isComplete && !isFailed) {
      timerRef.current = setInterval(() => {
        updateElapsedTime();
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isComplete, isFailed, updateElapsedTime]);

  useEffect(() => {
    if (safetyAlerts.length > 0) {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = setTimeout(() => {
        clearSafetyAlerts();
      }, 5000);
    }
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [safetyAlerts, clearSafetyAlerts]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTemperature(temperature);
      rendererRef.current.setHeating(isHeating);
      rendererRef.current.setStirring(isStirring);
    }
  }, [temperature, isHeating, isStirring]);

  useEffect(() => {
    if (currentStepIndex >= steps.length && steps.length > 0 && !isComplete && !isFailed) {
      setComplete();
    }
  }, [currentStepIndex, steps.length, isComplete, isFailed, setComplete]);

  useEffect(() => {
    if (isComplete && levelId) {
      setTimeout(() => navigate(`/result/${levelId}`), 800);
    }
  }, [isComplete, levelId, navigate]);

  useEffect(() => {
    if (isFailed && levelId) {
      setTimeout(() => navigate(`/failed/${levelId}`), 1500);
    }
  }, [isFailed, levelId, navigate]);

  useEffect(() => {
    if (currentStep?.expectedResult?.effects) {
      if (rendererRef.current) {
        rendererRef.current.setReactionEffects(currentStep.expectedResult.effects as ReactionEffect[]);
      }
    } else if (rendererRef.current && !currentStep?.expectedResult) {
      rendererRef.current.setReactionEffects([]);
    }
  }, [currentStep]);

  if (!level) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--accent-red)' }}>关卡未找到</p>
          <button className="btn-primary" onClick={() => navigate('/levels')}>
            返回关卡选择
          </button>
        </div>
      </div>
    );
  }

  const totalSteps = steps.length;
  const isActionStep =
    currentStep?.action.type === 'observe' || currentStep?.action.type === 'record';

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <FlaskConical size={20} style={{ color: 'var(--accent-green)' }} />
          <span className="font-bold text-sm" style={{ color: 'var(--accent-green)' }}>
            {currentLevel?.name ?? level.name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              准确率:
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--accent-green)' }}>
              {Math.round(accuracy)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>⏱</span>
            <span className="text-sm font-mono" style={{ color: 'var(--accent-blue)' }}>
              {formatTime(elapsedTime)}
            </span>
          </div>

          <button
            className="flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onClick={handlePause}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? '继续' : '暂停'}
          </button>

          <button
            className="flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--accent-red)',
              color: 'var(--accent-red)',
            }}
            onClick={() => {
              resetGame();
              navigate('/levels');
            }}
          >
            退出
          </button>
        </div>
      </div>

      {/* Main 3-column area */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel - Steps */}
        <div
          className="w-64 flex flex-col shrink-0 overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
        >
          {/* Current step highlight */}
          {currentStep && (
            <div
              className="p-3 m-3 rounded-lg"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-green)',
                boxShadow: '0 0 10px rgba(0,255,136,0.15)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                >
                  步骤 {currentStepIndex + 1}/{totalSteps}
                </span>
                <button
                  className="ml-auto p-1 rounded transition-colors"
                  style={{ color: 'var(--accent-amber)' }}
                  onClick={() => setShowHints(!showHints)}
                  title="查看提示"
                >
                  <Lightbulb size={14} />
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {currentStep.instruction}
              </p>

              {showHints && currentStep.hints && currentStep.hints.length > 0 && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {currentStep.hints.map((hint, i) => (
                    <p key={i} className="text-xs mb-1" style={{ color: 'var(--accent-amber)' }}>
                      💡 {hint}
                    </p>
                  ))}
                </div>
              )}

              {currentStep.safetyNotes && currentStep.safetyNotes.length > 0 && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {currentStep.safetyNotes.map((note, i) => (
                    <p key={i} className="text-xs mb-1" style={{ color: 'var(--accent-red)' }}>
                      ⚠️ {note}
                    </p>
                  ))}
                </div>
              )}

              {isActionStep && (
                <button
                  className="mt-2 w-full px-3 py-1.5 rounded text-sm font-bold transition-all"
                  style={{
                    background: 'var(--accent-green)',
                    color: 'var(--bg-primary)',
                  }}
                  onClick={currentStep.action.type === 'record' ? handleRecord : handleObserve}
                >
                  {currentStep.action.type === 'record' ? '📝 记录结果' : '👁 观察现象'}
                </button>
              )}
            </div>
          )}

          {/* All steps list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
              实验步骤
            </p>
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isFuture = idx > currentStepIndex;

              return (
                <div
                  key={step.id}
                  className="flex items-start gap-2 mb-1.5 px-2 py-1.5 rounded text-sm"
                  style={{
                    background: isCurrent ? 'rgba(0,255,136,0.08)' : 'transparent',
                    borderLeft: isCurrent ? '2px solid var(--accent-green)' : '2px solid transparent',
                    opacity: isFuture ? 0.4 : 1,
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
                    ) : (
                      <span
                        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold"
                        style={{
                          background: isCurrent ? 'var(--accent-green)' : 'var(--bg-card)',
                          color: isCurrent ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          border: isCurrent ? 'none' : '1px solid var(--border-color)',
                        }}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className="leading-tight"
                    style={{
                      color: isCompleted
                        ? 'var(--accent-green)'
                        : isCurrent
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {step.instruction.length > 30
                      ? step.instruction.slice(0, 30) + '...'
                      : step.instruction}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative min-w-0">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Action buttons overlay for observe/record when not shown in left panel */}
          {isActionStep && !currentStep && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <button className="btn-primary" onClick={handleObserve}>
                <Eye size={16} className="inline mr-1" /> 观察现象
              </button>
            </div>
          )}

          {/* Debug overlay */}
          {debugMode && (
            <div
              className="absolute top-2 left-2 p-2 rounded text-xs font-mono"
              style={{
                background: 'rgba(0,0,0,0.8)',
                color: 'var(--accent-green)',
                maxWidth: 300,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {showFps && <div>FPS: {debugFps}</div>}
              <div>步骤: {currentStepIndex}/{totalSteps}</div>
              <div>温度: {temperature}°C</div>
              <div>加热: {isHeating ? '是' : '否'}</div>
              <div>搅拌: {isStirring ? '是' : '否'}</div>
              <div>准确率: {accuracy}%</div>
              <div>器材: {placedEquipment.map((e) => e.name).join(', ') || '无'}</div>
              <div>试剂: {addedReagents.map((r) => r.reagent.name).join(', ') || '无'}</div>
              <div>反应: {reactions.length}</div>
              <div>错误: {errors.length}</div>
            </div>
          )}
        </div>

        {/* Right panel - Controls */}
        <div
          className="w-56 flex flex-col shrink-0 overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)' }}
        >
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
            {/* Temperature */}
            <div
              className="p-3 rounded-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Thermometer size={14} style={{ color: getTempColor(temperature) }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  温度
                </span>
                <span
                  className="ml-auto text-sm font-bold font-mono"
                  style={{ color: getTempColor(temperature) }}
                >
                  {temperature}°C
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={temperature}
                onChange={(e) => handleTemperatureChange(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                <span>0°C</span>
                <span>100°C</span>
                <span>200°C</span>
              </div>
            </div>

            {/* Heat / Stir controls */}
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: isHeating
                    ? 'rgba(255,68,68,0.2)'
                    : 'var(--bg-card)',
                  border: `1px solid ${isHeating ? 'var(--accent-red)' : 'var(--border-color)'}`,
                  color: isHeating ? 'var(--accent-red)' : 'var(--text-secondary)',
                  boxShadow: isHeating ? '0 0 10px rgba(255,68,68,0.3)' : 'none',
                }}
                onClick={handleToggleHeating}
              >
                <Flame size={14} />
                {isHeating ? '停止加热' : '加热'}
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: isStirring
                    ? 'rgba(0,255,136,0.15)'
                    : 'var(--bg-card)',
                  border: `1px solid ${isStirring ? 'var(--accent-green)' : 'var(--border-color)'}`,
                  color: isStirring ? 'var(--accent-green)' : 'var(--text-secondary)',
                  boxShadow: isStirring ? '0 0 10px rgba(0,255,136,0.2)' : 'none',
                }}
                onClick={handleToggleStirring}
              >
                <RotateCcw size={14} />
                {isStirring ? '停止搅拌' : '搅拌'}
              </button>
            </div>

            {/* Equipment */}
            <div
              className="rounded-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="px-3 pt-2 pb-1 flex items-center gap-2">
                <Beaker size={14} style={{ color: 'var(--accent-blue)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  实验器材
                </span>
              </div>
              <div className="px-2 pb-2 space-y-1">
                {availableEquipment.map((eq) => {
                  const isPlaced = placedEquipment.some((p) => p.id === eq.id);
                  return (
                    <button
                      key={eq.id}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-all"
                      style={{
                        background: isPlaced
                          ? 'rgba(0,255,136,0.1)'
                          : 'transparent',
                        border: `1px solid ${isPlaced ? 'rgba(0,255,136,0.3)' : 'var(--border-color)'}`,
                        color: isPlaced ? 'var(--accent-green)' : 'var(--text-primary)',
                        opacity: isPlaced ? 0.6 : 1,
                        cursor: isPlaced ? 'default' : 'pointer',
                      }}
                      disabled={isPlaced}
                      onClick={() => handlePlaceEquipment(eq)}
                    >
                      <span className="text-base">{eq.icon ?? '🔬'}</span>
                      <span className="truncate">{eq.name}</span>
                      {isPlaced && <CheckCircle2 size={12} className="ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reagents */}
            <div
              className="rounded-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="px-3 pt-2 pb-1 flex items-center gap-2">
                <Droplets size={14} style={{ color: 'var(--accent-amber)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  试剂药品
                </span>
              </div>
              <div className="px-2 pb-2 space-y-1">
                {availableReagents.map((reagent) => {
                  const dangerColor =
                    (reagent.dangerLevel ?? 0) >= 3
                      ? 'var(--accent-red)'
                      : (reagent.dangerLevel ?? 0) >= 2
                      ? 'var(--accent-amber)'
                      : 'var(--text-secondary)';
                  return (
                    <button
                      key={reagent.id}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-all hover:brightness-110"
                      style={{
                        background: pendingReagent?.id === reagent.id ? 'rgba(255,184,0,0.15)' : 'transparent',
                        border: `1px solid ${pendingReagent?.id === reagent.id ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                        color: 'var(--text-primary)',
                      }}
                      onClick={() => handleAddReagent(reagent)}
                    >
                      <span className="text-base">{reagent.icon ?? '🧪'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{reagent.name}</div>
                        <div
                          className="text-[10px] truncate"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {reagent.formula}
                        </div>
                      </div>
                      {(reagent.dangerLevel ?? 0) > 0 && (
                        <AlertTriangle size={12} className="shrink-0" style={{ color: dangerColor }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Amount selector */}
              {pendingReagent && (
                <div
                  className="mx-2 mb-2 p-2 rounded-lg animate-fade-in-up"
                  style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid var(--accent-amber)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-amber)' }}>
                      {pendingReagent.name} — 用量
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      onClick={() => setReagentAmount(Math.max(1, reagentAmount - 5))}
                    >−</button>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={reagentAmount}
                      onChange={(e) => setReagentAmount(Math.max(1, Math.min(200, Number(e.target.value))))}
                      className="w-14 text-center text-sm font-mono rounded px-1 py-0.5"
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--accent-green)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {currentStep?.action?.type === 'drop' ? '滴' : 'mL'}
                    </span>
                    <button
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      onClick={() => setReagentAmount(Math.min(200, reagentAmount + 5))}
                    >+</button>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {currentStep?.action?.type === 'drop' ? (
                      <>
                        {[1, 2, 3, 5].map((v) => (
                          <button
                            key={v}
                            className="px-2 py-0.5 rounded text-xs transition-all"
                            style={{
                              background: reagentAmount === v ? 'var(--accent-amber)' : 'var(--bg-primary)',
                              border: `1px solid ${reagentAmount === v ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                              color: reagentAmount === v ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            }}
                            onClick={() => setReagentAmount(v)}
                          >{v}滴</button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[5, 10, 20, 50, 100].map((v) => (
                          <button
                            key={v}
                            className="px-2 py-0.5 rounded text-xs transition-all"
                            style={{
                              background: reagentAmount === v ? 'var(--accent-amber)' : 'var(--bg-primary)',
                              border: `1px solid ${reagentAmount === v ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                              color: reagentAmount === v ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            }}
                            onClick={() => setReagentAmount(v)}
                          >{v}mL</button>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-2 py-1 rounded text-xs font-bold transition-all"
                      style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                      onClick={() => confirmAddReagent(pendingReagent, reagentAmount)}
                    >✓ 确认添加</button>
                    <button
                      className="px-2 py-1 rounded text-xs font-bold transition-all"
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                      onClick={() => setPendingReagent(null)}
                    >取消</button>
                  </div>
                </div>
              )}
            </div>

            {/* Observation Log */}
            <div
              className="rounded-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="px-3 pt-2 pb-1 flex items-center gap-2">
                <Eye size={14} style={{ color: 'var(--accent-green)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  观察记录
                </span>
              </div>
              <div
                className="px-3 pb-2 max-h-32 overflow-y-auto scrollbar-thin space-y-1"
              >
                {observationLog.length === 0 ? (
                  <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
                    尚无观察记录
                  </p>
                ) : (
                  observationLog.map((log, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--accent-blue)' }}>
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Alert Banner */}
      {safetyAlerts.length > 0 && (
        <div
          className="px-4 py-2 flex items-center gap-3 shrink-0 animate-slide-in-right"
          style={{
            background:
              safetyAlerts.some((a) => a.severity === 'critical')
                ? 'rgba(255,68,68,0.2)'
                : safetyAlerts.some((a) => a.severity === 'error')
                ? 'rgba(255,68,68,0.12)'
                : 'rgba(255,184,0,0.12)',
            borderTop: `1px solid ${
              safetyAlerts.some((a) => a.severity === 'critical' || a.severity === 'error')
                ? 'var(--accent-red)'
                : 'var(--accent-amber)'
            }`,
          }}
        >
          <AlertTriangle
            size={16}
            style={{
              color: safetyAlerts.some((a) => a.severity === 'critical' || a.severity === 'error')
                ? 'var(--accent-red)'
                : 'var(--accent-amber)',
            }}
          />
          <div className="flex-1 min-w-0">
            {safetyAlerts.map((alert, i) => (
              <p
                key={i}
                className="text-sm"
                style={{
                  color:
                    alert.severity === 'critical' || alert.severity === 'error'
                      ? 'var(--accent-red)'
                      : 'var(--accent-amber)',
                }}
              >
                {alert.severity === 'critical' ? '🚨 ' : alert.severity === 'error' ? '❌ ' : '⚠️ '}
                {alert.message}
              </p>
            ))}
          </div>
          <button
            onClick={clearSafetyAlerts}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Complete overlay */}
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(10,46,54,0.85)' }}>
          <div
            className="text-center p-8 rounded-xl animate-fade-in-up"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--accent-green)',
              boxShadow: '0 0 30px rgba(0,255,136,0.3)',
            }}
          >
            <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: 'var(--accent-green)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--accent-green)' }}>
              实验完成！
            </h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              准确率: {Math.round(accuracy)}%
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              用时: {formatTime(elapsedTime)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              即将跳转结果页面...
            </p>
          </div>
        </div>
      )}

      {/* Failed overlay */}
      {isFailed && (
        <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(10,46,54,0.85)' }}>
          <div
            className="text-center p-8 rounded-xl animate-fade-in-up"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--accent-red)',
              boxShadow: '0 0 30px rgba(255,68,68,0.3)',
            }}
          >
            <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: 'var(--accent-red)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--accent-red)' }}>
              实验失败
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {failureReason}
            </p>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary" onClick={handleRetry}>
                <RotateCcw size={16} className="inline mr-1" /> 重新实验
              </button>
              <button
                className="btn-amber"
                onClick={() => {
                  resetGame();
                  navigate('/levels');
                }}
              >
                返回选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {isPaused && !isComplete && !isFailed && (
        <div className="absolute inset-0 flex items-center justify-center z-40" style={{ background: 'rgba(10,46,54,0.9)' }}>
          <div
            className="text-center p-8 rounded-xl animate-fade-in-up"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Pause size={48} className="mx-auto mb-4" style={{ color: 'var(--accent-amber)' }} />
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              实验暂停
            </h2>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary" onClick={handlePause}>
                <Play size={16} className="inline mr-1" /> 继续实验
              </button>
              <button
                className="btn-amber"
                onClick={() => {
                  resetGame();
                  navigate('/levels');
                }}
              >
                退出实验
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
