import type {
  ExperimentState, GameEvents, GameStateType,
  EquipmentInstance, Particle,
} from '../types/game';
import type {
  LevelConfig, ExperimentStep, ReactionConfig, StepStatus,
} from '../types/config';
import type { LevelResult, StepRecord, LevelResultStatus } from '../types/save';
import { ParticleSystem } from './particles/ParticleSystem';
import { AudioSystem } from './audio/AudioSystem';
import { getLevelById, getReagentById, getEquipmentById, getReactionById } from '../utils/config';
import { clamp, uid } from '../utils/math';
import { computeStars } from '../utils/save';

export type ActionResult = { ok: boolean; message?: string; safety?: boolean; knowledge?: string };

export class ExperimentEngine {
  state: ExperimentState;
  events: GameEvents;
  particles: ParticleSystem;
  audio: AudioSystem;
  private timeScale = 1;
  private toastSeq = 1;
  private particleSeq = 1;
  private _sfxEnabled = true;

  constructor(audio: AudioSystem) {
    this.audio = audio;
    this.particles = new ParticleSystem();
    this.events = {};
    this.state = this.createEmptyState();
  }

  private createEmptyState(): ExperimentState {
    return {
      state: 'loading',
      levelId: '',
      levelConfig: null,
      startTime: 0,
      elapsedTime: 0,
      pausedTime: 0,
      score: 0,
      currentStepIndex: 0,
      stepsProgress: [],
      equipment: [],
      selectedEquipmentId: null,
      draggingReagent: null,
      particles: [],
      activeReactions: [],
      toasts: [],
      knowledgePopup: null,
      errors: 0,
      safetyViolations: 0,
      knowledgeViewed: [],
    };
  }

  loadLevel(levelId: string): boolean {
    const config = getLevelById(levelId);
    if (!config) return false;
    this.state = this.createEmptyState();
    this.state.levelId = levelId;
    this.state.levelConfig = config;
    this.state.stepsProgress = config.steps.map(s => ({
      stepId: s.id, status: 'pending' as StepStatus,
      score: 0, startedAt: 0, errors: 0,
    }));
    if (this.state.stepsProgress.length > 0) this.state.stepsProgress[0].status = 'current';
    this.state.equipment = config.initialEquipmentPlacement.map((p, i) => ({
      id: `eq_${i}_${p.equipmentId}`,
      equipmentId: p.equipmentId,
      x: p.x, y: p.y,
      rotation: 0,
      contents: [],
      temperature: 25,
      isHeating: false,
      isStirring: false,
      stirringSpeed: 1,
      heatLevel: 0,
      clean: true,
      selected: false,
    }));
    this.state.state = 'ready';
    this.particles.clear();
    if (config.safetyNotes?.length) {
      config.safetyNotes.slice(0, 1).forEach(note => this.showToast('safety', '安全提示', note, 4000));
    }
    return true;
  }

  start(): boolean {
    if (this.state.state !== 'ready' && this.state.state !== 'paused') return false;
    if (this.state.state === 'ready') {
      this.state.startTime = performance.now();
      this.state.stepsProgress[0].startedAt = performance.now();
    }
    this.state.state = 'running';
    return true;
  }

  pause(): void {
    if (this.state.state !== 'running') return;
    this.state.state = 'paused';
    this.state.pausedTime = performance.now();
  }

  resume(): void {
    if (this.state.state !== 'paused') return;
    this.state.state = 'running';
  }

  resetLevel(): void {
    if (this.state.levelId) this.loadLevel(this.state.levelId);
  }

  setGameState(s: GameStateType): void { this.state.state = s; }

  update(dt: number): void {
    if (this.state.state !== 'running') return;
    const sDt = dt * this.timeScale;
    this.state.elapsedTime = (performance.now() - this.state.startTime) / 1000;
    const config = this.state.levelConfig;
    if (config && config.timeLimit > 0 && this.state.elapsedTime >= config.timeLimit) {
      this.failLevel('超时', 'timeout');
      return;
    }
    this.updateEquipmentTemperatures(sDt);
    this.updateReactions(sDt);
    this.particles.update(sDt);
    this.state.particles = this.particles.particles;
    this.checkStepProgress();
    this.cleanupToasts();
    this.state.knowledgePopup && (this.state.knowledgePopup.visible = true);
  }

