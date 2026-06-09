import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import useGameStore, { type ResultPayload } from '@/store/useGameStore';
import { useSandboxStore, useUINotificationStore } from '@/core/UIStateStore';
import { CanvasRenderer } from '@/rendering/CanvasRenderer';
import { ComponentRenderer } from '@/rendering/ComponentRenderer';
import { AnimationSystem } from '@/rendering/AnimationSystem';
import { InputMapper, type ActionType } from '@/core/InputMapper';
import AudioTrigger from '@/core/AudioTrigger';
import { LevelConfigLoader } from '@/core/LevelConfigLoader';
import { ComponentLibrary } from '@/game/ComponentLibrary';
import { WireSystem } from '@/game/WireSystem';
import { Simulator } from '@/game/Simulator';
import { ChallengeSystem } from '@/game/ChallengeSystem';
import { DataRecorder } from '@/game/DataRecorder';
import SaveSystem from '@/core/SaveSystem';
import { getNextLevelId } from '@/data/levelData';
import { ComponentPanel, InfoPanel, StatusBar, Toolbar, TutorialOverlay } from '@/rendering/ui/SandboxHUD';
import type { ComponentInstance, WireInstance, Vec2, LevelConfig, ComponentType } from '@/game/types';
import type { Port } from '@/game/types';
import { generateId, debounce, formatTime } from '@/utils/serialization';
import { dist, vec2, snapToGrid, pointToSegmentDistance } from '@/utils/geometry';
import { GRID_SIZE } from '@/data/defaults';

interface HoveredHit {
  type: 'component' | 'wire' | 'port' | 'canvas';
  componentId?: string;
  wireId?: string;
  portId?: string;
  worldPos: Vec2;
}

const audio = AudioTrigger.getInstance();
const library = ComponentLibrary.getInstance();
const levelLoader = LevelConfigLoader.getInstance();

