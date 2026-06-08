import { useRef, useEffect, useCallback } from "react";
import { FactoryRenderer } from "@/game/renderer";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { soundManager } from "@/game/sound";
import { LEVEL_CONFIGS } from "@/config/levels";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FactoryRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const prevDeliveredRef = useRef<number>(0);

  const grid = useGameStore((s) => s.grid);
  const engine = useGameStore((s) => s.engine);
  const bottlenecks = useGameStore((s) => s.bottlenecks);
  const handleCellClick = useGameStore((s) => s.handleCellClick);
  const removeMode = useGameStore((s) => s.removeMode);
  const sfxVolume = useUIStore((s) => s.sfxVolume);

  useEffect(() => {
    soundManager.setSfxVolume(sfxVolume);
  }, [sfxVolume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new FactoryRenderer(canvas);
    rendererRef.current = renderer;

    soundManager.init();

    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.resize(width, height);
      }
    });
    if (container) ro.observe(container);

    return () => {
      ro.disconnect();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setGrid(grid);
  }, [grid]);

  const deliveredCount = useGameStore((s) => s.deliveredCount);
  const currentLevelId = useGameStore((s) => s.currentLevelId);

  useEffect(() => {
    if (deliveredCount > prevDeliveredRef.current) {
      const renderer = rendererRef.current;
      if (renderer && currentLevelId) {
        const lc = LEVEL_CONFIGS.find((l) => l.id === currentLevelId);
        if (lc) {
          renderer.addDeliveryParticles(lc.exitPoint.x, lc.exitPoint.y);
          soundManager.play("deliver");
        }
      }
    }
    prevDeliveredRef.current = deliveredCount;
  }, [deliveredCount, currentLevelId]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setBottlenecks(bottlenecks);
  }, [bottlenecks]);

  const renderLoop = useCallback(() => {
    const renderer = rendererRef.current;
    if (renderer) {
      if (engine) {
        renderer.setProducts(engine.getProducts());
      }
      renderer.render();
    }
    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [engine]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderLoop]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const cell = renderer.getCellAt(e.clientX, e.clientY);
      if (cell) {
        soundManager.play("click");
        handleCellClick(cell.x, cell.y);
      }
    },
    [handleCellClick]
  );

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${removeMode ? "cursor-not-allowed" : "cursor-crosshair"}`}
        onClick={handleClick}
      />
      {removeMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 font-terminal text-sm text-factory-red bg-factory-dark/80 px-3 py-1 border border-factory-red animate-pulseBottleneck">
          拆除模式 - 点击移除
        </div>
      )}
    </div>
  );
}
