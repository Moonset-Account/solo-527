import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Copy, Wrench, FlaskConical, Droplets, BookOpen } from 'lucide-react';
import { useLevelStore } from '@/stores/levelStore';
import { equipmentList } from '@/data/equipment';
import { reagentList } from '@/data/reagents';
import { knowledgeCardList } from '@/data/knowledgeCards';
import type { Level, Step, StepAction, KnowledgeCard, Equipment, Reagent } from '@/types';

const difficultyOptions = [
  { value: 'easy', label: '简单', color: 'var(--accent-green)' },
  { value: 'medium', label: '中等', color: 'var(--accent-amber)' },
  { value: 'hard', label: '困难', color: 'var(--accent-red)' },
];

const tagOptions = ['acid_base', 'redox', 'precipitation', 'organic', 'safety', 'basic'];

const actionTypeOptions = [
  { value: 'add_reagent', label: '添加试剂' },
  { value: 'heat', label: '加热' },
  { value: 'stir', label: '搅拌' },
  { value: 'observe', label: '观察' },
  { value: 'filter', label: '过滤' },
  { value: 'measure', label: '测量' },
  { value: 'pour', label: '倾倒' },
  { value: 'wait', label: '等待' },
];

interface StepFormData {
  instruction: string;
  actionType: string;
  equipmentId: string;
  reagentId: string;
  amount: number;
  targetTemperature: number;
}

const emptyStep: StepFormData = {
  instruction: '',
  actionType: 'add_reagent',
  equipmentId: '',
  reagentId: '',
  amount: 0,
  targetTemperature: 25,
};