export default function SandboxScene() {
  // === Global store refs ===
  const currentLevelId = useGameStore((s: any) => s.currentLevelId);
  const setScene = useGameStore((s: any) => s.setScene);
  const setResultPayload = useGameStore((s: any) => s.setResultPayload);
  const setLastCircuitSnapshot = useGameStore((s: any) => s.setLastCircuitSnapshot);
  const lastCircuitSnapshot = useGameStore((s: any) => s.lastCircuitSnapshot);
  const updateProgress = useGameStore((s: any) => s.updateProgress);
  const updateAnalytics = useGameStore((s: any) => s.updateAnalytics);
  const pushNotification = useUINotificationStore((s: any) => s.pushNotification);

  // === Sandbox store ===
  const components = useSandboxStore((s) => s.components);
  const wires = useSandboxStore((s) => s.wires);
  const selectedComponentId = useSandboxStore((s) => s.selectedComponentId);
  const wiringFromPortId = useSandboxStore((s) => s.wiringFromPortId);
  const hoveredPortId = useSandboxStore((s) => s.hoveredPortId);
  const simulationResult = useSandboxStore((s) => s.simulationResult);
  const objectivesStatus = useSandboxStore((s) => s.objectivesStatus);
  const canvasOffset = useSandboxStore((s) => s.canvasOffset);
  const canvasScale = useSandboxStore((s) => s.canvasScale);
  const addComponent = useSandboxStore((s) => s.addComponent);
  const removeComponent = useSandboxStore((s) => s.removeComponent);
  const moveComponent = useSandboxStore((s) => s.moveComponent);
  const selectComponent = useSandboxStore((s) => s.selectComponent);
  const clearAll = useSandboxStore((s) => s.clearAll);
  const addWire = useSandboxStore((s) => s.addWire);
  const removeWire = useSandboxStore((s) => s.removeWire);
  const setWiring = useSandboxStore((s) => s.setWiring);
  const setHoveredPort = useSandboxStore((s) => s.setHoveredPort);
  const setSimulation = useSandboxStore((s) => s.setSimulation);
  const setObjectivesStatus = useSandboxStore((s) => s.setObjectivesStatus);
  const setCanvasTransform = useSandboxStore((s) => s.setCanvasTransform);
  const loadCircuit = useSandboxStore((s) => s.loadCircuit);
  const toggleSwitch = useSandboxStore((s) => s.toggleSwitch);
  const setDragging = useSandboxStore((s) => s.setDragging);
  const draggingComponentType = useSandboxStore((s) => s.draggingComponentType);
  const draggingPosition = useSandboxStore((s) => s.draggingPosition);

  // === Refs (for render loop, no re-render) ===
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const compRendererRef = useRef<ComponentRenderer | null>(null);
  const animSystemRef = useRef<AnimationSystem | null>(null);
  const inputMapperRef = useRef<InputMapper | null>(null);
  const unsubscribeInputRef = useRef<(() => void) | null>(null);
  const unsubscribeRenderRef = useRef<(() => void) | null>(null);
  const wireSystemRef = useRef<WireSystem>(new WireSystem());
  const challengeRef = useRef<ChallengeSystem | null>(null);
  const dataRecorderRef = useRef<DataRecorder>(new DataRecorder(SaveSystem.getInstance()));
  const didLoadFromSnapshotRef = useRef<boolean>(false);
  const panningRef = useRef<{ active: boolean; start: Vec2; origin: Vec2 }>({
    active: false,
    start: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
  });
  const movingComponentRef = useRef<{ id: string; offset: Vec2 } | null>(null);
  const lastLitBulbsRef = useRef<Set<string>>(new Set());
  const levelStartTimeRef = useRef<number>(Date.now());

  // === Level config ===
  const levelConfig = useMemo<LevelConfig | null>(() => {
    if (!currentLevelId) return null;
    return levelLoader.getById(currentLevelId) ?? null;
  }, [currentLevelId]);

  const availableComponentTypes = useMemo(() => {
    if (levelConfig) return levelConfig.availableComponents;
    return ['battery', 'resistor', 'capacitor', 'switch', 'bulb'] as const;
  }, [levelConfig]);

  // === Tutorial state ===
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const showTutorial = useGameStore((s: any) => s.saveData.settings.showTutorial);

  const tutorialSteps = useMemo(() => {
    if (levelConfig?.tutorialSteps && levelConfig.tutorialSteps.length > 0) {
      return levelConfig.tutorialSteps;
    }
    if (levelConfig?.difficulty === 'tutorial') {
      return [
        { id: '1', step: 1, title: '欢迎', description: '👋 欢迎来到电路沙盒！从左侧元件库拖动元件到画布上。', action: '从左侧拖动元件到画布中央' },
        { id: '2', step: 2, title: '连接电路', description: '🔌 点击元件上的端点（小圆点）开始连线，再点击另一个端点完成。', action: '点击电池和灯泡的端点进行连接' },
        { id: '3', step: 3, title: '切换开关', description: '💡 所有元件正确连接后，灯泡会点亮。双击开关可以切换通断。', action: '双击开关元件，观察灯泡变化' },
        { id: '4', step: 4, title: '完成任务', description: '🎯 完成右侧面板显示的任务目标即可过关！祝你好运。', action: '查看右侧面板，完成所有目标' },
      ];
    }
    return [];
  }, [levelConfig]);

  // === Init challenge system ===
  useEffect(() => {
    if (levelConfig) {
      challengeRef.current = new ChallengeSystem(levelConfig);
    } else {
      challengeRef.current = null;
    }
  }, [levelConfig]);

  // === A. 关卡模式：加载预置元件（currentLevelId 变化时触发） ===
  useEffect(() => {
    levelStartTimeRef.current = Date.now();
    // 场景/关卡切换时重置快照加载守卫，让自由模式空白进入时能正常清屏
    didLoadFromSnapshotRef.current = false;

    if (currentLevelId) {
      // 关卡模式：加载预置
      if (levelConfig?.preplacedComponents && levelConfig.preplacedComponents.length > 0) {
        loadCircuit({
          components: JSON.parse(JSON.stringify(levelConfig.preplacedComponents)),
          wires: [],
        });
      } else {
        clearAll();
      }
      dataRecorderRef.current.startLevel(currentLevelId);
      updateAnalytics((a: any) => {
        a.levelsAttempted[currentLevelId] = (a.levelsAttempted[currentLevelId] ?? 0) + 1;
      });
      setTutorialStep(0);
      setTutorialVisible(tutorialSteps.length > 0 && showTutorial);
    } else {
      // 自由模式：若当前无快照（即不是方案库打开），则清屏；有快照时交给 useEffect B 处理
      const storeSnap = useGameStore.getState().lastCircuitSnapshot;
      if (!storeSnap) {
        clearAll();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevelId, levelConfig]);

  // === B. 自由模式：打开已保存方案（仅当 lastCircuitSnapshot 非空时触发） ===
  useEffect(() => {
    if (!currentLevelId && lastCircuitSnapshot) {
      // 标记：本轮由快照加载完成，之后即使快照被清空也不要再 clearAll
      didLoadFromSnapshotRef.current = true;
      levelStartTimeRef.current = Date.now();
      const snap = JSON.parse(JSON.stringify(lastCircuitSnapshot));
      // 端口标准化兜底
      snap.components = snap.components.map((raw: any) => {
        if (raw.ports && raw.ports.length) {
          raw.ports.forEach((p: any, idx: number) => {
            p.id = `${raw.id}:${idx}`;
            p.componentId = raw.id;
            if (!p.localOffset && p.localOffset === undefined) {
              try {
                const def = library.createComponentInstance(raw.type, { x: 0, y: 0 }, 0);
                p.localOffset = def.ports[idx]?.localOffset ?? { x: 0, y: 0 };
              } catch {
                p.localOffset = { x: 0, y: 0 };
              }
            }
          });
        }
        if (raw.properties && raw.properties.type === undefined) {
          raw.properties.type = raw.type;
        }
        return raw;
      });
      loadCircuit(snap);
      pushNotification('📂 已加载方案', 'info', 2000);
      // 消费掉快照（注意：这会再次触发本 useEffect，走 null 分支，但 ref 会守卫住）
      setTimeout(() => useGameStore.getState().setLastCircuitSnapshot(null), 50);
    } else if (!currentLevelId && !lastCircuitSnapshot) {
      // 只有首次自由模式进入（没加载过快照）才清屏；加载后消费快照导致的 null 变化跳过
      if (!didLoadFromSnapshotRef.current) {
        clearAll();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCircuitSnapshot]);

  // === Auto sync wire system ===
  useEffect(() => {
    wireSystemRef.current.clear();
    wires.forEach((w) => {
      wireSystemRef.current.addWire(w.fromPortId, w.toPortId);
    });
  }, [wires]);

  // === Run simulation whenever circuit changes ===
  const runSimulation = useCallback(() => {
    try {
      const sim = new Simulator();
      const result = sim.solve(components, wires);
      setSimulation(result);

      // Check newly lit bulbs for sound
      const newLit = new Set<string>();
      Object.entries(result.componentStates).forEach(([cid, st]) => {
        if (st.lit) newLit.add(cid);
      });
      newLit.forEach((id) => {
        if (!lastLitBulbsRef.current.has(id)) {
          audio.playBulbOn().catch(() => {});
          const c = components.find((x) => x.id === id);
          if (c && animSystemRef.current && rendererRef.current) {
            const screenPos = rendererRef.current.worldToScreen(c.position);
            animSystemRef.current.addBurst(screenPos, '#ffb347', 18);
          }
        }
      });
      lastLitBulbsRef.current.forEach((id) => {
        if (!newLit.has(id)) {
          audio.playBulbOff().catch(() => {});
        }
      });
      lastLitBulbsRef.current = newLit;

      // Short circuit shake
      if (result.hasShortCircuit) {
        rendererRef.current?.triggerShake(400, 6);
        audio.playError().catch(() => {});
        if (currentLevelId) {
          dataRecorderRef.current.recordFailure('short_circuit', 'simulation-short');
        }
        pushNotification('⚠️ 检测到短路！请检查电路连接。', 'warning', 3500);
      }

      // Check objectives
      if (challengeRef.current) {
        const status = challengeRef.current.checkObjectives(result, components, wires);
        setObjectivesStatus(status);

        // Level complete?
        if (status.failed.length === 0 && status.completed.length > 0) {
          const allDone = challengeRef.current
            .getObjectiveDescriptions()
            .every((o) => status.completed.includes(o.id));
          if (allDone) {
            handleLevelComplete(result);
          }
        }
      }
    } catch (e) {
      console.error('Sim error', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, wires]);

  useEffect(() => {
    const t = setTimeout(runSimulation, 50);
    return () => clearTimeout(t);
  }, [runSimulation]);

  // === Level complete handler ===
  const handleLevelComplete = useCallback(
    (_result: any) => {
      if (!challengeRef.current || !currentLevelId) return;
      const timeSpent = Date.now() - levelStartTimeRef.current;
      const failuresByLevel = dataRecorderRef.current.generateLevelReport(currentLevelId);
      const stars = challengeRef.current.checkStarConditions(
        _result,
        components,
        wires,
        {
          failures: failuresByLevel.failures,
          timeSpent,
          componentsUsed: components.length,
        }
      );
      audio.playSuccess().catch(() => {});
      if (stars === 3) audio.playStarEarned(3).catch(() => {});

      // Persist
      dataRecorderRef.current.completeLevel(currentLevelId, stars, timeSpent);
      const next = getNextLevelId(currentLevelId);
      updateProgress((p: any) => {
        const prevStars = p.levelStars[currentLevelId] ?? 0;
        if (stars > prevStars) p.levelStars[currentLevelId] = stars;
        const prevTime = p.levelBestTimes[currentLevelId] ?? Infinity;
        if (timeSpent < prevTime) p.levelBestTimes[currentLevelId] = timeSpent;
        if (next && !p.unlockedLevelIds.includes(next)) {
          p.unlockedLevelIds.push(next);
        }
      });

      const distribution: Record<string, number> = {};
      failuresByLevel.failureBreakdown && Object.entries(failuresByLevel.failureBreakdown).forEach(([k,v]) => distribution[k]=v);
      // 保存电路快照，结算页可用于保存方案
      setLastCircuitSnapshot({
        components: JSON.parse(JSON.stringify(components)),
        wires: JSON.parse(JSON.stringify(wires)),
      });

      const payload: ResultPayload = {
        timeSpent,
        stars,
        usedComponents: components.length,
        wiresCount: wires.length,
        failures: failuresByLevel.failures,
        retries: failuresByLevel.retries,
        errorDistribution: distribution,
      };
      setResultPayload(payload);
      setTimeout(() => setScene('result'), 1400);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentLevelId, components, wires]
  );

  // === Hit testing helper ===
  const hitTest = useCallback(
    (worldPos: Vec2): HoveredHit => {
      // Ports first (smaller)
      for (const c of components) {
        const inst = library.createComponentObject(c);
        const ports = inst.getWorldPorts();
        for (const p of ports) {
          if (dist(p.position, worldPos) < 14) {
            return { type: 'port', componentId: c.id, portId: p.id, worldPos };
          }
        }
      }
      // Wires
      for (const w of wires) {
        const fromPort = findPortById(w.fromPortId);
        const toPort = findPortById(w.toPortId);
        if (!fromPort || !toPort) continue;
        const fromComp = components.find((c) => c.id === fromPort.componentId);
        const toComp = components.find((c) => c.id === toPort.componentId);
        if (!fromComp || !toComp) continue;
        const fromInst = library.createComponentObject(fromComp);
        const toInst = library.createComponentObject(toComp);
        const fp = fromInst.getWorldPorts().find((p) => p.id === w.fromPortId)?.position;
        const tp = toInst.getWorldPorts().find((p) => p.id === w.toPortId)?.position;
        if (fp && tp) {
          if (pointToSegmentDistance(worldPos, fp, tp) < 6) {
            return { type: 'wire', wireId: w.id, worldPos };
          }
        }
      }
      // Components
      for (const c of components) {
        const inst = library.createComponentObject(c);
        if (inst.containsPoint(worldPos)) {
          return { type: 'component', componentId: c.id, worldPos };
        }
      }
      return { type: 'canvas', worldPos };
    },
    [components, wires]
  );

  function findPortById(portId: string): Port | undefined {
    for (const c of components) {
      const p = c.ports.find((x) => x.id === portId);
      if (p) return p;
    }
    return undefined;
  }

  // === Initialize canvas, renderer, input ===
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;
    renderer.setShowGrid(true);
    renderer.setTransform(canvasOffset, canvasScale);
    renderer.resize();
    renderer.start();

    const compRenderer = new ComponentRenderer();
    compRendererRef.current = compRenderer;

    const anim = new AnimationSystem();
    animSystemRef.current = anim;

    const input = new InputMapper(canvas);
    inputMapperRef.current = input;

    input.setTransformCallback((sp) => renderer.screenToWorld(sp));

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);

    // ==== Input action handler ====
    const actionHandler = (action: ActionType) => {
      switch (action.type) {
        case 'wheel': {
          const factor = action.deltaY < 0 ? 1.08 : 0.92;
          const newScale = Math.max(0.4, Math.min(2.5, canvasScale * factor));
          // Zoom towards cursor
          const cursorWorld = renderer.screenToWorld(action.pos);
          const newOffset = {
            x: action.pos.x - (cursorWorld.x - canvasOffset.x) * (newScale / canvasScale),
            y: action.pos.y - (cursorWorld.y - canvasOffset.y) * (newScale / canvasScale),
          };
          renderer.setTransform(newOffset, newScale);
          setCanvasTransform(newOffset, newScale);
          break;
        }
        case 'pointer-down': {
          const world = action.pos;
          if (action.button === 1 || (action.button === 0 && action.ctrl)) {
            // Pan
            panningRef.current = {
              active: true,
              start: { x: action.pos.x, y: action.pos.y },
              origin: { ...canvasOffset },
            };
            return;
          }
          const hit = hitTest(world);
          if (hit.type === 'port') {
            audio.playClick().catch(() => {});
            if (wiringFromPortId && hit.portId && hit.portId !== wiringFromPortId) {
              // Complete the wire
              const existingWire = wires.find(
                (w) =>
                  (w.fromPortId === wiringFromPortId && w.toPortId === hit.portId) ||
                  (w.fromPortId === hit.portId && w.toPortId === wiringFromPortId)
              );
              if (existingWire) {
                pushNotification('该连线已存在', 'info', 1800);
              } else {
                const wireId = generateId('wire');
                addWire({ id: wireId, fromPortId: wiringFromPortId, toPortId: hit.portId! });
                audio.playWireConnect().catch(() => {});
                dataRecorderRef.current.recordWireDrawn();
                updateAnalytics((a: any) => {
                  a.wiresDrawn = (a.wiresDrawn ?? 0) + 1;
                });
              }
              setWiring(null);
              setHoveredPort(null);
            } else if (hit.portId) {
              setWiring(hit.portId);
            }
            return;
          }
          if (hit.type === 'component') {
            audio.playClick().catch(() => {});
            selectComponent(hit.componentId!);
            const c = components.find((x) => x.id === hit.componentId);
            if (c) {
              movingComponentRef.current = {
                id: c.id,
                offset: { x: world.x - c.position.x, y: world.y - c.position.y },
              };
              anim.addPlacementAnimation(c.id);
            }
            return;
          }
          if (hit.type === 'wire') {
            // Select wire
            selectComponent(null);
            return;
          }
          // Canvas blank: deselect + cancel wiring
          selectComponent(null);
          setWiring(null);
          break;
        }
        case 'pointer-move': {
          const world = action.pos;

          // Dragging preview
          if (draggingComponentType && draggingPosition) {
            setDragging(draggingComponentType, world);
          }

          // Panning
          if (panningRef.current.active && (action.buttons & 1 || action.buttons & 4)) {
            const dx = action.pos.x - panningRef.current.start.x;
            const dy = action.pos.y - panningRef.current.start.y;
            const newOffset = {
              x: panningRef.current.origin.x + dx,
              y: panningRef.current.origin.y + dy,
            };
            renderer.setTransform(newOffset, canvasScale);
            setCanvasTransform(newOffset, canvasScale);
            return;
          }
          // Moving component
          if (movingComponentRef.current && (action.buttons & 1)) {
            const offset = movingComponentRef.current.offset;
            const target = snapToGrid(
              { x: world.x - offset.x, y: world.y - offset.y },
              GRID_SIZE
            );
            moveComponent(movingComponentRef.current.id, target);
            return;
          }
          // Hover detect
          const hit = hitTest(world);
          if (hit.type === 'port') {
            setHoveredPort(hit.portId ?? null);
          } else {
            setHoveredPort(null);
          }
          break;
        }
        case 'pointer-up': {
          panningRef.current.active = false;
          movingComponentRef.current = null;
          break;
        }
        case 'double-click': {
          const world = action.pos;
          const hit = hitTest(world);
          if (hit.type === 'component') {
            const c = components.find((x) => x.id === hit.componentId);
            if (c && c.type === 'switch') {
              toggleSwitch(c.id);
              audio.playSwitchToggle().catch(() => {});
              anim.addPlacementAnimation(c.id);
            }
          }
          break;
        }
        case 'context-menu': {
          const world = action.pos;
          const hit = hitTest(world);
          if (hit.type === 'component') {
            const c = components.find((x) => x.id === hit.componentId);
            const fixed = levelConfig?.fixedComponents ?? [];
            if (c && !fixed.includes(c.id)) {
              removeComponent(c.id);
              audio.playDelete().catch(() => {});
            } else {
              pushNotification('该元件为关卡预置，不能删除', 'warning', 2000);
            }
          } else if (hit.type === 'wire') {
            removeWire(hit.wireId!);
            audio.playDelete().catch(() => {});
          }
          break;
        }
        case 'key-down': {
          if (action.key === 'Delete' || action.key === 'Backspace') {
            if (selectedComponentId) {
              const fixed = levelConfig?.fixedComponents ?? [];
              if (!fixed.includes(selectedComponentId)) {
                removeComponent(selectedComponentId);
                audio.playDelete().catch(() => {});
              }
            }
          } else if (action.key === 'Escape') {
            setWiring(null);
            selectComponent(null);
          } else if ((action.key === 'r' || action.key === 'R') && selectedComponentId) {
            // rotate (placeholder)
          } else if (action.ctrl && action.key === 'z') {
            // undo placeholder
          }
          break;
        }
      }
    };
    unsubscribeInputRef.current = input.onAction(actionHandler);

    // ==== Render callback ====
    const renderCb = (ctx: CanvasRenderingContext2D, time: number, _dt: number) => {
      const w2s = (p: Vec2) => renderer.worldToScreen(p);

      anim.update(
        _dt,
        simulationResult,
        (wireId: string) => {
          const w = wires.find((x) => x.id === wireId);
          if (!w) return null;
          const fp = portIdToWorld(w.fromPortId);
          const tp = portIdToWorld(w.toPortId);
          if (!fp || !tp) return null;
          return [fp, tp];
        }
      );

      // Flow particles for wires with current
      if (simulationResult && Math.random() < 0.5) {
        Object.entries(simulationResult.wireCurrents).forEach(([wid, cur]) => {
          if (cur > 0.01) anim.addFlowParticle(wid, { x: 0, y: 0 });
        });
      }

      // === Render wires ===
      for (const w of wires) {
        const fp = portIdToWorld(w.fromPortId);
        const tp = portIdToWorld(w.toPortId);
        if (!fp || !tp) continue;
        const current = simulationResult?.wireCurrents[w.id] ?? 0;
        const isError =
          (simulationResult?.hasShortCircuit &&
            (simulationResult.shortCircuitWires?.includes(w.id) ?? false)) ?? false;
        compRenderer.renderWire(ctx, w, [fp, tp], current, isError, w2s, anim, time);
      }

      // === Render wiring preview line ===
      if (wiringFromPortId) {
        const fp = portIdToWorld(wiringFromPortId);
        if (fp) {
          const lastMouseWorld = input.lastWorldPos ?? vec2(0,0);
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.65)';
          ctx.setLineDash([8, 6]);
          ctx.lineWidth = 3;
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
          const f = w2s(fp);
          const l = w2s(lastMouseWorld);
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(l.x, l.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // === Render components ===
      for (const c of components) {
        const state = simulationResult?.componentStates[c.id] ?? null;
        compRenderer.setSelectedId(selectedComponentId);
        compRenderer.renderComponent(
          ctx,
          c,
          state,
          anim,
          w2s
        );
        compRenderer.renderPorts(
          ctx,
          c,
          hoveredPortId,
          !!wiringFromPortId,
          w2s
        );
      }

      // === Render drag ghost preview ===
      if (draggingComponentType && draggingPosition) {
        const inst = library.createComponentInstance(draggingComponentType, draggingPosition, 0);
        ctx.save();
        ctx.globalAlpha = 0.55;
        compRenderer.renderComponent(ctx, inst, null, anim, w2s);
        ctx.restore();
      }

      anim.renderParticles(ctx, (p) => p);
      anim.renderFlowParticles(ctx, w2s);
    };
    unsubscribeRenderRef.current = renderer.onRender(renderCb);

    // Helper
    function portIdToWorld(pid: string): Vec2 | null {
      for (const c of components) {
        const port = c.ports.find((p) => p.id === pid);
        if (port) {
          const inst = library.createComponentObject(c);
          return inst.getWorldPorts().find((p) => p.id === pid)?.position ?? null;
        }
      }
      return null;
    }

    return () => {
      window.removeEventListener('resize', onResize);
      unsubscribeInputRef.current?.();
      unsubscribeRenderRef.current?.();
      renderer.stop();
      input.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    components,
    wires,
    selectedComponentId,
    wiringFromPortId,
    hoveredPortId,
    simulationResult,
    canvasOffset,
    canvasScale,
    draggingComponentType,
    draggingPosition,
    levelConfig,
  ]);

  // === HTML5 drop from component panel ===
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('component-type') as any;
      if (!type || !availableComponentTypes.includes(type)) return;
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const sp = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const wp = rendererRef.current?.screenToWorld(sp);
      if (!wp) return;
      const snapped = snapToGrid(wp, GRID_SIZE);
      const instance = library.createComponentInstance(type, snapped, 0);
      addComponent(instance);
      audio.playClick().catch(() => {});
      animSystemRef.current?.addPlacementAnimation(instance.id);
      dataRecorderRef.current.recordComponentPlaced();
      updateAnalytics((a: any) => {
        a.componentsPlaced = (a.componentsPlaced ?? 0) + 1;
      });
      setDragging(null, null);
    },
    [addComponent, availableComponentTypes, updateAnalytics]
  );

  // === Toolbar actions ===
  const handleReset = useCallback(() => {
    if (levelConfig?.preplacedComponents && levelConfig.preplacedComponents.length > 0) {
      loadCircuit({
        components: JSON.parse(JSON.stringify(levelConfig.preplacedComponents)),
        wires: [],
      });
    } else {
      clearAll();
    }
    dataRecorderRef.current.recordRetry();
    if (currentLevelId) {
      updateAnalytics((a: any) => {
        a.levelRetries[currentLevelId] = (a.levelRetries[currentLevelId] ?? 0) + 1;
      });
    }
    pushNotification('🔄 已重置关卡', 'info', 1800);
  }, [clearAll, currentLevelId, levelConfig, loadCircuit, pushNotification, updateAnalytics]);

  const handleSaveCircuit = useCallback(async () => {
    const name = prompt('给你的电路方案起个名字：', `电路-${new Date().toLocaleTimeString('zh-CN')}`);
    if (!name) return;
    let thumbnail = '';
    if (canvasRef.current) {
      try {
        thumbnail = canvasRef.current.toDataURL('image/png');
      } catch {}
    }
    const save = {
      id: generateId('sav'),
      name,
      levelId: currentLevelId ?? undefined,
      createdAt: Date.now(),
      thumbnail,
      circuit: { components, wires },
    };
    // Use global store
    useGameStore.getState().saveCircuit(save);
    audio.playSuccess().catch(() => {});
    pushNotification(`💾 已保存方案：${name}（${components.length}元件·${wires.length}导线）`, 'success', 2500);
  }, [components, currentLevelId, pushNotification, wires]);

  const buildExportJSON = useCallback(() => {
    return {
      schema: 'circuit-lab/v1' as const,
      id: `circuit-${Date.now()}`,
      name: `电路-${new Date().toLocaleString('zh-CN')}`,
      levelId: currentLevelId ?? undefined,
      createdAt: Date.now(),
      thumbnail: '',
      // 与 SavedCircuit 保持一致的 circuit 包裹结构，保证能被方案库导入
      circuit: {
        components: JSON.parse(JSON.stringify(components)),
        wires: JSON.parse(JSON.stringify(wires)),
      },
    };
  }, [components, currentLevelId, wires]);

  const handleExportJSON = useCallback(() => {
    if (components.length === 0 && wires.length === 0) {
      pushNotification('⚠️ 画布上还没有电路，无法导出', 'warning', 2000);
      return;
    }
    try {
      const obj = buildExportJSON();
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `circuit-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
      audio.playSuccess().catch(() => {});
      pushNotification(`📥 已导出 ${obj.circuit.components.length}元件·${obj.circuit.wires.length}导线`, 'success', 2200);
    } catch (e) {
      pushNotification('❌ 导出失败：' + (e as Error).message, 'error', 3000);
    }
  }, [buildExportJSON, components.length, pushNotification, wires.length]);

  const handleCopyJSON = useCallback(async () => {
    if (components.length === 0 && wires.length === 0) {
      pushNotification('⚠️ 画布上还没有电路，无法复制', 'warning', 2000);
      return;
    }
    try {
      const obj = buildExportJSON();
      const text = JSON.stringify(obj, null, 2);
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(ta);
        }
      }
      audio.playSuccess().catch(() => {});
      pushNotification(`📋 电路 JSON 已复制（${obj.circuit.components.length}元件），可粘贴分享`, 'success', 2800);
    } catch (e) {
      pushNotification('❌ 复制失败：' + (e as Error).message, 'error', 3000);
    }
  }, [buildExportJSON, components.length, pushNotification, wires.length]);

  const handleBack = useCallback(() => {
    setScene(currentLevelId ? 'level-select' : 'menu');
  }, [currentLevelId, setScene]);

  const handleTutorialSkip = () => {
    setTutorialVisible(false);
    if (currentLevelId) {
      dataRecorderRef.current.recordTutorialSkip('all');
      updateProgress((p: any) => {
        p.tutorialSkipped = true;
      });
      updateAnalytics((a: any) => {
        if (!a.tutorialStepsSkipped.includes('global')) {
          a.tutorialStepsSkipped.push('global');
        }
      });
    }
    pushNotification('💡 可随时从设置中重新开启教程', 'info', 2500);
  };

  // === Error count for status ===
  const errorCount = objectivesStatus?.failed.length ?? 0;
  const completeCount = objectivesStatus?.completed.length ?? 0;
  const objectiveTotal = challengeRef.current?.getObjectiveDescriptions().length ?? 0;

  const completedObjectiveIds = useMemo(() => {
    return new Set(objectivesStatus?.completed ?? []);
  }, [objectivesStatus]);

  const soundEnabled = useGameStore((s: any) => s.saveData.settings.soundEnabled);

  const handleShowHint = () => {
    pushNotification('💡 仔细检查电路连接，确保所有端点都正确连线', 'info', 2500);
  };

  const handleToggleSound = () => {
    const settings = useGameStore.getState().saveData.settings;
    useGameStore.getState().updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleUpdateComponent = (id: string, updates: Partial<ComponentInstance>) => {
    const next = components.map((c) => {
      if (c.id !== id) return c;
      return { ...c, ...updates };
    });
    useSandboxStore.setState({ components: next });
  };

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen flex flex-col bg-circuit-board overflow-hidden select-none"
      style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
    >
      {/* Top Toolbar */}
      <Toolbar
        title={levelConfig?.name ?? '🧪 自由模式'}
        onBack={handleBack}
        onReset={handleReset}
        onSave={handleSaveCircuit}
        onShowHint={handleShowHint}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isFreeMode={!currentLevelId}
        onExportJSON={handleExportJSON}
        onCopyJSON={handleCopyJSON}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left - Component Panel */}
        <ComponentPanel
          availableComponents={[...availableComponentTypes]}
          onDragStart={(t: ComponentType) => {
            setDragging(t, { x: 0, y: 0 });
          }}
        />

        {/* Center - Canvas */}
        <div
          className="flex-1 relative"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none"
            style={{ imageRendering: 'auto' }}
          />
          {/* Disclaimers watermark */}
          <div className="absolute bottom-3 left-3 text-xs text-circuit-border/70 pointer-events-none">
            教学仿真模型 · 非专业工程软件
          </div>
          {/* Instructions overlay (first level only) */}
          {!components.length && !levelConfig?.preplacedComponents?.length && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-circuit-border/80 font-mono">
                <div className="text-5xl mb-4">⚡</div>
                <div className="text-lg">从左侧元件库拖动元件到这里开始</div>
                <div className="text-sm mt-2 opacity-70">连接元件端点搭建电路</div>
              </div>
            </div>
          )}
        </div>

        {/* Right - Info Panel */}
        <InfoPanel
          levelName={levelConfig?.name ?? '🧪 自由模式'}
          levelDescription={levelConfig?.description ?? '自由搭建任意电路，探索电路原理'}
          objectives={levelConfig?.objectives ?? []}
          completedObjectiveIds={completedObjectiveIds}
          selectedComponent={
            selectedComponentId
              ? components.find((c) => c.id === selectedComponentId) ?? null
              : null
          }
          onToggleSwitch={(id) => {
            toggleSwitch(id);
            audio.playSwitchToggle().catch(() => {});
          }}
          onUpdateComponent={handleUpdateComponent}
        />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        componentCount={components.length}
        wireCount={wires.length}
        simulating={!simulationResult?.hasShortCircuit && simulationResult != null}
        hasError={simulationResult?.hasShortCircuit ?? false}
        errorMessage={simulationResult?.hasShortCircuit ? '检测到短路' : null}
      />

      {/* Tutorial Overlay */}
      {tutorialVisible && tutorialSteps.length > 0 && (
        <TutorialOverlay
          steps={tutorialSteps}
          currentStep={tutorialStep}
          onNext={() => {
            if (tutorialStep < tutorialSteps.length - 1) {
              setTutorialStep((s) => s + 1);
            } else {
              setTutorialVisible(false);
              updateProgress((p: any) => {
                p.tutorialCompleted = true;
              });
              pushNotification('🎉 教程完成，开始闯关吧！', 'success', 2500);
            }
          }}
          onPrev={() => setTutorialStep((s) => Math.max(0, s - 1))}
          onSkip={handleTutorialSkip}
          onClose={() => setTutorialVisible(false)}
        />
      )}
    </div>
  );
}
