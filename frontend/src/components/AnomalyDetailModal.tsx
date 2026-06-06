import { useState, useEffect, useCallback } from 'react';
import { X, Clock, AlertTriangle, FileText, Calendar, Thermometer, MessageSquare, Send } from 'lucide-react';
import type { AnomalyPoint } from '../types';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

interface AnomalyDetailModalProps {
  anomalyId: string | null;
  onClose: () => void;
}

export default function AnomalyDetailModal({ anomalyId, onClose }: AnomalyDetailModalProps) {
  const [anomaly, setAnomaly] = useState<AnomalyPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'alarms' | 'workorders'>('overview');
  const [comment, setComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!anomalyId) return;
    setLoading(true);
    try {
      const data = await apiService.getAnomalyDetail(anomalyId);
      setAnomaly(data);
      setComment(data.comment || '');
    } catch (error) {
      console.error('Failed to fetch anomaly detail:', error);
    } finally {
      setLoading(false);
    }
  }, [anomalyId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSaveComment = async () => {
    if (!anomalyId || !comment.trim()) return;
    setSavingComment(true);
    try {
      await apiService.addAnomalyComment(anomalyId, comment);
      setAnomaly(prev => prev ? { ...prev, comment } : null);
    } catch (error) {
      console.error('Failed to save comment:', error);
    } finally {
      setSavingComment(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <span className="badge-danger">严重异常</span>;
      case 'medium': return <span className="badge-warning">中度异常</span>;
      default: return <span className="badge-info">轻微异常</span>;
    }
  };

  const tabs = [
    { key: 'overview', label: '概览', icon: AlertTriangle },
    { key: 'schedule', label: '课表关联', icon: Calendar },
    { key: 'alarms', label: '告警记录', icon: AlertTriangle },
    { key: 'workorders', label: '工单处理', icon: FileText },
  ];

  if (!anomalyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">能耗异常详情</h3>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm text-slate-400">
                  {anomaly ? dayjs(anomaly.timestamp).format('YYYY-MM-DD HH:mm:ss') : '加载中...'}
                </span>
                {anomaly && getSeverityBadge(anomaly.severity)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-700 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-400 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'schedule' && anomaly?.relatedSchedule?.length ? (
                <span className="badge-info">{anomaly.relatedSchedule.length}</span>
              ) : null}
              {tab.key === 'alarms' && anomaly?.relatedAlarms?.length ? (
                <span className="badge-warning">{anomaly.relatedAlarms.length}</span>
              ) : null}
              {tab.key === 'workorders' && anomaly?.relatedWorkorders?.length ? (
                <span className="badge-info">{anomaly.relatedWorkorders.length}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(85vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : anomaly ? (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass-card p-4">
                      <p className="text-sm text-slate-400 mb-1">实际能耗</p>
                      <p className="text-2xl font-bold text-white">{anomaly.value.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">kWh</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-sm text-slate-400 mb-1">预期能耗</p>
                      <p className="text-2xl font-bold text-slate-300">{anomaly.expectedValue?.toFixed(2) || '-'}</p>
                      <p className="text-xs text-slate-500">kWh</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-sm text-slate-400 mb-1">偏差值</p>
                      <p className={`text-2xl font-bold ${anomaly.deviation && anomaly.deviation > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {anomaly.deviation ? `${(anomaly.deviation * 100).toFixed(1)}%` : '-'}
                      </p>
                      <p className="text-xs text-slate-500">偏离均值</p>
                    </div>
                  </div>

                  <div className="glass-card p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">可能原因分析</h4>
                    <ul className="space-y-2">
                      {anomaly.possibleCauses.map((cause, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                          <span className="text-sm text-slate-300">{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {anomaly.acStrategy && (
                    <div className="glass-card p-4">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-blue-400" />
                        空调策略记录
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">目标温度</p>
                          <p className="text-white font-medium">{anomaly.acStrategy.targetTemp}°C</p>
                        </div>
                        <div>
                          <p className="text-slate-400">运行模式</p>
                          <p className="text-white font-medium">{anomaly.acStrategy.mode === 'cool' ? '制冷' : '自动'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">风速</p>
                          <p className="text-white font-medium">{anomaly.acStrategy.fanSpeed}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="glass-card p-4">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      异常注释
                    </h4>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="输入异常原因分析和处理备注..."
                      className="w-full h-24 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSaveComment}
                        disabled={savingComment || !comment.trim()}
                        className="btn-primary flex items-center gap-2 text-sm px-3 py-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {savingComment ? '保存中...' : '保存注释'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div>
                  {anomaly.relatedSchedule?.length ? (
                    <div className="space-y-3">
                      {anomaly.relatedSchedule.map((s) => (
                        <div key={s.id} className="glass-card p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-white">{s.courseName}</h5>
                              <p className="text-sm text-slate-400 mt-1">
                                {dayjs(s.startTime).format('HH:mm')} - {dayjs(s.endTime).format('HH:mm')}
                              </p>
                            </div>
                            <span className={s.weekType === 'exam' ? 'badge-warning' : 'badge-info'}>
                              {s.weekType === 'exam' ? '考试周' : '教学周'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                            <span>学生人数: {s.studentCount}人</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>该时段无关联课程安排</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'alarms' && (
                <div>
                  {anomaly.relatedAlarms?.length ? (
                    <div className="space-y-3">
                      {anomaly.relatedAlarms.map((a) => (
                        <div key={a.id} className="glass-card p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                a.level === 'critical' ? 'bg-red-500/20' : a.level === 'warning' ? 'bg-orange-500/20' : 'bg-blue-500/20'
                              }`}>
                                <AlertTriangle className={`w-4 h-4 ${
                                  a.level === 'critical' ? 'text-red-400' : a.level === 'warning' ? 'text-orange-400' : 'text-blue-400'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-white">{a.message}</p>
                                <p className="text-sm text-slate-400 mt-1">
                                  设备: {a.deviceName} | {dayjs(a.timestamp).format('YYYY-MM-DD HH:mm')}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              a.status === 'resolved' ? 'badge-success' :
                              a.status === 'acknowledged' ? 'badge-info' : 'badge-warning'
                            }`}>
                              {a.status === 'resolved' ? '已解决' : a.status === 'acknowledged' ? '已确认' : '待处理'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>该时段无关联告警记录</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'workorders' && (
                <div>
                  {anomaly.relatedWorkorders?.length ? (
                    <div className="space-y-3">
                      {anomaly.relatedWorkorders.map((w) => (
                        <div key={w.id} className="glass-card p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-white">{w.title}</h5>
                              <p className="text-sm text-slate-400 mt-1">{w.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                w.status === 'completed' ? 'badge-success' :
                                w.status === 'processing' ? 'badge-info' : 'badge-warning'
                              }`}>
                                {w.status === 'completed' ? '已完成' : w.status === 'processing' ? '处理中' : '待处理'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                w.priority === 'high' ? 'badge-danger' :
                                w.priority === 'medium' ? 'badge-warning' : 'badge-info'
                              }`}>
                                {w.priority === 'high' ? '高优先级' : w.priority === 'medium' ? '中优先级' : '低优先级'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                            <span>负责人: {w.assignee || '未分配'}</span>
                            <span>创建时间: {dayjs(w.createdAt).format('MM-DD HH:mm')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>该时段无关联工单记录</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
