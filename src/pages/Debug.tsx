import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Circle, Trash2, Gauge } from 'lucide-react';
import { useDebugStore } from '@/stores/debugStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGameStore } from '@/stores/gameStore';

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function getLogColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('error') || lower.includes('fail') || lower.includes('critical')) return 'var(--accent-red)';
  if (lower.includes('warn') || lower.includes('caution')) return 'var(--accent-amber)';
  if (lower.includes('success') || lower.includes('complete') || lower.includes('pass')) return 'var(--accent-green)';
  return 'var(--accent-blue)';
}

export default function Debug() {
  const navigate = useNavigate();
  const { logs, fps, isRecording, clearLogs, toggleRecording } = useDebugStore();
  const { debugMode } = useSettingsStore();
  const gameState = useGameStore();

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: '#050E12' }}
    >
      <header
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="font-display text-2xl tracking-wider"
          style={{ color: 'var(--accent-green)' }}
        >
          调试日志
        </h1>
      </header>

      <div
        className="flex items-center gap-3 px-6 py-3"
        style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}
      >
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-all"
          style={{
            border: `1px solid ${isRecording ? 'var(--accent-red)' : 'var(--accent-green)'}`,
            color: isRecording ? 'var(--accent-red)' : 'var(--accent-green)',
            background: isRecording ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 255, 136, 0.1)',
          }}
          onClick={toggleRecording}
        >
          <Circle size={10} fill={isRecording ? 'var(--accent-red)' : 'var(--accent-green)'} />
          {isRecording ? '录制中' : '已暂停'}
        </button>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-all"
          style={{
            border: '1px solid var(--accent-amber)',
            color: 'var(--accent-amber)',
            background: 'rgba(255, 184, 0, 0.1)',
          }}
          onClick={clearLogs}
        >
          <Trash2 size={12} />
          清除日志
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Gauge size={14} style={{ color: 'var(--accent-blue)' }} />
          <span className="font-display text-sm" style={{ color: 'var(--accent-blue)' }}>
            {fps} FPS
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 font-mono text-xs scrollbar-thin" style={{ color: 'var(--text-primary)' }}>
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: 'var(--text-secondary)' }}>暂无日志记录</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {logs.map((log, i) => (
              <div
                key={i}
                className="flex items-start gap-2 py-1.5 px-2 rounded"
                style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
              >
                <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {formatTimestamp(log.timestamp)}
                </span>
                <span
                  className="font-bold min-w-[100px]"
                  style={{ color: getLogColor(log.action), flexShrink: 0 }}
                >
                  [{log.action}]
                </span>
                <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  {log.details}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {debugMode && (
        <div
          className="border-t overflow-y-auto px-6 py-4 font-mono text-[10px] leading-relaxed scrollbar-thin"
          style={{
            borderColor: 'var(--border-color)',
            background: 'rgba(0,0,0,0.5)',
            maxHeight: '30vh',
          }}
        >
          <div
            className="font-body text-xs font-bold mb-2"
            style={{ color: 'var(--accent-amber)' }}
          >
            游戏状态
          </div>
          <pre style={{ color: 'var(--accent-green)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(gameState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
