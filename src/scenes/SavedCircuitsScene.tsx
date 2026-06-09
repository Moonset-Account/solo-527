import { useEffect, useRef, useState } from 'react';
import {
  Home,
  FolderArchive,
  Download,
  Trash2,
  Upload,
  FlaskConical,
  FileJson,
  Layers,
  GitBranch,
} from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import useUIStore from '@/store/useUIStore';
import AudioTrigger from '@/core/AudioTrigger';
import { getLevelById } from '@/data/levelData';
import type { SavedCircuit } from '@/game/types';

interface SceneProps {
  onEnter?: () => void;
  onExit?: () => void;
}

const audio = AudioTrigger.getInstance();

function downloadJSON(obj: any, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SavedCircuitsScene({ onEnter, onExit }: SceneProps) {
  const {
    saveData,
    setScene,
    setCurrentLevel,
    saveCircuit,
    deleteCircuit,
    openSavedCircuit,
    loadSave,
  } = useGameStore();
  const { pushNotification } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emptyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSave();
    onEnter?.();
    return () => onExit?.();
  }, []);

  const sortedCircuits = [...saveData.savedCircuits].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  const handleBackToMenu = () => {
    audio.playClick();
    setScene('menu');
  };

  const handleGoSandbox = () => {
    audio.playClick();
    setCurrentLevel(null);
    setScene('sandbox');
  };

  const handleOpenCircuit = (id: string) => {
    audio.playClick();
    openSavedCircuit(id);
    pushNotification({
      type: 'success',
      title: '🔓 方案已载入',
      message: '电路方案已加载到沙盒',
    });
  };

  const handleExportCircuit = (circuit: SavedCircuit) => {
    audio.playClick();
    const exportData = {
      schema: 'circuit-lab/v1',
      ...circuit,
    };
    const { thumbnail, ...withoutThumbnail } = exportData;
    downloadJSON(withoutThumbnail, `${circuit.name}-${circuit.id}.json`);
    pushNotification({
      type: 'success',
      title: '📤 导出成功',
      message: `${circuit.name} 已导出为JSON`,
    });
  };

  const handleDeleteCircuit = (circuit: SavedCircuit) => {
    audio.playClick();
    const confirmed = window.confirm(
      `确认删除方案「${circuit.name}」？\n此操作无法撤销！`
    );
    if (confirmed) {
      audio.playDelete();
      deleteCircuit(circuit.id);
      pushNotification({
        type: 'info',
        title: '🗑️ 已删除',
        message: `方案「${circuit.name}」已删除`,
      });
    }
  };

  const handleImportClick = (ref: React.RefObject<HTMLInputElement>) => {
    audio.playClick();
    ref.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (
          !data.circuit ||
          !Array.isArray(data.circuit.components) ||
          !Array.isArray(data.circuit.wires)
        ) {
          pushNotification({
            type: 'error',
            title: '❌ 导入失败',
            message: '文件格式不正确：缺少 circuit.components 或 circuit.wires',
          });
          return;
        }

        const newCircuit: SavedCircuit = {
          id: data.id || `circuit-${Date.now()}`,
          name: data.name || `导入方案 ${new Date().toLocaleString()}`,
          levelId: data.levelId,
          createdAt: data.createdAt || Date.now(),
          thumbnail: data.thumbnail || '',
          circuit: data.circuit,
        };

        saveCircuit(newCircuit);
        pushNotification({
          type: 'success',
          title: '✅ 导入成功',
          message: `方案「${newCircuit.name}」已添加到方案库`,
        });
      } catch {
        pushNotification({
          type: 'error',
          title: '❌ 导入失败',
          message: '文件解析失败，请确保是合法的JSON文件',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderLevelLabel = (levelId?: string) => {
    if (!levelId) return null;
    const level = getLevelById(levelId);
    return level ? `第${level.order.toString().padStart(3, '0')}关 · ${level.name}` : '未知关卡';
  };

  return (
    <div className="min-h-screen bg-circuit-bg text-white font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,212,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <style>{`
        .screw-border {
          position: relative;
          border: 2px solid #2d3a5c;
          box-shadow:
            0 0 0 2px #1a1a2e,
            0 0 0 4px #2d3a5c,
            inset 0 0 30px rgba(0,212,255,0.05);
        }
        .screw-border::before,
        .screw-border::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background: #445;
          border-radius: 50%;
          box-shadow: inset 0 0 4px #000;
        }
        .screw-border::before { top: -7px; left: -7px; }
        .screw-border::after { bottom: -7px; right: -7px; }
        .corner-tl { top: -7px; left: -7px; }
        .corner-tr { top: -7px; right: -7px; }
        .corner-bl { bottom: -7px; left: -7px; }
        .corner-br { bottom: -7px; right: -7px; }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileImport}
      />
      <input
        ref={emptyFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileImport}
      />

      <div className="relative z-10 min-h-screen flex flex-col p-4 md:p-8">
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToMenu}
            className="flex items-center gap-2 px-4 py-2 rounded border-2 border-circuit-border
              bg-circuit-board hover:bg-circuit-panel text-white
              transition-all active:translate-y-[2px] font-pixel text-sm"
          >
            <Home size={18} />
            <span>返回主菜单</span>
          </button>

          <h1
            className="font-pixel text-xl md:text-2xl text-circuit-current"
            style={{
              textShadow:
                '0 0 8px rgba(0,212,255,0.6), 0 0 16px rgba(0,212,255,0.3)',
            }}
          >
            📚 我的电路方案
          </h1>

          <button
            onClick={() => handleImportClick(fileInputRef)}
            className="flex items-center gap-2 px-4 py-2 rounded border-2 border-circuit-bulb/60
              bg-circuit-board hover:bg-circuit-bulb/10 text-circuit-bulb
              transition-all active:translate-y-[2px] font-pixel text-sm"
          >
            <Upload size={18} />
            <span>📥 导入JSON</span>
          </button>
        </header>

        <main className="flex-1">
          {sortedCircuits.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="screw-border bg-circuit-panel rounded-lg p-10 max-w-md w-full text-center space-y-6">
                <div className="text-7xl mb-2 opacity-60">📦</div>
                <div>
                  <h2 className="font-pixel text-lg text-circuit-current mb-2">
                    还没有保存的电路方案
                  </h2>
                  <p className="text-gray-400 text-sm">
                    在关卡通关后保存方案，或导入朋友分享的JSON
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={handleGoSandbox}
                    className="flex flex-col items-center gap-2 px-3 py-4 rounded border-2 border-circuit-current/50
                      bg-circuit-board hover:bg-circuit-current/10 text-circuit-current
                      transition-all active:translate-y-[2px] font-pixel text-xs"
                  >
                    <FlaskConical size={24} />
                    <span>去自由模式创建</span>
                  </button>

                  <button
                    onClick={() => handleImportClick(emptyFileInputRef)}
                    className="flex flex-col items-center gap-2 px-3 py-4 rounded border-2 border-circuit-bulb/60
                      bg-circuit-board hover:bg-circuit-bulb/10 text-circuit-bulb
                      transition-all active:translate-y-[2px] font-pixel text-xs"
                  >
                    <FileJson size={24} />
                    <span>导入JSON文件</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCircuits.map((circuit) => (
                <div
                  key={circuit.id}
                  className="screw-border bg-circuit-panel rounded-lg p-5 space-y-4"
                >
                  <div className="space-y-2">
                    <h3 className="font-pixel text-base text-white truncate">
                      {circuit.name}
                    </h3>
                    {circuit.levelId && (
                      <div className="text-xs text-circuit-current/80 flex items-center gap-1">
                        <FolderArchive size={12} />
                        <span>{renderLevelLabel(circuit.levelId)}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(circuit.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400 py-2 border-t border-b border-circuit-border/50">
                    <div className="flex items-center gap-1">
                      <Layers size={14} className="text-circuit-current" />
                      <span>元件数 <span className="text-white font-pixel">{circuit.circuit.components.length}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitBranch size={14} className="text-circuit-bulb" />
                      <span>导线数 <span className="text-white font-pixel">{circuit.circuit.wires.length}</span></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleOpenCircuit(circuit.id)}
                      className="flex flex-col items-center gap-1 px-2 py-3 rounded border-2 border-circuit-current/50
                        bg-circuit-board hover:bg-circuit-current/10 text-circuit-current
                        transition-all active:translate-y-[1px] font-pixel text-xs"
                    >
                      <span className="text-base">🔓</span>
                      <span>打开</span>
                    </button>

                    <button
                      onClick={() => handleExportCircuit(circuit)}
                      className="flex flex-col items-center gap-1 px-2 py-3 rounded border-2 border-purple-500/50
                        bg-circuit-board hover:bg-purple-500/10 text-purple-400
                        transition-all active:translate-y-[1px] font-pixel text-xs"
                    >
                      <Download size={16} />
                      <span>导出</span>
                    </button>

                    <button
                      onClick={() => handleDeleteCircuit(circuit)}
                      className="flex flex-col items-center gap-1 px-2 py-3 rounded border-2 border-circuit-error/50
                        bg-circuit-board hover:bg-circuit-error/10 text-circuit-error
                        transition-all active:translate-y-[1px] font-pixel text-xs"
                    >
                      <Trash2 size={16} />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="mt-6 text-center text-xs text-gray-600">
          <span>共 {sortedCircuits.length} 个方案</span>
        </footer>
      </div>
    </div>
  );
}
