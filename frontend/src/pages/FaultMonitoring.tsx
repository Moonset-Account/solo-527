import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, FileText, Server, Clock, CheckCircle, Play, Circle } from 'lucide-react';
import { apiService } from '../services/api';
import type { AlarmItem, WorkorderItem, Device } from '../types';
import dayjs from 'dayjs';

export default function FaultMonitoring() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [workorders, setWorkorders] = useState<WorkorderItem[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeTab, setActiveTab] = useState<'alarms' | 'workorders' | 'devices'>('alarms');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alarmData, workorderData, deviceData] = await Promise.all([
        apiService.getAlarms({ limit: 50 }),
        apiService.getWorkorders({ limit: 50 }),
        apiService.getDeviceStatus(),
      ]);
      setAlarms(alarmData);
      setWorkorders(workorderData);
      setDevices(deviceData);
    } catch (error) {
      console.error('Failed to fetch fault data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warning': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      default: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing':
      case 'acknowledged':
        return <Play className="w-4 h-4 text-blue-400" />;
      default:
        return <Circle className="w-4 h-4 text-orange-400" />;
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-500/20';
      case 'offline': return 'text-red-400 bg-red-500/20';
      case 'maintenance': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const tabs = [
    { key: 'alarms', label: '告警列表', icon: AlertTriangle, count: alarms.length },
    { key: 'workorders', label: '工单管理', icon: FileText, count: workorders.length },
    { key: 'devices', label: '设备状态', icon: Server, count: devices.length },
  ];

  const stats = {
    criticalAlarms: alarms.filter(a => a.level === 'critical').length,
    pendingWorkorders: workorders.filter(w => w.status === 'pending').length,
    offlineDevices: devices.filter(d => d.status === 'offline').length,
    onlineDevices: devices.filter(d => d.status === 'online').length,
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.criticalAlarms}</p>
                <p className="text-xs text-slate-400">严重告警</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pendingWorkorders}</p>
                <p className="text-xs text-slate-400">待处理工单</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.offlineDevices}</p>
                <p className="text-xs text-slate-400">离线设备</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.onlineDevices}</p>
                <p className="text-xs text-slate-400">在线设备</p>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="flex border-b border-slate-700 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-400 border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeTab === 'alarms' ? (
              <div className="space-y-2">
                {alarms.map((alarm) => (
                  <div key={alarm.id} className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${getLevelColor(alarm.level)}`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{alarm.message}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                            <span>{alarm.deviceName}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {dayjs(alarm.timestamp).format('YYYY-MM-DD HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(alarm.status)}
                        <span className="text-xs text-slate-400">
                          {alarm.status === 'resolved' ? '已解决' : alarm.status === 'acknowledged' ? '已确认' : '待处理'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'workorders' ? (
              <div className="space-y-2">
                {workorders.map((wo) => (
                  <div key={wo.id} className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{wo.title}</p>
                          <p className="text-sm text-slate-400 mt-1 line-clamp-1">{wo.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>负责人: {wo.assignee || '未分配'}</span>
                            <span>创建: {dayjs(wo.createdAt).format('MM-DD HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          wo.priority === 'high' ? 'badge-danger' : wo.priority === 'medium' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {wo.priority === 'high' ? '高优' : wo.priority === 'medium' ? '中优' : '低优'}
                        </span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(wo.status)}
                          <span className="text-xs text-slate-400">
                            {wo.status === 'completed' ? '已完成' : wo.status === 'processing' ? '处理中' : '待处理'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {devices.map((device) => (
                  <div key={device.id} className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getDeviceStatusColor(device.status)}`}>
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{device.name}</p>
                          <p className="text-xs text-slate-500">{device.type}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDeviceStatusColor(device.status)}`}>
                        {device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '维护中'}
                      </span>
                    </div>
                    {device.lastSeen && (
                      <p className="text-xs text-slate-500 mt-2">
                        最后在线: {dayjs(device.lastSeen).format('MM-DD HH:mm')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
