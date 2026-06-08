import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useUIStore } from '@/store/useUIStore';
import * as SaveMgr from '@/engine/SaveMgr';
import * as AudioTrigger from '@/engine/AudioTrigger';
import type { SaveData } from '@/types';

export default function SaveSlots() {
  const showSaveSlots = useUIStore((s) => s.showSaveSlots);
  const toggleSaveSlots = useUIStore((s) => s.toggleSaveSlots);
  const level = useGameStore((s) => s.level);
  const gameTime = useGameStore((s) => s.gameTime);
  const intersections = useGameStore((s) => s.intersections);
  const speed = useGameStore((s) => s.speed);
  const stats = useGameStore((s) => s.level);
  const startLevel = useGameStore((s) => s.startLevel);

  const [saves, setSaves] = useState(() => SaveMgr.listSaves());

  if (!showSaveSlots) return null;

  const handleSave = (slot: string) => {
    if (!level) return;
    const data: SaveData = {
      id: `save-${Date.now()}`,
      levelId: level.id,
      timestamp: Date.now(),
      gameTime,
      intersections,
      stats: {
        levelId: level.id,
        playTimeSeconds: gameTime,
        failureCount: 0,
        adjustments: [],
        scoreHistory: [],
      },
      speed,
    };
    SaveMgr.save(slot, data);
    AudioTrigger.playUIClick();
    setSaves(SaveMgr.listSaves());
  };

  const handleLoad = (slot: string) => {
    const data = SaveMgr.load(slot);
    if (!data) return;
    AudioTrigger.playUIClick();
  };

  const handleDelete = (slot: string) => {
    SaveMgr.deleteSave(slot);
    AudioTrigger.playUIClick();
    setSaves(SaveMgr.listSaves());
  };

  const handleExport = (data: SaveData) => {
    const json = SaveMgr.exportSave(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-sim-${data.levelId}-${data.timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute right-3 bottom-16 w-72 rounded-lg border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-['Orbitron'] text-xs font-bold text-white/80">
          存档管理
        </h3>
        <button
          onClick={toggleSaveSlots}
          className="text-xs text-white/40 transition hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {saves.map(({ slot, data }) => (
          <div
            key={slot}
            className="rounded border border-white/5 bg-white/5 p-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60">
                {slot.replace('slot', '档位 ')}
              </span>
              {data && (
                <span className="text-[10px] text-white/30">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            {data ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-white/40">
                  {data.levelId} | {data.gameTime.toFixed(0)}s
                </span>
                <button
                  onClick={() => handleLoad(slot)}
                  className="text-[10px] text-[#0abde3] transition hover:text-white"
                >
                  读取
                </button>
                <button
                  onClick={() => handleDelete(slot)}
                  className="text-[10px] text-[#e74c3c] transition hover:text-white"
                >
                  删除
                </button>
                <button
                  onClick={() => handleExport(data)}
                  className="text-[10px] text-white/40 transition hover:text-white"
                >
                  导出
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-white/20">空</span>
            )}
            <button
              onClick={() => handleSave(slot)}
              className="mt-1 w-full rounded bg-white/5 px-2 py-1 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              保存到此档位
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
