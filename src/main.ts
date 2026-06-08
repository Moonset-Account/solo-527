import { Engine } from './engine';
import { InputManager } from './input';
import { Camera } from './camera';
import { CircuitGraph } from './circuit';
import { CircuitComponent, ComponentFactory } from './components';
import { Wire, WireFactory } from './wire';
import { Simulator } from './simulator';
import { TutorialManager } from './tutorial';
import { LevelManager } from './levels';
import { AnalyticsTracker, AnalyticsData } from './analytics';
import { SaveManager } from './save';
import { UIManager } from './ui';
import {
  ComponentType,
  APP_CONFIG,
  DEFAULT_SETTINGS,
  Settings,
  LEVEL_CONFIGS,
  BULB_RATED_VOLTAGE,
} from './config';
import { perfStats } from './perf';

enum InteractionMode {
  Idle = 'idle',
  DraggingComponent = 'dragging_component',
  DraggingNew = 'dragging_new',
  Wiring = 'wiring',
  Panning = 'panning',
}

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: Engine;
  private input: InputManager;
  private camera: Camera;
  private graph: CircuitGraph;
  private simulator: Simulator;
  private tutorial: TutorialManager;
  private levels: LevelManager;
  private analytics: AnalyticsTracker;
  private saveManager: SaveManager;
  private ui: UIManager;

  private mode: InteractionMode = InteractionMode.Idle;
  private settings: Settings;
  private selectedComponentId: string | null = null;
  private selectedWireId: string | null = null;
  private draggingComponentId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private draggingNewType: ComponentType | null = null;
  private draggingNewComp: CircuitComponent | null = null;
  private wiringStartCompId: string | null = null;
  private wiringStartPinIdx: number | null = null;
  private wiringPreviewEnd: { x: number; y: number } | null = null;
  private currentHintIdx = 0;
  private levelCompleted = false;
  private levelStartTime = 0;
  private ghostX = 0;
  private ghostY = 0;
  private dragNewCleanup: (() => void) | null = null;
  private isLoadingSave = false;

  constructor() {
    this.canvas = document.getElementById('circuit-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.engine = new Engine();
    this.input = new InputManager();
    this.camera = new Camera();
    this.graph = new CircuitGraph();
    this.simulator = new Simulator();
    this.tutorial = new TutorialManager();
    this.levels = new LevelManager();
    this.analytics = new AnalyticsTracker();
    this.saveManager = new SaveManager();
    this.ui = new UIManager();
    this.settings = { ...DEFAULT_SETTINGS, keyBindings: { ...DEFAULT_SETTINGS.keyBindings } };
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.input.init(this.canvas);
    this.input.setWorldTransform((sx, sy) => this.camera.screenToWorld(sx, sy));

    this.bindKeyActions();

    this.engine.setOnFixedUpdate((dt) => this.fixedUpdate(dt));
    this.engine.setOnUpdate((dt) => this.update(dt));
    this.engine.setOnRender(() => this.render());

    this.setupUICallbacks();
    this.setupLevelCallbacks();
    this.setupTutorialCallbacks();

    this.loadFromShareOrSave();
    if (!this.levels.getCurrentLevel()) {
      this.levels.loadLevelByIndex(0);
    }

    this.engine.start();
  }

  private resizeCanvas() {
    const wrap = document.getElementById('canvas-wrap')!;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = wrap.clientWidth * dpr;
    this.canvas.height = wrap.clientHeight * dpr;
    this.canvas.style.width = wrap.clientWidth + 'px';
    this.canvas.style.height = wrap.clientHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private bindKeyActions() {
    for (const key of this.settings.keyBindings.delete) {
      this.input.bindAction('delete', this.settings.keyBindings.delete);
      break;
    }
    for (const key of this.settings.keyBindings.rotate) {
      this.input.bindAction('rotate', this.settings.keyBindings.rotate);
      break;
    }
    for (const key of this.settings.keyBindings.hint) {
      this.input.bindAction('hint', this.settings.keyBindings.hint);
      break;
    }
    for (const key of this.settings.keyBindings.pause) {
      this.input.bindAction('pause', this.settings.keyBindings.pause);
      break;
    }
  }

  private setupUICallbacks() {
    document.getElementById('btn-tutorial')!.addEventListener('click', () => {
      const level = this.levels.getCurrentLevel();
      if (level && level.tutorialSteps.length > 0) {
        this.tutorial.start(level.tutorialSteps);
      }
    });

    document.getElementById('btn-hint')!.addEventListener('click', () => {
      this.showHint();
    });

    document.getElementById('btn-reset')!.addEventListener('click', () => {
      this.resetLevel();
    });

    document.getElementById('btn-save')!.addEventListener('click', () => {
      const level = this.levels.getCurrentLevel();
      this.saveManager.save(
        this.graph,
        level?.id ?? '',
        this.analytics.serialize(),
        this.settings,
      );
      this.ui.showHint('已保存');
      setTimeout(() => this.ui.hideHint(), 2000);
    });

    document.getElementById('btn-load')!.addEventListener('click', () => {
      this.loadSave();
    });

    document.getElementById('btn-share')!.addEventListener('click', () => {
      const level = this.levels.getCurrentLevel();
      const url = this.saveManager.share(this.graph, level?.id ?? '', this.analytics.serialize());
      navigator.clipboard.writeText(url).then(() => {
        this.ui.showHint('分享链接已复制到剪贴板');
        setTimeout(() => this.ui.hideHint(), 2000);
      }).catch(() => {
        this.ui.showHint('分享链接生成失败');
        setTimeout(() => this.ui.hideHint(), 2000);
      });
    });

    document.getElementById('btn-pause')!.addEventListener('click', () => {
      this.engine.pause();
      this.ui.showPause();
    });

    document.getElementById('btn-settings')!.addEventListener('click', () => {
      this.engine.pause();
      this.ui.showSettings(this.settings, (newSettings) => {
        const keysChanged = JSON.stringify(this.settings.keyBindings) !== JSON.stringify(newSettings.keyBindings);
        this.settings = newSettings;
        if (keysChanged) {
          this.bindKeyActions();
        }
      });
    });

    document.getElementById('pause-resume')!.addEventListener('click', () => {
      this.engine.resume();
      this.ui.hidePause();
    });

    document.getElementById('pause-restart')!.addEventListener('click', () => {
      this.ui.hidePause();
      this.resetLevel();
      this.engine.resume();
    });

    document.getElementById('settings-close')!.addEventListener('click', () => {
      this.ui.hideSettings();
      this.engine.resume();
    });
  }

  private setupLevelCallbacks() {
    this.levels.setOnLevelChange((level) => {
      if (!this.isLoadingSave) {
        this.graph.clear();
      }
      this.selectedComponentId = null;
      this.selectedWireId = null;
      this.levelCompleted = false;
      this.levelStartTime = Date.now();
      this.currentHintIdx = 0;

      if (!this.isLoadingSave) {
        this.analytics.startLevel(level.id);
      }
      this.levels.startFreePlayTimer();

      this.ui.buildPalette(level.availableComponents, (type) => {
        this.startDragNew(type);
      });
      this.ui.updateLevelBadge(level.name);
      this.ui.hideSettlement();

      if (level.tutorialSteps.length > 0 && !this.isLoadingSave) {
        this.tutorial.start(level.tutorialSteps);
      }

      if (this.settings.autoSave) {
        this.saveManager.startAutoSave(
          this.graph,
          level.id,
          this.analytics.serialize(),
          this.settings,
        );
      }

      if (!this.isLoadingSave) {
        this.updatePinConnectedStates();
      }
    });
  }

  private setupTutorialCallbacks() {
    this.tutorial.setOnStepChange((_step, total, stepData) => {
      this.ui.showTutorial(
        `教程 (${_step + 1}/${total})`,
        stepData.text,
        [
          { text: '跳过', action: () => { this.tutorial.skip(); this.analytics.recordTutorialSkipped(); this.ui.hideTutorial(); } },
          { text: '好的', action: () => this.ui.hideTutorial() },
        ],
      );
    });
  }

  private loadFromShareOrSave() {
    const shareData = this.saveManager.loadFromShare(window.location.href);
    if (shareData) {
      this.isLoadingSave = true;
      this.saveManager.loadIntoGraph(this.graph, shareData);
      if (shareData.level) {
        this.levels.loadLevel(shareData.level);
      }
      if (shareData.settings) {
        this.settings = shareData.settings as Settings;
      }
      if (shareData.analytics) {
        this.analytics.deserialize(shareData.analytics);
      }
      this.isLoadingSave = false;
      this.updatePinConnectedStates();
      return;
    }

    if (this.saveManager.hasSave()) {
      const saveData = this.saveManager.load();
      if (saveData) {
        this.isLoadingSave = true;
        this.saveManager.loadIntoGraph(this.graph, saveData);
        if (saveData.level) {
          this.levels.loadLevel(saveData.level);
        }
        if (saveData.settings) {
          this.settings = saveData.settings as Settings;
        }
        if (saveData.analytics) {
          this.analytics.deserialize(saveData.analytics);
        }
        this.isLoadingSave = false;
        this.updatePinConnectedStates();
      }
    }
  }

  private loadSave() {
    if (!this.saveManager.hasSave()) {
      this.ui.showHint('没有找到存档');
      setTimeout(() => this.ui.hideHint(), 2000);
      return;
    }
    const saveData = this.saveManager.load();
    if (!saveData) return;
    this.isLoadingSave = true;
    this.saveManager.loadIntoGraph(this.graph, saveData);
    if (saveData.level) {
      this.levels.loadLevel(saveData.level);
    }
    if (saveData.settings) {
      this.settings = saveData.settings as Settings;
      this.bindKeyActions();
    }
    if (saveData.analytics) {
      this.analytics.deserialize(saveData.analytics);
    }
    this.isLoadingSave = false;
    this.updatePinConnectedStates();
    this.ui.showHint('已加载存档');
    setTimeout(() => this.ui.hideHint(), 2000);
  }

  private startDragNew(type: ComponentType) {
    if (this.dragNewCleanup) {
      this.dragNewCleanup();
      this.dragNewCleanup = null;
    }
    this.mode = InteractionMode.DraggingNew;
    this.draggingNewType = type;
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const worldPos = this.camera.screenToWorld(cx, cy);
    this.draggingNewComp = ComponentFactory.create(type, worldPos.x, worldPos.y);

    const handleMove = (e: MouseEvent) => {
      if (!this.draggingNewComp) return;
      const canvasRect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - canvasRect.left;
      const sy = e.clientY - canvasRect.top;
      const w = this.camera.screenToWorld(sx, sy);
      let nx = w.x;
      let ny = w.y;
      if (this.settings.snapToGrid) {
        const s = this.camera.snapToGrid(nx, ny);
        nx = s.x;
        ny = s.y;
      }
      this.draggingNewComp!.x = nx;
      this.draggingNewComp!.y = ny;
      for (const pin of this.draggingNewComp!.pins) {
        pin.updateWorldPos();
      }
    };

    const handleUp = (e: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      this.dragNewCleanup = null;

      if (this.draggingNewComp) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - canvasRect.left;
        const sy = e.clientY - canvasRect.top;
        const isOverCanvas = sx >= 0 && sy >= 0 && sx <= canvasRect.width && sy <= canvasRect.height;

        if (isOverCanvas) {
          this.graph.addComponent(this.draggingNewComp);
          this.analytics.recordComponentPlace(this.draggingNewComp.type);
          this.tutorial.checkCondition('component_placed:' + this.draggingNewComp.type);
          this.tutorial.checkCondition('all_components_placed');
          this.selectComponent(this.draggingNewComp.id);
        }
        this.draggingNewComp = null;
        this.draggingNewType = null;
        this.mode = InteractionMode.Idle;
      }
    };

    this.dragNewCleanup = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  private showHint() {
    const level = this.levels.getCurrentLevel();
    if (!level || level.hints.length === 0) return;
    const hint = level.hints[this.currentHintIdx % level.hints.length];
    this.currentHintIdx++;
    this.analytics.recordHint();
    this.ui.showHint(hint);
    setTimeout(() => this.ui.hideHint(), 5000);
  }

  private resetLevel() {
    const level = this.levels.getCurrentLevel();
    if (!level) return;
    this.analytics.recordFailure('level_reset');
    this.analytics.recordRetry();
    this.graph.clear();
    this.selectedComponentId = null;
    this.selectedWireId = null;
    this.levelCompleted = false;
    this.levelStartTime = Date.now();
    this.currentHintIdx = 0;
    this.analytics.startLevel(level.id);
    this.levels.startFreePlayTimer();
    if (level.tutorialSteps.length > 0) {
      this.tutorial.start(level.tutorialSteps);
    }
  }

  private fixedUpdate(dt: number) {
    if (this.engine.isPaused()) return;
    perfStats.beginSim();
    const simDt = dt * this.settings.simSpeed;
    this.simulator.simulate(this.graph, simDt);
    perfStats.endSim();

    if (!this.levelCompleted && this.levels.getCurrentLevel()) {
      const success = this.levels.checkSuccess(this.graph, this.simulator);
      if (success) {
        this.levelCompleted = true;
        this.analytics.completeLevel();
        this.onLevelComplete();
      }
    }
  }

  private update(dt: number) {
    if (this.engine.isPaused()) return;

    this.camera.update(dt);

    this.handleInput(dt);

    this.tutorial.update();

    perfStats.setComponentCount(this.graph.components.size);
    perfStats.setWireCount(this.graph.wires.size);

    const level = this.levels.getCurrentLevel();
    this.ui.updateStatusBar(
      this.engine.getFPS(),
      this.graph.components.size,
      level?.name ?? '--',
      true,
    );

    if (this.settings.showPerfStats) {
      this.ui.updatePerfStats(perfStats.getReport());
    } else {
      this.ui.updatePerfStats('');
    }

    this.input.endFrame();
  }

  private handleInput(_dt: number) {
    const worldPos = this.input.getWorldPos();
    this.ghostX = worldPos.x;
    this.ghostY = worldPos.y;

    if (this.input.isActionPressed('pause')) {
      const keys = this.settings.keyBindings.pause;
      if (keys.length > 0) this.input.consumeKey(keys[0]);
      this.engine.pause();
      this.ui.showPause();
      return;
    }

    if (this.input.isActionPressed('hint')) {
      const keys = this.settings.keyBindings.hint;
      if (keys.length > 0) this.input.consumeKey(keys[0]);
      this.showHint();
      return;
    }

    if (this.input.isActionPressed('delete')) {
      this.deleteSelected();
      const keys = this.settings.keyBindings.delete;
      if (keys.length > 0) this.input.consumeKey(keys[0]);
      return;
    }

    if (this.input.isActionPressed('rotate')) {
      this.rotateSelected();
      const keys = this.settings.keyBindings.rotate;
      if (keys.length > 0) this.input.consumeKey(keys[0]);
      return;
    }

    const scroll = this.input.getScrollDelta();
    if (scroll.dy !== 0) {
      const mousePos = this.input.getMousePos();
      const factor = scroll.dy > 0 ? 0.9 : 1.1;
      this.camera.zoomAt(factor, mousePos.screenX, mousePos.screenY);
    }

    const panKeys = this.settings.keyBindings.pan;
    for (const key of panKeys) {
      if (this.input.isKeyDown(key)) {
        const pdx = key === 'ArrowLeft' ? -APP_CONFIG.PAN_STEP : key === 'ArrowRight' ? APP_CONFIG.PAN_STEP : 0;
        const pdy = key === 'ArrowUp' ? -APP_CONFIG.PAN_STEP : key === 'ArrowDown' ? APP_CONFIG.PAN_STEP : 0;
        this.camera.pan(pdx / this.camera.zoom, pdy / this.camera.zoom);
      }
    }

    switch (this.mode) {
      case InteractionMode.Idle:
        this.handleIdle();
        break;
      case InteractionMode.DraggingComponent:
        this.handleDraggingComponent();
        break;
      case InteractionMode.DraggingNew:
        this.handleDraggingNew();
        break;
      case InteractionMode.Wiring:
        this.handleWiring();
        break;
      case InteractionMode.Panning:
        this.handlePanning();
        break;
    }
  }

  private handleIdle() {
    const worldPos = this.input.getWorldPos();

    if (this.input.isMouseClicked(2) || (this.input.isMouseDown(1))) {
      this.mode = InteractionMode.Panning;
      return;
    }

    if (this.input.isMouseClicked(0)) {
      const hit = this.graph.hitTest(worldPos.x, worldPos.y);

      if (hit.type === 'pin' && hit.id && hit.pinIndex !== undefined) {
        this.mode = InteractionMode.Wiring;
        this.wiringStartCompId = hit.id;
        this.wiringStartPinIdx = hit.pinIndex;
        this.wiringPreviewEnd = { x: worldPos.x, y: worldPos.y };
        this.input.consumeClick();
        return;
      }

      if (hit.type === 'component' && hit.id) {
        this.selectComponent(hit.id);
        const comp = this.graph.getComponent(hit.id);
        if (comp) {
          if (comp.type === ComponentType.Switch) {
            comp.state.closed = !comp.state.closed;
            this.analytics.recordSwitchToggle();
            this.tutorial.checkCondition('switch_toggled');
          }
          this.mode = InteractionMode.DraggingComponent;
          this.draggingComponentId = hit.id;
          this.dragOffsetX = comp.x - worldPos.x;
          this.dragOffsetY = comp.y - worldPos.y;
        }
        this.input.consumeClick();
        return;
      }

      if (hit.type === 'wire' && hit.id) {
        this.selectWire(hit.id);
        this.input.consumeClick();
        return;
      }

      this.deselectAll();
    }

    this.updateHover(worldPos.x, worldPos.y);
  }

  private handleDraggingComponent() {
    const worldPos = this.input.getWorldPos();
    const comp = this.draggingComponentId ? this.graph.getComponent(this.draggingComponentId) : null;
    if (!comp) {
      this.mode = InteractionMode.Idle;
      return;
    }

    let newX = worldPos.x + this.dragOffsetX;
    let newY = worldPos.y + this.dragOffsetY;

    if (this.settings.snapToGrid) {
      const snapped = this.camera.snapToGrid(newX, newY);
      newX = snapped.x;
      newY = snapped.y;
    }

    comp.x = newX;
    comp.y = newY;
    for (const pin of comp.pins) {
      pin.updateWorldPos();
    }

    if (!this.input.isMouseDown(0)) {
      this.mode = InteractionMode.Idle;
      this.draggingComponentId = null;
      this.tutorial.checkCondition('component_placed:' + comp.type);
      this.tutorial.checkCondition('all_components_placed');
    }
  }

  private handleDraggingNew() {
    if (this.dragNewCleanup) return;
    if (!this.draggingNewComp) {
      this.mode = InteractionMode.Idle;
    }
  }

  private handleWiring() {
    const worldPos = this.input.getWorldPos();
    this.wiringPreviewEnd = { x: worldPos.x, y: worldPos.y };

    if (this.input.isMouseClicked(0)) {
      const hit = this.graph.hitTest(worldPos.x, worldPos.y);

      if (hit.type === 'pin' && hit.id && hit.pinIndex !== undefined) {
        if (hit.id === this.wiringStartCompId && hit.pinIndex === this.wiringStartPinIdx) {
          this.cancelWiring();
          return;
        }

        const startComp = this.graph.getComponent(this.wiringStartCompId!);
        if (startComp && hit.id === this.wiringStartCompId) {
          this.cancelWiring();
          return;
        }

        const wire = WireFactory.create(
          { componentId: this.wiringStartCompId!, pinIndex: this.wiringStartPinIdx! },
          { componentId: hit.id, pinIndex: hit.pinIndex },
        );

        if (this.graph.addWire(wire)) {
          this.analytics.recordWireConnect();
          this.tutorial.checkCondition('wire_connected');
          this.tutorial.checkCondition('circuit_complete');
          this.updatePinConnectedStates();
        } else {
          this.analytics.recordFailure('wire_rejected');
        }
      }

      this.cancelWiring();
      this.input.consumeClick();
    }

    if (this.input.isMouseClicked(2)) {
      this.cancelWiring();
      this.input.consumeClick();
    }
  }

  private cancelWiring() {
    if (this.wiringStartCompId !== null) {
      this.analytics.recordFailure('wire_cancelled');
    }
    this.mode = InteractionMode.Idle;
    this.wiringStartCompId = null;
    this.wiringStartPinIdx = null;
    this.wiringPreviewEnd = null;
  }

  private handlePanning() {
    const delta = this.input.getDragDelta();
    this.camera.pan(-delta.dx / this.camera.zoom, -delta.dy / this.camera.zoom);

    if (!this.input.isMouseDown(1) && !this.input.isMouseDown(2)) {
      this.mode = InteractionMode.Idle;
    }
  }

  private selectComponent(id: string) {
    this.deselectAll();
    const comp = this.graph.getComponent(id);
    if (comp) {
      comp.selected = true;
      this.selectedComponentId = id;
      this.ui.showPropsPanel(comp, (value) => {
        comp.value = value;
        this.tutorial.checkCondition('value_changed');
      });
    }
  }

  private selectWire(id: string) {
    this.deselectAll();
    const wire = this.graph.getWire(id);
    if (wire) {
      wire.selected = true;
      this.selectedWireId = id;
    }
  }

  private deselectAll() {
    if (this.selectedComponentId) {
      const comp = this.graph.getComponent(this.selectedComponentId);
      if (comp) comp.selected = false;
      this.selectedComponentId = null;
    }
    if (this.selectedWireId) {
      const wire = this.graph.getWire(this.selectedWireId);
      if (wire) wire.selected = false;
      this.selectedWireId = null;
    }
    this.ui.hidePropsPanel();
  }

  private deleteSelected() {
    if (this.selectedComponentId) {
      this.analytics.recordFailure('component_deleted');
      this.graph.removeComponent(this.selectedComponentId);
      this.selectedComponentId = null;
      this.ui.hidePropsPanel();
      this.updatePinConnectedStates();
    }
    if (this.selectedWireId) {
      this.analytics.recordFailure('wire_deleted');
      this.graph.removeWire(this.selectedWireId);
      this.selectedWireId = null;
      this.updatePinConnectedStates();
    }
  }

  private rotateSelected() {
    if (this.selectedComponentId) {
      const comp = this.graph.getComponent(this.selectedComponentId);
      if (comp) {
        comp.rotate(90);
      }
    }
  }

  private updateHover(wx: number, wy: number) {
    for (const [, comp] of this.graph.components) {
      comp.hovered = comp.containsPoint(wx, wy);
    }
    for (const [, wire] of this.graph.wires) {
      const startComp = this.graph.getComponent(wire.startPin.componentId);
      const endComp = this.graph.getComponent(wire.endPin.componentId);
      if (!startComp || !endComp) continue;
      const startPin = startComp.pins[wire.startPin.pinIndex];
      const endPin = endComp.pins[wire.endPin.pinIndex];
      if (!startPin || !endPin) continue;
      startPin.updateWorldPos();
      endPin.updateWorldPos();
      wire.hovered = wire.hitTest(wx, wy, 8, { x: startPin.worldX, y: startPin.worldY }, { x: endPin.worldX, y: endPin.worldY });
    }
  }

  private updatePinConnectedStates() {
    for (const [, comp] of this.graph.components) {
      for (const pin of comp.pins) {
        const connected = this.graph.getConnectedPins(comp.id, pin.index);
        pin.connected = connected.length > 0;
      }
    }
  }

  private onLevelComplete() {
    const level = this.levels.getCurrentLevel();
    if (!level) return;

    this.levels.completeLevel();
    this.saveManager.stopAutoSave();

    const data = this.analytics.getCurrentData();
    const timeSeconds = (data.endTime - data.startTime) / 1000;
    const rating = this.calculateRating(data);

    this.ui.showSettlement(
      level.name,
      timeSeconds,
      data.retries,
      data.hintsUsed,
      rating,
      () => {
        this.ui.hideSettlement();
        const next = this.levels.nextLevel();
        if (!next) {
          this.ui.showTutorial('恭喜', '你已完成所有关卡！现在可以自由探索电路的奥秘。', [
            { text: '开始自由探索', action: () => this.ui.hideTutorial() },
          ]);
        }
      },
    );
  }

  private calculateRating(data: AnalyticsData): number {
    let rating = 1.0;
    if (data.retries === 0) rating += 0.3;
    if (data.hintsUsed === 0) rating += 0.3;
    const timeMinutes = (data.endTime - data.startTime) / 60000;
    if (timeMinutes < 2) rating += 0.2;
    return Math.min(1, rating);
  }

  private render() {
    perfStats.beginRender();
    const wrap = document.getElementById('canvas-wrap')!;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = APP_CONFIG.CANVAS_BG_COLOR;
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    const transform = this.camera.getTransform();
    this.ctx.translate(transform.offsetX, transform.offsetY);
    this.ctx.scale(transform.scale, transform.scale);

    if (this.settings.showGrid) {
      this.camera.drawGrid(this.ctx, w, h);
    }

    for (const [, wire] of this.graph.wires) {
      const startComp = this.graph.getComponent(wire.startPin.componentId);
      const endComp = this.graph.getComponent(wire.endPin.componentId);
      if (!startComp || !endComp) continue;
      const startPin = startComp.pins[wire.startPin.pinIndex];
      const endPin = endComp.pins[wire.endPin.pinIndex];
      if (!startPin || !endPin) continue;
      startPin.updateWorldPos();
      endPin.updateWorldPos();
      wire.draw(this.ctx, { x: startPin.worldX, y: startPin.worldY }, { x: endPin.worldX, y: endPin.worldY });
    }

    if (this.mode === InteractionMode.Wiring && this.wiringPreviewEnd && this.wiringStartCompId) {
      const startComp = this.graph.getComponent(this.wiringStartCompId);
      if (startComp && this.wiringStartPinIdx !== null) {
        const startPin = startComp.pins[this.wiringStartPinIdx];
        if (startPin) {
          startPin.updateWorldPos();
          this.ctx.save();
          this.ctx.strokeStyle = APP_CONFIG.WIRE_COLOR;
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([6, 4]);
          this.ctx.beginPath();
          this.ctx.moveTo(startPin.worldX, startPin.worldY);
          this.ctx.lineTo(this.wiringPreviewEnd.x, this.wiringPreviewEnd.y);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
          this.ctx.restore();
        }
      }
    }

    for (const [, comp] of this.graph.components) {
      comp.draw(this.ctx);
    }

    if (this.mode === InteractionMode.DraggingNew && this.draggingNewComp) {
      this.ctx.globalAlpha = 0.6;
      this.draggingNewComp.draw(this.ctx);
      this.ctx.globalAlpha = 1;
    }

    this.ctx.restore();

    perfStats.endRender();
    perfStats.beginFrame();
  }
}

const app = new App();
app.init();