  private updateEquipmentTemperatures(dt: number): void {
    const envTemp = 25;
    this.state.equipment.forEach(eq => {
      const conf = getEquipmentById(eq.equipmentId);
      if (!conf) return;
      let target = envTemp;
      if (eq.isHeating && conf.heatable) target = 25 + eq.heatLevel * 95;
      const burner = this.state.equipment.find(
        e => getEquipmentById(e.equipmentId)?.type === 'burner' && e.isHeating &&
          Math.abs(e.x - eq.x) < 80 && Math.abs(e.y - eq.y) < 130,
      );
      if (burner) {
        target = Math.max(target, 25 + burner.heatLevel * 100);
      }
      const approach = burner ? 4 : eq.isHeating ? 3 : 0.8;
      eq.temperature += (target - eq.temperature) * Math.min(1, approach * dt);
      if (conf.heatable && eq.temperature > 85 && Math.random() < 0.3) {
        this.particles.spawn({
          x: eq.x + (Math.random() - 0.5) * 20,
          y: eq.y - conf.renderParams.height / 2,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.8 - Math.random() * 0.8,
          type: 'smoke',
          color: '#f0f8ff',
          size: 5,
          maxLife: 1.2,
          parentEquipmentId: eq.id,
        });
      }
      if (eq.temperature > 95) {
        this.safetyViolation('温度过高！存在液体暴沸危险，请立即撤去热源。');
      }
    });
  }

  private updateReactions(dt: number): void {
    const config = this.state.levelConfig;
    if (!config) return;
    config.reactions.forEach(rid => {
      const reaction = getReactionById(typeof rid === 'string' ? rid : (rid as unknown as ReactionConfig).id);
      if (!reaction) return;
      this.state.equipment.forEach(eq => {
        const reactionActive = this.state.activeReactions.find(r => r.reactionId === reaction.id && r.equipmentId === eq.id);
        if (reactionActive) {
          reactionActive.progress += dt / reactionActive.duration;
          if (reactionActive.progress >= 1) {
            this.completeReaction(reaction, eq);
            this.state.activeReactions = this.state.activeReactions.filter(r => r !== reactionActive);
          }
          this.emitReactionParticles(reaction, eq, dt);
          return;
        }
        if (this.canStartReaction(reaction, eq)) {
          this.startReaction(reaction, eq);
        }
      });
    });
  }

  private canStartReaction(r: ReactionConfig, eq: EquipmentInstance): boolean {
    if (r.temperatureRange) {
      if (eq.temperature < r.temperatureRange.min || eq.temperature > r.temperatureRange.max) return false;
    }
    return r.reactants.every(rr => {
      const total = eq.contents.filter(c => c.reagentId === rr.reagentId)
        .reduce((s, c) => s + c.volume, 0);
      return total >= rr.minAmount && (!rr.maxAmount || total <= rr.maxAmount);
    });
  }

  private startReaction(r: ReactionConfig, eq: EquipmentInstance): void {
    this.state.activeReactions.push({
      id: uid('rxn_'), reactionId: r.id, equipmentId: eq.id,
      progress: 0, duration: r.duration, startTime: performance.now(),
    });
    if (this._sfxEnabled) this.audio.playSfx('reaction', 0.7);
    this.events.onReactionStart?.(r.id, eq.id);
    this.showToast('info', '反应进行中', r.description, 2500);
  }

  private completeReaction(r: ReactionConfig, eq: EquipmentInstance): void {
    r.reactants.forEach(rr => {
      let remaining = rr.minAmount;
      for (const c of eq.contents) {
        if (remaining <= 0) break;
        if (c.reagentId === rr.reagentId) {
          const consume = Math.min(c.volume, remaining);
          c.volume -= consume;
          remaining -= consume;
        }
      }
      eq.contents = eq.contents.filter(c => c.volume > 0.1);
    });
    r.products.forEach(p => {
      const existing = eq.contents.find(c => c.reagentId === p.reagentId);
      if (existing) existing.volume += p.amount;
      else eq.contents.push({
        id: uid('r_'), reagentId: p.reagentId, volume: p.amount,
        temperature: eq.temperature, mixedWith: r.reactants.map(rr => rr.reagentId),
      });
    });
    if (r.exothermic) eq.temperature = clamp(eq.temperature + r.exothermic, 0, 120);
    if (r.endothermic) eq.temperature = clamp(eq.temperature - r.endothermic, 0, 120);
    this.particles.burst(eq.x, eq.y - 20, r.visualEffect === 'gas' ? 25 : 12,
      r.visualEffect === 'gas' ? 'bubble' : r.visualEffect === 'precipitate' ? 'precipitate' :
      r.visualEffect === 'smoke' ? 'smoke' : 'spark',
      r.effectColor || '#ffffff', { speed: 1.2, life: 1.5, size: 4 });
    this.events.onReactionComplete?.(r.id, eq.id);
  }

