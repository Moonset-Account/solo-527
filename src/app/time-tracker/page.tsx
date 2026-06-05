'use client';

import { useEffect, useState } from 'react';
import { useTimeEntryStore } from '@/stores/useTimeEntryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Play,
  Pause,
  Square,
  Clock,
  Briefcase,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { formatDuration, formatDateTime } from '@/lib/utils';

export default function TimeTrackerPage() {
  const {
    activeTimer,
    entries,
    offlineQueue,
    isOnline,
    isLoading,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    fetchEntries,
    syncOfflineEntries,
    setOnlineStatus,
  } = useTimeEntryStore();

  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer && !activeTimer.endTime) {
      interval = setInterval(() => {
        const start = new Date(activeTimer.startTime).getTime();
        setElapsed(Math.floor((Date.now() - start) / 60000));
      }, 1000);
    } else if (activeTimer?.endTime) {
      setElapsed(activeTimer.durationMinutes);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStart = () => {
    if (!selectedProject) {
      alert('请先选择项目');
      return;
    }
    startTimer(selectedProject, undefined, description);
    setDescription('');
  };

  const handleStop = async () => {
    await stopTimer();
    setElapsed(0);
  };

  const handleSync = () => {
    syncOfflineEntries();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">工时记录</h1>
          <p className="text-slate-500 mt-1">记录您的工作时间，支持离线使用</p>
        </div>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <Wifi className="w-4 h-4" />
              在线
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
              <WifiOff className="w-4 h-4" />
              离线模式
            </div>
          )}
          {offlineQueue.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleSync}>
              <RefreshCw className="w-4 h-4 mr-2" />
              同步 {offlineQueue.length} 条
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            计时器
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeTimer ? (
            <div className="text-center space-y-6">
              <div className="text-6xl font-bold font-display text-primary tabular-nums">
                {Math.floor(elapsed / 60).toString().padStart(2, '0')}:
                {(elapsed % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-slate-500">{activeTimer.description || '工作中...'}</p>
              <div className="flex justify-center gap-3">
                {activeTimer.endTime ? (
                  <Button size="lg" onClick={resumeTimer}>
                    <Play className="w-5 h-5 mr-2" />
                    继续
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" onClick={pauseTimer}>
                    <Pause className="w-5 h-5 mr-2" />
                    暂停
                  </Button>
                )}
                <Button size="lg" variant="destructive" onClick={handleStop}>
                  <Square className="w-5 h-5 mr-2" />
                  完成
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">选择项目</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <option value="">-- 请选择项目 --</option>
                    <option value="demo-1">示例项目 - 官网设计</option>
                    <option value="demo-2">示例项目 - Brand VI</option>
                    <option value="demo-3">示例项目 - 移动App</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">工作内容</label>
                  <Input
                    placeholder="描述您正在做的工作..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <Button size="lg" className="w-full md:w-auto" onClick={handleStart}>
                <Play className="w-5 h-5 mr-2" />
                开始计时
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>历史记录</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            手动录入
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : entries.length > 0 ? (
            <div className="divide-y">
              {entries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {entry.description || '未命名任务'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDateTime(entry.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!entry.synced && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                          待同步
                        </span>
                      )}
                      <span className="font-mono font-medium text-slate-700">
                        {formatDuration(entry.durationMinutes)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">暂无工时记录</p>
              <p className="text-sm text-slate-400 mt-1">点击上方开始计时</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