export default function Editor() {
  const navigate = useNavigate();
  const { addCustomLevel } = useLevelStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedReagents, setSelectedReagents] = useState<Record<string, number>>({});
  const [steps, setSteps] = useState<StepFormData[]>([{ ...emptyStep }]);
  const [selectedKnowledgeCards, setSelectedKnowledgeCards] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleEquipment = (eqId: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  };

  const toggleReagent = (reId: string) => {
    setSelectedReagents((prev) => {
      const next = { ...prev };
      if (next[reId] !== undefined) {
        delete next[reId];
      } else {
        next[reId] = 10;
      }
      return next;
    });
  };

  const updateReagentAmount = (reId: string, amount: number) => {
    setSelectedReagents((prev) => ({ ...prev, [reId]: amount }));
  };

  const updateStep = (index: number, field: keyof StepFormData, value: string | number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { ...emptyStep }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleKnowledgeCard = (cardId: string) => {
    setSelectedKnowledgeCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const buildLevel = (): Level => {
    const levelId = `custom_${Date.now()}`;
    const builtSteps: Step[] = steps.map((s, i) => {
      const action: StepAction = {
        type: s.actionType,
        equipmentId: s.equipmentId || undefined,
        reagentId: s.reagentId || undefined,
        amount: s.amount || undefined,
      };
      if (s.actionType === 'heat') {
        action.duration = s.targetTemperature;
      }
      return {
        id: `${levelId}_step_${i}`,
        order: i,
        instruction: s.instruction,
        action,
        hints: [],
        safetyNotes: [],
      };
    });

    const builtEquipment: Equipment[] = equipmentList.filter((eq) =>
      selectedEquipment.includes(eq.id)
    );

    const builtReagents: Reagent[] = reagentList.filter((re) =>
      Object.keys(selectedReagents).includes(re.id)
    );

    const builtKnowledgeCards: KnowledgeCard[] = knowledgeCardList.filter((kc) =>
      selectedKnowledgeCards.includes(kc.id)
    );

    return {
      id: levelId,
      name: name || '未命名关卡',
      description: description || '自定义关卡',
      difficulty,
      tags,
      steps: builtSteps,
      equipment: builtEquipment,
      reagents: builtReagents,
      knowledgeCards: builtKnowledgeCards,
    };
  };

  const handleSave = () => {
    const level = buildLevel();
    addCustomLevel(level);
    navigate('/levels');
  };

  const handleExport = () => {
    const level = buildLevel();
    navigator.clipboard.writeText(JSON.stringify(level, null, 2));
  };

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'linear-gradient(180deg, #0A2E36 0%, #0D3B46 100%)' }}
    >
      <header
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          onClick={() => navigate('/levels')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="font-display text-2xl tracking-wider"
          style={{ color: 'var(--accent-green)' }}
        >
          关卡编辑器
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* 基本信息 */}
          <div className="card-base p-6 animate-fade-in-up">
            <h2
              className="font-body text-base font-bold mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-green)' }}
            >
              <BookOpen size={18} />
              基本信息
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-body text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  关卡名称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入关卡名称..."
                  className="w-full px-4 py-2.5 rounded-lg font-body text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="font-body text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  关卡描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="输入关卡描述..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg font-body text-sm outline-none resize-none transition-all"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="font-body text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  难度
                </label>
                <div className="flex gap-3">
                  {difficultyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className="px-4 py-2 rounded-lg font-body text-sm font-bold transition-all"
                      style={{
                        border: `1px solid ${difficulty === opt.value ? opt.color : 'var(--border-color)'}`,
                        color: difficulty === opt.value ? opt.color : 'var(--text-secondary)',
                        background: difficulty === opt.value ? `${opt.color}15` : 'transparent',
                      }}
                      onClick={() => setDifficulty(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-body text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      className="px-3 py-1.5 rounded-lg font-body text-xs transition-all"
                      style={{
                        border: `1px solid ${tags.includes(tag) ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                        color: tags.includes(tag) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        background: tags.includes(tag) ? 'rgba(184, 232, 252, 0.1)' : 'transparent',
                      }}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 器材配置 */}
          <div
            className="card-base p-6 animate-fade-in-up"
            style={{ animationDelay: '80ms', animationFillMode: 'both' }}
          >
            <h2
              className="font-body text-base font-bold mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-amber)' }}
            >
              <Wrench size={18} />
              器材配置
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {equipmentList.map((eq) => (
                <button
                  key={eq.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-left"
                  style={{
                    border: `1px solid ${selectedEquipment.includes(eq.id) ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                    background: selectedEquipment.includes(eq.id) ? 'rgba(255, 184, 0, 0.08)' : 'var(--bg-primary)',
                  }}
                  onClick={() => toggleEquipment(eq.id)}
                >
                  <span className="text-lg">{eq.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-body text-xs font-bold truncate"
                      style={{
                        color: selectedEquipment.includes(eq.id) ? 'var(--accent-amber)' : 'var(--text-secondary)',
                      }}
                    >
                      {eq.name}
                    </div>
                    <div className="font-body text-[10px] truncate" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                      {eq.type}
                    </div>
                  </div>
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: selectedEquipment.includes(eq.id) ? 'var(--accent-amber)' : 'var(--border-color)',
                      background: selectedEquipment.includes(eq.id) ? 'var(--accent-amber)' : 'transparent',
                    }}
                  >
                    {selectedEquipment.includes(eq.id) && (
                      <span style={{ color: 'var(--bg-primary)', fontSize: '10px', lineHeight: 1 }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 试剂配置 */}
          <div
            className="card-base p-6 animate-fade-in-up"
            style={{ animationDelay: '160ms', animationFillMode: 'both' }}
          >
            <h2
              className="font-body text-base font-bold mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-blue)' }}
            >
              <Droplets size={18} />
              试剂配置
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reagentList.map((re) => {
                const isSelected = re.id in selectedReagents;
                return (
                  <div
                    key={re.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                    style={{
                      border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      background: isSelected ? 'rgba(184, 232, 252, 0.08)' : 'var(--bg-primary)',
                    }}
                  >
                    <button
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      onClick={() => toggleReagent(re.id)}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ background: re.color, border: '1px solid var(--border-color)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-body text-xs font-bold truncate"
                          style={{ color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
                        >
                          {re.name}
                        </div>
                        <div className="font-body text-[10px] truncate" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                          {re.formula}
                        </div>
                      </div>
                    </button>
                    {isSelected && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={selectedReagents[re.id]}
                          onChange={(e) => updateReagentAmount(re.id, Number(e.target.value))}
                          className="w-14 px-2 py-1 rounded text-xs text-center font-body outline-none"
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--accent-blue)',
                          }}
                        />
                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>ml</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 步骤编辑 */}
          <div
            className="card-base p-6 animate-fade-in-up"
            style={{ animationDelay: '240ms', animationFillMode: 'both' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-body text-base font-bold flex items-center gap-2"
                style={{ color: 'var(--accent-green)' }}
              >
                <FlaskConical size={18} />
                步骤编辑
              </h2>
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  border: '1px solid var(--accent-green)',
                  color: 'var(--accent-green)',
                  background: 'rgba(0, 255, 136, 0.08)',
                }}
                onClick={addStep}
              >
                <Plus size={14} />
                添加步骤
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-lg p-4"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-display text-sm font-bold"
                      style={{ color: 'var(--accent-green)' }}
                    >
                      步骤 {index + 1}
                    </span>
                    {steps.length > 1 && (
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
                        style={{ color: 'var(--accent-red)', border: '1px solid rgba(255, 68, 68, 0.3)' }}
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 size={12} />
                        删除
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={step.instruction}
                      onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                      placeholder="步骤说明..."
                      className="w-full px-3 py-2 rounded-lg font-body text-sm outline-none"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-[10px] mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          操作类型
                        </label>
                        <select
                          value={step.actionType}
                          onChange={(e) => updateStep(index, 'actionType', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg font-body text-sm outline-none cursor-pointer"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {actionTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-body text-[10px] mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          器材
                        </label>
                        <select
                          value={step.equipmentId}
                          onChange={(e) => updateStep(index, 'equipmentId', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg font-body text-sm outline-none cursor-pointer"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <option value="">选择器材</option>
                          {equipmentList.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                              {eq.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-body text-[10px] mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          试剂
                        </label>
                        <select
                          value={step.reagentId}
                          onChange={(e) => updateStep(index, 'reagentId', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg font-body text-sm outline-none cursor-pointer"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <option value="">选择试剂</option>
                          {reagentList.map((re) => (
                            <option key={re.id} value={re.id}>
                              {re.name} ({re.formula})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-body text-[10px] mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          用量 (ml)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={step.amount || ''}
                          onChange={(e) => updateStep(index, 'amount', Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg font-body text-sm outline-none"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    </div>
                    {step.actionType === 'heat' && (
                      <div>
                        <label className="font-body text-[10px] mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          目标温度 (°C)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={step.targetTemperature || ''}
                          onChange={(e) => updateStep(index, 'targetTemperature', Number(e.target.value))}
                          placeholder="25"
                          className="w-full px-3 py-2 rounded-lg font-body text-sm outline-none"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 知识卡片 */}
          <div
            className="card-base p-6 animate-fade-in-up"
            style={{ animationDelay: '320ms', animationFillMode: 'both' }}
          >
            <h2
              className="font-body text-base font-bold mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-amber)' }}
            >
              <BookOpen size={18} />
              知识卡片
            </h2>
            <div className="flex flex-col gap-2">
              {knowledgeCardList.map((kc) => {
                const isSelected = selectedKnowledgeCards.includes(kc.id);
                return (
                  <button
                    key={kc.id}
                    className="flex items-start gap-3 px-4 py-3 rounded-lg transition-all text-left"
                    style={{
                      border: `1px solid ${isSelected ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                      background: isSelected ? 'rgba(255, 184, 0, 0.08)' : 'var(--bg-primary)',
                    }}
                    onClick={() => toggleKnowledgeCard(kc.id)}
                  >
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        borderColor: isSelected ? 'var(--accent-amber)' : 'var(--border-color)',
                        background: isSelected ? 'var(--accent-amber)' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <span style={{ color: 'var(--bg-primary)', fontSize: '10px', lineHeight: 1 }}>✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-body text-sm font-bold"
                        style={{ color: isSelected ? 'var(--accent-amber)' : 'var(--text-primary)' }}
                      >
                        {kc.title}
                      </div>
                      {kc.formula && (
                        <div className="font-body text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {kc.formula}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer
        className="px-6 py-4 flex gap-3"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <button
          className="btn-primary flex items-center justify-center gap-2 flex-1"
          onClick={handleSave}
        >
          <Save size={18} />
          保存关卡
        </button>
        <button
          className="btn-amber flex items-center justify-center gap-2"
          onClick={handleExport}
        >
          <Copy size={18} />
          导出JSON
        </button>
      </footer>
    </div>
  );
}
