import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Volume2, Bug, ChevronDown, ChevronUp, Trash2, AlertTriangle, Info, Zap, Activity } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDebugStore } from '@/stores/debugStore'
import type { DebugLogEntry } from '@/types/game'

const LOG_ICONS: Record<DebugLogEntry['type'], typeof Info> = {
  event: AlertTriangle,
  task: Zap,
  resource: Activity,
  system: Info,
  error: AlertTriangle,
}

const LOG_COLORS: Record<DebugLogEntry['type'], string> = {
  event: '#ffc107',
  task: '#ff6b35',
  resource: '#00c9a7',
  system: '#8899aa',
  error: '#ef4444',
}

export default function Settings() {
  const navigate = useNavigate()
  const { masterVolume, sfxVolume, musicVolume, debugMode, setMasterVolume, setSfxVolume, setMusicVolume, setDebugMode } = useSettingsStore()
  const { logs, clearLogs } = useDebugStore()
  const [logsExpanded, setLogsExpanded] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(15, 25, 35, 0.85)' }}>
      <div className="w-full max-w-md mx-4 rounded-xl overflow-hidden" style={{ background: '#1a2332', border: '1px solid #2d4052' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2d4052' }}>
          <h2 className="font-display text-lg font-bold" style={{ color: '#e8edf2' }}>设置</h2>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: '#8899aa' }}
          >
            <ChevronLeft size={16} />
            返回
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: '#e8edf2' }}>
                <Volume2 size={16} style={{ color: '#8899aa' }} />
                主音量
              </label>
              <span className="text-xs font-mono" style={{ color: '#8899aa' }}>{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #ff6b35 ${masterVolume * 100}%, #2d4052 ${masterVolume * 100}%)` }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: '#e8edf2' }}>
                <Volume2 size={16} style={{ color: '#8899aa' }} />
                音效
              </label>
              <span className="text-xs font-mono" style={{ color: '#8899aa' }}>{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sfxVolume}
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #00c9a7 ${sfxVolume * 100}%, #2d4052 ${sfxVolume * 100}%)` }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: '#e8edf2' }}>
                <Volume2 size={16} style={{ color: '#8899aa' }} />
                音乐
              </label>
              <span className="text-xs font-mono" style={{ color: '#8899aa' }}>{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #60a5fa ${musicVolume * 100}%, #2d4052 ${musicVolume * 100}%)` }}
            />
          </div>

          <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #2d4052', borderBottom: '1px solid #2d4052' }}>
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: '#e8edf2' }}>
              <Bug size={16} style={{ color: '#8899aa' }} />
              调试模式
            </label>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="relative w-10 h-5 rounded-full transition-colors duration-200"
              style={{ background: debugMode ? '#ff6b35' : '#2d4052' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                style={{
                  background: '#e8edf2',
                  left: debugMode ? '22px' : '2px',
                }}
              />
            </button>
          </div>

          {debugMode && (
            <div>
              <button
                onClick={() => setLogsExpanded(!logsExpanded)}
                className="flex items-center justify-between w-full py-2 text-sm font-medium transition-colors"
                style={{ color: '#e8edf2' }}
              >
                <span>调试日志 ({logs.length})</span>
                {logsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {logsExpanded && (
                <div className="mt-2 max-h-48 overflow-y-auto scrollbar-thin rounded-lg p-2"
                  style={{ background: '#0f1923' }}>
                  {logs.length === 0 ? (
                    <p className="text-xs text-center py-3" style={{ color: '#4a5568' }}>暂无日志</p>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, i) => {
                        const Icon = LOG_ICONS[log.type]
                        const color = LOG_COLORS[log.type]
                        return (
                          <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded text-xs"
                            style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <Icon size={12} className="flex-shrink-0 mt-0.5" style={{ color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono" style={{ color: '#4a5568' }}>
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="truncate" style={{ color: '#e8edf2' }}>{log.message}</span>
                              </div>
                              {log.detail && (
                                <p className="mt-0.5 truncate" style={{ color: '#8899aa' }}>{log.detail}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {logs.length > 0 && (
                    <button
                      onClick={clearLogs}
                      className="flex items-center gap-1 mx-auto mt-2 px-3 py-1 rounded text-xs transition-colors"
                      style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                    >
                      <Trash2 size={12} />
                      清除日志
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
