import { useState } from 'react';
import { reviewApi } from '../services/reviewApi';
import type { OperationLog, AdjustmentRecord, MoldRecord, QCResult } from '../types';
import dayjs from 'dayjs';

const Review = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'adjustments' | 'mold' | 'qc'>('logs');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [moduleFilter, setModuleFilter] = useState('');
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [moldRecords, setMoldRecords] = useState<MoldRecord[]>([]);
  const [qcResults, setQCResults] = useState<QCResult[]>([]);
  const [searchEntityId, setSearchEntityId] = useState('');
  const [searchEntityType, setSearchEntityType] = useState('WorkOrder');
  const [searchMoldId, setSearchMoldId] = useState('');
  const [searchWorkOrderId, setSearchWorkOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadOperationLogs = async () => {
    try {
      setLoading(true);
      const data = await reviewApi.getOperationLogs(
        startDate,
        endDate,
        moduleFilter || undefined
      );
      setLogs(data);
    } catch (err) {
      console.error('加载操作日志失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdjustmentHistory = async () => {
    if (!searchEntityId) return;
    try {
      setLoading(true);
      const data = await reviewApi.getAdjustmentHistory(searchEntityType, searchEntityId);
      setAdjustments(data);
    } catch (err) {
      console.error('加载调整记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoldHistory = async () => {
    if (!searchMoldId) return;
    try {
      setLoading(true);
      const data = await reviewApi.getMoldHistory(searchMoldId);
      setMoldRecords(data);
    } catch (err) {
      console.error('加载模具记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQCHistory = async () => {
    if (!searchWorkOrderId) return;
    try {
      setLoading(true);
      const data = await reviewApi.getQCHistory(searchWorkOrderId);
      setQCResults(data);
    } catch (err) {
      console.error('加载质检记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'logs', label: '操作日志' },
    { key: 'adjustments', label: '调整记录' },
    { key: 'mold', label: '模具记录' },
    { key: 'qc', label: '质检结果' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">复盘追溯</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">全部模块</option>
                  <option value="Equipment">设备</option>
                  <option value="ProcessStep">工序</option>
                  <option value="Downtime">停机</option>
                  <option value="WorkReport">报工</option>
                </select>
                <button
                  onClick={loadOperationLogs}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
                >
                  查询
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">加载中...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">模块</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">详情</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">{log.module}</td>
                          <td className="px-4 py-3 text-sm font-medium">{log.action}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{log.username || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {log.detail || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {log.isDowntimeRelated ? (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                停机相关
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                普通
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                            点击查询按钮获取数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'adjustments' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <select
                  value={searchEntityType}
                  onChange={(e) => setSearchEntityType(e.target.value)}
                  className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="WorkOrder">工单</option>
                  <option value="Equipment">设备</option>
                  <option value="Mold">模具</option>
                </select>
                <input
                  type="text"
                  value={searchEntityId}
                  onChange={(e) => setSearchEntityId(e.target.value)}
                  placeholder="输入实体ID"
                  className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary flex-1"
                />
                <button
                  onClick={loadAdjustmentHistory}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
                >
                  查询
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">加载中...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">字段</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">原值</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">新值</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {adjustments.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(record.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{record.fieldName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{record.previousValue || '-'}</td>
                          <td className="px-4 py-3 text-sm text-green-600">{record.newValue}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{record.reason || '-'}</td>
                          <td className="px-4 py-3 text-sm">{record.operatorName}</td>
                        </tr>
                      ))}
                      {adjustments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                            暂无调整记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mold' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchMoldId}
                  onChange={(e) => setSearchMoldId(e.target.value)}
                  placeholder="输入模具ID"
                  className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary flex-1"
                />
                <button
                  onClick={loadMoldHistory}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
                >
                  查询
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">加载中...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">原值</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">新值</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {moldRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(record.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{record.recordType}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{record.previousValue || '-'}</td>
                          <td className="px-4 py-3 text-sm text-green-600">{record.newValue}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{record.description || '-'}</td>
                          <td className="px-4 py-3 text-sm">{record.equipmentName || '-'}</td>
                        </tr>
                      ))}
                      {moldRecords.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                            暂无模具记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qc' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchWorkOrderId}
                  onChange={(e) => setSearchWorkOrderId(e.target.value)}
                  placeholder="输入工单ID"
                  className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary flex-1"
                />
                <button
                  onClick={loadQCHistory}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
                >
                  查询
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">加载中...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工序</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">结果</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">抽样数</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">合格</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">不合格</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">检验员</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {qcResults.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(result.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">{result.stepName}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              result.result === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {result.result === 'Pass' ? '合格' : '不合格'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">{result.sampleSize}</td>
                          <td className="px-4 py-3 text-sm text-right text-green-600">{result.passCount}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-500">{result.failCount}</td>
                          <td className="px-4 py-3 text-sm">{result.inspectorName}</td>
                        </tr>
                      ))}
                      {qcResults.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                            暂无质检记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Review;