  private emitReactionParticles(r: ReactionConfig, eq: EquipmentInstance, dt: number): void {
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf) return;
    const rate = r.visualEffect === 'gas' ? 30 : r.visualEffect === 'precipitate' ? 8 : 12;
    if (Math.random() < rate * dt) {
      const conf2 = getEquipmentById(eq.equipmentId)!;
      const w = conf2.renderParams.width;
      const h = conf2.renderParams.height;
      this.particles.spawn({
        x: eq.x + (Math.random() - 0.5) * w * 0.6,
        y: eq.y + h / 2 - (Math.random() * h * 0.5),
        vx: (Math.random() - 0.5) * 0.8,
        vy: r.visualEffect === 'precipitate' ? 0.5 + Math.random() : -1 - Math.random() * 0.8,
        type: r.visualEffect === 'gas' ? 'bubble' : r.visualEffect === 'precipitate' ? 'precipitate' :
          r.visualEffect === 'smoke' ? 'smoke' : r.visualEffect === 'glow' ? 'glow' : 'spark',
        color: r.effectColor || '#ffffff',
        size: r.visualEffect === 'gas' ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
        maxLife: 0.8 + Math.random() * 0.8,
      });
    }
  }

  getCurrentStep(): ExperimentStep | null {
    if (!this.state.levelConfig) return null;
    return this.state.levelConfig.steps[this.state.currentStepIndex] || null;
  }

  selectEquipment(id: string | null): void {
    this.state.equipment.forEach(eq => eq.selected = eq.id === id);
    this.state.selectedEquipmentId = id;
  }

  getEquipment(id: string): EquipmentInstance | undefined {
    return this.state.equipment.find(eq => eq.id === id);
  }

  pourReagent(reagentId: string, targetEqId: string, volume: number): ActionResult {
    const target = this.getEquipment(targetEqId);
    if (!target) return { ok: false, message: '未找到目标容器' };
    const conf = getEquipmentById(target.equipmentId);
    if (!conf || (conf.type !== 'beaker' && conf.type !== 'flask')) {
      return { ok: false, message: '该容器无法盛装液体' };
    }
    const capacity = conf.capacity || 0;
    const currentTotal = target.contents.reduce((s, c) => s + c.volume, 0);
    const available = capacity * 0.95 - currentTotal;
    if (available <= 0) {
      this.safetyViolation('容器已盛满，继续倒入会导致溢出！');
      return { ok: false, message: '容器已满，无法继续加入', safety: true };
    }
    const actualVolume = Math.min(volume, available);
    const reagent = getReagentById(reagentId);
    if (!reagent) return { ok: false, message: '未知试剂' };
    if (reagent.hazardLevel === 'danger') {
      this.safetyViolation(`危险试剂【${reagent.name}】需要特殊防护！`);
    }
    const existing = target.contents.find(c => c.reagentId === reagentId);
    if (existing) existing.volume += actualVolume;
    else target.contents.push({
      id: uid('r_'), reagentId, volume: actualVolume,
      temperature: target.temperature, mixedWith: target.contents.map(c => c.reagentId),
    });
    if (this._sfxEnabled) this.audio.playSfx('pour', 0.7);
    this.particles.burst(target.x, target.y - 20, Math.min(8, actualVolume / 5),
      'bubble', reagent.glowColor || reagent.color, { speed: 0.5, life: 0.8, size: 3 });
    const result: ActionResult = { ok: true };
    const step = this.getCurrentStep();
    if (step?.triggersKnowledge && !this.state.knowledgeViewed.includes(step.triggersKnowledge)) {
      result.knowledge = step.triggersKnowledge;
    }
    if (actualVolume < volume) {
      result.message = `部分加入 (${actualVolume.toFixed(1)}mL)：容器容量限制`;
    }
    return result;
  }

  startHeating(eqId: string, level = 1): ActionResult {
    const eq = this.getEquipment(eqId);
    if (!eq) return { ok: false, message: '未找到设备' };
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf?.heatable && conf?.type !== 'burner') {
      return { ok: false, message: '该设备不可加热' };
    }
    eq.isHeating = true;
    eq.heatLevel = clamp(level, 0.2, 1);
    if (this._sfxEnabled) this.audio.playSfx('heat', 0.5);
    return { ok: true };
  }

  stopHeating(eqId: string): ActionResult {
    const eq = this.getEquipment(eqId);
    if (!eq) return { ok: false, message: '未找到设备' };
    eq.isHeating = false;
    eq.heatLevel = 0;
    return { ok: true };
  }

  startStirring(eqId: string, speed = 1): ActionResult {
    const eq = this.getEquipment(eqId);
    if (!eq) return { ok: false, message: '未找到设备' };
    const conf = getEquipmentById(eq.equipmentId);
    if (!conf?.stirrable) {
      const stirrer = this.state.equipment.find(
        e => getEquipmentById(e.equipmentId)?.type === 'stirrer' &&
          Math.abs(e.x - eq.x) < 80 && Math.abs(e.y - eq.y) < 80,
      );
      if (!stirrer) return { ok: false, message: '请将容器放在磁力搅拌器上' };
    }
    eq.isStirring = true;
    eq.stirringSpeed = clamp(speed, 0.3, 3);
    if (this._sfxEnabled) this.audio.playSfx('stir', 0.4);
    return { ok: true };
  }

  stopStirring(eqId: string): ActionResult {
    const eq = this.getEquipment(eqId);
    if (!eq) return { ok: false, message: '未找到设备' };
    eq.isStirring = false;
    eq.stirringSpeed = 1;
    return { ok: true };
  }

  private checkStepProgress(): void {
    const step = this.getCurrentStep();
    const config = this.state.levelConfig;
    if (!step || !config) return;
    const stepProgress = this.state.stepsProgress[this.state.currentStepIndex];
    if (!stepProgress || stepProgress.status === 'completed') return;
    const result = this.validateStep(step);
    if (result.ok) {
      this.completeStep(step, stepProgress);
    }
  }

  validateStep(step: ExperimentStep): ActionResult {
    switch (step.type) {
      case 'pour': return this.validatePourStep(step);
      case 'heat': return this.validateHeatStep(step);
      case 'cool': return this.validateCoolStep(step);
      case 'stir': return this.validateStirStep(step);
      case 'wait': return this.validateWaitStep(step);
      case 'observe': return this.validateWaitStep(step);
      case 'measure': return { ok: true };
      default: return { ok: false };
    }
  }

  private findEquipmentByStepTarget(step: ExperimentStep): EquipmentInstance | null {
    if (!step.targetEquipment) return this.state.equipment[0] || null;
    return this.state.equipment.find(eq => {
      const conf = getEquipmentById(eq.equipmentId);
      return conf?.type === step.targetEquipment || eq.equipmentId === step.targetEquipment;
    }) || this.state.equipment[0] || null;
  }

  private validatePourStep(step: ExperimentStep): ActionResult {
    const eq = this.findEquipmentByStepTarget(step);
    if (!eq) return { ok: false, message: '缺少目标容器' };
    const total = eq.contents.filter(c => c.reagentId === step.targetReagent)
      .reduce((s, c) => s + c.volume, 0);
    const tol = step.tolerance || 10;
    if (step.targetVolume !== undefined) {
      if (Math.abs(total - step.targetVolume) <= tol) return { ok: true };
      if (total < step.targetVolume - tol) return { ok: false, message: `还需加入 ${(step.targetVolume - total).toFixed(1)}mL` };
      if (total > step.targetVolume + tol) {
        this.recordStepError(step);
        return { ok: false, message: `加入过量！超出 ${(total - step.targetVolume).toFixed(1)}mL`, safety: step.targetReagent && getReagentById(step.targetReagent)?.hazardLevel !== 'safe' };
      }
    }
    return { ok: total > 0 };
  }

  private validateHeatStep(step: ExperimentStep): ActionResult {
    const eq = this.findEquipmentByStepTarget(step);
    if (!eq) return { ok: false };
    const temp = eq.temperature;
    const target = step.targetTemperature || 50;
    const tol = step.tolerance || 10;
    if (step.targetTemperature !== undefined) {
      if (Math.abs(temp - target) <= tol) return { ok: true };
      if (temp < target - tol) return { ok: false, message: `继续升温（当前 ${temp.toFixed(1)}°C）` };
      if (temp > target + tol) {
        this.recordStepError(step);
        this.safetyViolation(`温度超过目标范围！当前 ${temp.toFixed(1)}°C`);
        return { ok: false, message: '温度过高！请撤去热源', safety: true };
      }
    }
    return { ok: false };
  }

  private validateCoolStep(step: ExperimentStep): ActionResult {
    const eq = this.findEquipmentByStepTarget(step);
    if (!eq) return { ok: false };
    if (step.targetTemperature !== undefined) {
      return eq.temperature <= step.targetTemperature + (step.tolerance || 5)
        ? { ok: true }
        : { ok: false, message: `等待冷却（当前 ${eq.temperature.toFixed(1)}°C）` };
    }
    return { ok: false };
  }

  private validateStirStep(step: ExperimentStep): ActionResult {
    const eq = this.findEquipmentByStepTarget(step);
    if (!eq || !eq.isStirring) return { ok: false, message: '请开启搅拌' };
    const sp = this.state.stepsProgress[this.state.currentStepIndex];
    const elapsed = (performance.now() - (sp.startedAt || performance.now())) / 1000;
    if (step.duration && elapsed >= step.duration) return { ok: true };
    return { ok: false, message: step.duration ? `持续搅拌中 ${elapsed.toFixed(1)}/${step.duration}s` : '' };
  }

  private validateWaitStep(step: ExperimentStep): ActionResult {
    const sp = this.state.stepsProgress[this.state.currentStepIndex];
    const elapsed = (performance.now() - (sp.startedAt || performance.now())) / 1000;
    if (step.duration && elapsed >= step.duration) return { ok: true };
    return { ok: false };
  }

  private completeStep(step: ExperimentStep, progress: { stepId: string; status: StepStatus; score: number; startedAt: number; completedAt?: number; errors: number }): void {
    const timeTaken = (performance.now() - progress.startedAt) / 1000;
    const maxScore = step.maxScore;
    const errorPenalty = progress.errors * step.penaltyForError;
    const timeFactor = step.duration ? clamp(1 - Math.max(0, timeTaken - step.duration * 2) / 60, 0.4, 1) : 1;
    const stepScore = Math.max(0, Math.round(maxScore * timeFactor - errorPenalty));
    progress.status = 'completed';
    progress.score = stepScore;
    progress.completedAt = performance.now();
    this.state.score += stepScore;
    if (step.triggersKnowledge) this.triggerKnowledgeCard(step.triggersKnowledge);
    if (this._sfxEnabled) this.audio.playSfx('success', 0.8);
    this.showToast('success', '步骤完成', `+${stepScore} 分 · ${step.title}`, 2000);
    this.events.onStepComplete?.(step, stepScore);
    if (this.state.currentStepIndex < (this.state.levelConfig?.steps.length || 0) - 1) {
      this.state.currentStepIndex += 1;
      this.state.stepsProgress[this.state.currentStepIndex].status = 'current';
      this.state.stepsProgress[this.state.currentStepIndex].startedAt = performance.now();
    } else {
      this.completeLevel();
    }
  }

  recordStepError(step: ExperimentStep, message?: string): void {
    const sp = this.state.stepsProgress[this.state.currentStepIndex];
    if (!sp) return;
    sp.errors += 1;
    this.state.errors += 1;
    if (this._sfxEnabled) this.audio.playSfx('error', 0.7);
    if (message) this.showToast('warning', '操作有误', message, 2500);
    this.events.onStepError?.(step, message || '');
  }

  safetyViolation(message: string): void {
    this.state.safetyViolations += 1;
    if (this._sfxEnabled) this.audio.playSfx('safety', 0.8);
    this.showToast('safety', '安全警告', message, 3500);
    this.events.onSafetyViolation?.(message);
    if (this.state.safetyViolations >= 5) {
      this.failLevel('安全违规次数过多', 'failed_safety');
    }
  }

  showToast(type: 'info' | 'success' | 'warning' | 'error' | 'safety', title: string, message: string, duration = 2500): void {
    this.state.toasts.push({
      id: this.toastSeq++, type, title, message, duration,
      startTime: performance.now(),
    });
  }

  private cleanupToasts(): void {
    const now = performance.now();
    this.state.toasts = this.state.toasts.filter(t => now - t.startTime < t.duration);
  }

  triggerKnowledgeCard(cardId: string): void {
    const config = this.state.levelConfig;
    const card = config?.knowledgeCards.find(c => c.id === cardId);
    if (!card) return;
    if (this.state.knowledgeViewed.includes(cardId)) return;
    this.state.knowledgeViewed.push(cardId);
    this.state.knowledgePopup = {
      cardId: card.id, title: card.title, content: card.content,
      category: card.category, visible: true,
    };
    if (this._sfxEnabled) this.audio.playSfx('ding', 0.6);
    this.events.onKnowledgeTriggered?.(cardId);
  }

  dismissKnowledge(): void {
    if (this.state.knowledgePopup) {
      this.state.knowledgePopup.visible = false;
      setTimeout(() => { if (this.state.knowledgePopup?.cardId === this.state.knowledgePopup?.cardId) this.state.knowledgePopup = null; }, 300);
    }
  }

  private completeLevel(): void {
    this.state.state = 'completed';
    this.events.onLevelComplete?.();
    if (this._sfxEnabled) {
      this.audio.playSfx('success', 1);
      setTimeout(() => this.audio.playSfx('star', 0.8), 200);
      setTimeout(() => this.audio.playSfx('star', 0.8), 400);
    }
  }

  private failLevel(reason: string, status: LevelResultStatus): void {
    this.state.state = 'failed';
    if (this._sfxEnabled) this.audio.playSfx('error', 1);
    this.events.onLevelFailed?.(reason);
  }

  abandonLevel(): void {
    this.state.state = 'failed';
    this.events.onLevelFailed?.('abandoned');
  }

  getResult(): LevelResult | null {
    const config = this.state.levelConfig;
    if (!config) return null;
    const isCompleted = this.state.state === 'completed' || this.state.stepsProgress.every(s => s.status === 'completed');
    const status: LevelResultStatus =
      this.state.state === 'failed' && this.state.safetyViolations >= 5 ? 'failed_safety'
      : this.state.state === 'failed' && (config.timeLimit && this.state.elapsedTime >= config.timeLimit) ? 'timeout'
      : isCompleted ? 'success' : 'abandoned';
    const totalSteps = Math.max(1, this.state.stepsProgress.length);
    const correctSteps = this.state.stepsProgress.filter(s => s.status === 'completed' && s.errors === 0).length;
    const accuracy = correctSteps / totalSteps;
    const maxSafety = 1;
    const safety = clamp(maxSafety - this.state.safetyViolations / 5, 0, 1);
    const efficiency = clamp(1 - Math.max(0, this.state.elapsedTime - (config.steps.reduce((s, st) => s + (st.duration || 3), 0) * 2)) / Math.max(1, config.timeLimit || 300), 0.3, 1);
    const finalScore = clamp(
      this.state.score + (isCompleted ? 100 : 0),
      0, config.maxScore,
    );
    return {
      status,
      score: finalScore,
      maxScore: config.maxScore,
      stars: computeStars(finalScore, config.starThresholds),
      duration: this.state.elapsedTime,
      accuracy,
      safety,
      efficiency,
      errors: this.state.errors,
      safetyViolations: this.state.safetyViolations,
      stepRecords: this.state.stepsProgress.map<StepRecord>((s, i) => ({
        stepId: s.stepId,
        status: s.status === 'completed' ? 'completed' : s.status === 'failed' ? 'failed' : 'skipped',
        score: s.score,
        timeTaken: Math.max(0, (s.completedAt || performance.now()) - s.startedAt) / 1000,
        errors: s.errors,
      })),
      knowledgeViewed: [...this.state.knowledgeViewed],
    };
  }

  setSfxEnabled(enabled: boolean): void { this._sfxEnabled = enabled; }
  setTimeScale(t: number): void { this.timeScale = clamp(t, 0.25, 3); }
  getParticles(): Particle[] { return this.particles.particles; }
}
