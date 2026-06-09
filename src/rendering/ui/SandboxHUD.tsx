import React, { useState } from 'react';
import {
  ArrowLeft,
  Lightbulb,
  RotateCcw,
  Save,
  Volume2,
  VolumeX,
  Check,
  Circle,
  Zap,
  Battery,
  Gauge,
  BatteryCharging,
  ToggleRight,
  X,
  ChevronRight,
  Download,
  Copy,
} from 'lucide-react';
import { ComponentLibrary } from '@/game/ComponentLibrary';
import { COMPONENT_CATEGORIES } from '@/data/defaults';
import { cn } from '@/lib/utils';
import type {
  ComponentInstance,
  ComponentType,
  Objective,
  TutorialStep,
  SwitchProps,
  ResistorProps,
  BatteryProps,
  CapacitorProps,
  BulbProps,
} from '@/game/types';

interface ComponentPanelProps {
  availableComponents?: ComponentType[];
  onDragStart?: (type: ComponentType) => void;
}

export const ComponentPanel: React.FC<ComponentPanelProps> = ({
  availableComponents,
  onDragStart,
}) => {
  const library = ComponentLibrary.getInstance();
  const grouped = library.listDefinitionsGrouped();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(COMPONENT_CATEGORIES.map((c) => c.key))
  );

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getComponentIcon = (type: ComponentType) => {
    switch (type) {
      case 'battery':
        return <Battery className="w-5 h-5" />;
      case 'resistor':
        return <Gauge className="w-5 h-5" />;
      case 'capacitor':
        return <BatteryCharging className="w-5 h-5" />;
      case 'switch':
        return <ToggleRight className="w-5 h-5" />;
      case 'bulb':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('component-type', type);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(type);
  };

  return (
    <div className="absolute top-16 left-4 bottom-20 w-56 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          元件库
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {COMPONENT_CATEGORIES.map((category) => {
          const items = grouped[category.key as keyof typeof grouped] || [];
          const filteredItems = availableComponents
            ? items.filter((item) => availableComponents.includes(item.type))
            : items;
          if (filteredItems.length === 0) return null;

          const isExpanded = expandedCategories.has(category.key);
          return (
            <div key={category.key} className="space-y-2">
              <button
                onClick={() => toggleCategory(category.key)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span>{category.icon}</span>
                  {category.label}
                </span>
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              </button>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      className="group cursor-grab active:cursor-grabbing bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg p-2.5 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                    >
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="p-2 bg-slate-700/50 group-hover:bg-cyan-500/20 rounded-md text-slate-400 group-hover:text-cyan-400 transition-colors">
                          {getComponentIcon(item.type)}
                        </div>
                        <div className="text-xs font-medium text-slate-200">
                          {item.definition.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2.5 bg-slate-800/30 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-500 text-center">
          拖拽元件到画布
        </p>
      </div>
    </div>
  );
};

interface InfoPanelProps {
  levelName: string;
  levelDescription: string;
  objectives: Objective[];
  completedObjectiveIds: Set<string>;
  selectedComponent: ComponentInstance | null;
  onUpdateComponent?: (id: string, updates: Partial<ComponentInstance>) => void;
  onToggleSwitch?: (id: string) => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  levelName,
  levelDescription,
  objectives,
  completedObjectiveIds,
  selectedComponent,
  onUpdateComponent,
  onToggleSwitch,
}) => {
  return (
    <div className="absolute top-16 right-4 bottom-20 w-64 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
        <h2 className="text-sm font-bold text-white">{levelName}</h2>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{levelDescription}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-slate-700/50">
          <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">
            任务目标
          </h4>
          <ul className="space-y-2">
            {objectives.map((obj) => {
              const completed = completedObjectiveIds.has(obj.id);
              return (
                <li
                  key={obj.id}
                  className={cn(
                    'flex items-start gap-2.5 p-2.5 rounded-lg transition-colors',
                    completed
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-slate-800/40 border border-slate-700/30'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                      completed
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-500'
                    )}
                  >
                    {completed && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span
                    className={cn(
                      'text-xs leading-relaxed',
                      completed ? 'text-emerald-300' : 'text-slate-300'
                    )}
                  >
                    {obj.description}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {selectedComponent && (
          <div className="p-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">
              元件属性
            </h4>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">类型</span>
                <span className="text-xs font-medium text-cyan-400 capitalize">
                  {selectedComponent.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">ID</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedComponent.id.slice(-8)}
                </span>
              </div>

              {selectedComponent.type === 'switch' && (
                <div className="pt-2 border-t border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">状态</span>
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        (selectedComponent.properties as SwitchProps).closed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {(selectedComponent.properties as SwitchProps).closed ? '闭合' : '断开'}
                    </span>
                  </div>
                  <button
                    onClick={() => onToggleSwitch?.(selectedComponent.id)}
                    className="w-full py-2 bg-slate-700/50 hover:bg-slate-600/50 text-xs text-slate-200 rounded-md transition-colors"
                  >
                    切换开关
                  </button>
                </div>
              )}

              {selectedComponent.type === 'resistor' && (
                <div className="pt-2 border-t border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">阻值</span>
                    <span className="text-xs font-medium text-amber-400">
                      {(selectedComponent.properties as ResistorProps).resistance} Ω
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={(selectedComponent.properties as ResistorProps).resistance}
                    onChange={(e) =>
                      onUpdateComponent?.(selectedComponent.id, {
                        properties: {
                          ...selectedComponent.properties,
                          resistance: parseInt(e.target.value),
                        } as ResistorProps,
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>10Ω</span>
                    <span>1kΩ</span>
                  </div>
                </div>
              )}

              {selectedComponent.type === 'battery' && (
                <div className="pt-2 border-t border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">电压</span>
                    <span className="text-xs font-medium text-cyan-400">
                      {(selectedComponent.properties as BatteryProps).voltage} V
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="24"
                    step="0.5"
                    value={(selectedComponent.properties as BatteryProps).voltage}
                    onChange={(e) =>
                      onUpdateComponent?.(selectedComponent.id, {
                        properties: {
                          ...selectedComponent.properties,
                          voltage: parseFloat(e.target.value),
                        } as BatteryProps,
                      })
                    }
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1.5V</span>
                    <span>24V</span>
                  </div>
                </div>
              )}

              {selectedComponent.type === 'capacitor' && (
                <div className="pt-2 border-t border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">电容</span>
                    <span className="text-xs font-medium text-orange-400">
                      {(selectedComponent.properties as CapacitorProps).capacitance} µF
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={(selectedComponent.properties as CapacitorProps).capacitance}
                    onChange={(e) =>
                      onUpdateComponent?.(selectedComponent.id, {
                        properties: {
                          ...selectedComponent.properties,
                          capacitance: parseInt(e.target.value),
                        } as CapacitorProps,
                      })
                    }
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>100µF</span>
                    <span>10mF</span>
                  </div>
                </div>
              )}

              {selectedComponent.type === 'bulb' && (
                <div className="pt-2 border-t border-slate-700/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">灯丝电阻</span>
                    <span className="text-xs font-medium text-yellow-400">
                      {(selectedComponent.properties as BulbProps).resistance} Ω
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">点亮阈值</span>
                    <span className="text-xs font-medium text-yellow-400">
                      {(selectedComponent.properties as BulbProps).thresholdPower} W
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatusBarProps {
  simulating: boolean;
  hasError: boolean;
  errorMessage?: string | null;
  componentCount: number;
  wireCount: number;
  shortcuts?: { key: string; label: string }[];
}

export const StatusBar: React.FC<StatusBarProps> = ({
  simulating,
  hasError,
  errorMessage,
  componentCount,
  wireCount,
  shortcuts = [],
}) => {
  return (
    <div className="absolute bottom-4 left-4 right-4 h-12 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl flex items-center px-4 gap-6">
      <div className="flex items-center gap-2">
        <Circle
          className={cn(
            'w-2.5 h-2.5 fill-current',
            hasError
              ? 'text-red-400 animate-pulse'
              : simulating
              ? 'text-emerald-400 animate-pulse'
              : 'text-slate-500'
          )}
        />
        <span className="text-xs font-medium text-slate-300">
          {hasError
            ? '电路错误'
            : simulating
            ? '仿真运行中'
            : '待机'}
        </span>
      </div>

      {errorMessage && hasError && (
        <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
          <span className="text-xs text-red-400 truncate">{errorMessage}</span>
        </div>
      )}

      {!hasError && (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400/70" />
          元件 <span className="text-slate-200 font-medium">{componentCount}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3.5 h-0.5 bg-amber-400/70 rounded-full" />
          连线 <span className="text-slate-200 font-medium">{wireCount}</span>
        </span>
      </div>

      <div className="h-6 w-px bg-slate-700" />

      <div className="flex items-center gap-3">
        {shortcuts.map((sc, i) => (
          <div key={i} className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-[10px] text-slate-400 font-mono">
              {sc.key}
            </kbd>
            <span className="text-[10px] text-slate-500">{sc.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ToolbarProps {
  onBack: () => void;
  onShowHint: () => void;
  onReset: () => void;
  onSave: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  title?: string;
  isFreeMode?: boolean;
  onExportJSON?: () => void;
  onCopyJSON?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onBack,
  onShowHint,
  onReset,
  onSave,
  soundEnabled,
  onToggleSound,
  title = '电子电路沙盒',
  isFreeMode = false,
  onExportJSON,
  onCopyJSON,
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 h-12 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl flex items-center px-3 gap-2">
      <button
        onClick={onBack}
        className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        title="返回"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="h-6 w-px bg-slate-700 mx-1" />

      <h1 className="text-sm font-bold text-white flex items-center gap-2">
        <Zap className="w-4 h-4 text-cyan-400" />
        {title}
      </h1>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          onClick={onShowHint}
          className="px-3 py-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="提示"
        >
          <Lightbulb className="w-4 h-4" />
          提示
        </button>
        <button
          onClick={onReset}
          className="px-3 py-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="重置"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
        <button
          onClick={onSave}
          className="px-3 py-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="保存"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
        {isFreeMode && (
          <>
            <div className="h-6 w-px bg-slate-700 mx-1" />
            <button
              onClick={onExportJSON}
              className="px-3 py-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="下载 JSON 文件分享"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={onCopyJSON}
              className="px-3 py-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="复制 JSON 到剪贴板"
            >
              <Copy className="w-4 h-4" />
              复制
            </button>
          </>
        )}
      </div>

      <div className="h-6 w-px bg-slate-700 mx-1" />

      <button
        onClick={onToggleSound}
        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        title={soundEnabled ? '静音' : '开启声音'}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-slate-400 hover:text-cyan-400" />
        ) : (
          <VolumeX className="w-5 h-5 text-slate-600 hover:text-slate-400" />
        )}
      </button>
    </div>
  );
};

interface TutorialOverlayProps {
  steps: TutorialStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  steps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onClose,
}) => {
  const step = steps[currentStep];
  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" />

      {step.highlightArea && (
        <div
          className="absolute border-2 border-cyan-400/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] pointer-events-none animate-pulse"
          style={{
            left: step.highlightArea.x,
            top: step.highlightArea.y,
            width: step.highlightArea.w,
            height: step.highlightArea.h,
          }}
        />
      )}

      <div className="relative w-[420px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-cyan-500/15 text-cyan-400 text-xs font-semibold rounded-full">
              教程 {currentStep + 1}/{steps.length}
            </span>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            {step.description}
          </p>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-500/15 rounded-lg flex-shrink-0">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  操作提示
                </h4>
                <p className="text-sm text-slate-400">{step.action}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              跳过教程
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={onPrev}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-sm text-slate-300 rounded-lg transition-colors"
                >
                  上一步
                </button>
              )}
              <button
                onClick={isLast ? onClose : onNext}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-sm font-semibold text-white rounded-lg shadow-lg shadow-cyan-500/25 transition-all"
              >
                {isLast ? '完成' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
