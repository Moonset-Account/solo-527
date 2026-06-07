'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, Copy, Monitor, SkipForward, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { mockReviewQueue, ReviewQueueItem, mockChannels } from '@/lib/mockData';
import { abnormalTypeLabels, statusLabels, cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  fast_answer: Clock,
  duplicate_submission: Copy,
  device_concentration: Monitor,
  skip_abnormal: SkipForward,
  open_copy: FileText,
};

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setItems(mockReviewQueue);
  }, []);

  const pendingCount = items.filter(i => i.status === 'pending').length;
  
  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.filter(i => i.status === 'pending').length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.filter(i => i.status === 'pending').map(i => i.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchAction = async (action: 'approved' | 'rejected') => {
    if (selectedIds.length === 0) return;
    
    setProcessing(true);
    
    try {
      const res = await fetch('/api/review-queue/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action, reviewer: '调研经理' }),
      });
      
      if (res.ok) {
        setItems(prev => prev.map(item => 
          selectedIds.includes(item.id) 
            ? { ...item, status: action, reviewedAt: new Date().toISOString(), reviewer: '调研经理' }
            : item
        ));
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('批量处理失败', error);
      setItems(prev => prev.map(item => 
        selectedIds.includes(item.id) 
          ? { ...item, status: action, reviewedAt: new Date().toISOString(), reviewer: '调研经理' }
          : item
      ));
      setSelectedIds([]);
    }
    
    setProcessing(false);
  };

  const handleSingleAction = (id: string, action: 'approved' | 'rejected') => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: action, reviewedAt: new Date().toISOString(), reviewer: '调研经理' }
        : item
    ));
  };

  const pendingItems = items.filter(i => i.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar pendingCount={pendingCount} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">复核队列</h1>
          <p className="text-gray-600">审核异常样本，批量通过后更新渠道质量分</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-sm text-gray-500 mt-1">待处理</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600">
              {items.filter(i => i.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">已通过</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-gray-600">
              {items.filter(i => i.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">已拒绝</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-gray-500 mt-1">全部样本</div>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              当前有 <strong>{pendingCount}</strong> 条样本等待复核。请及时处理，未处理样本将影响渠道质量分的更新。
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filter === f 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {f === 'all' ? '全部' : statusLabels[f].label}
                  {f === 'pending' && pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-amber-500 text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  已选择 <strong className="text-blue-600">{selectedIds.length}</strong> 条
                </span>
                <button
                  onClick={() => handleBatchAction('rejected')}
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  批量拒绝
                </button>
                <button
                  onClick={() => handleBatchAction('approved')}
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  批量通过
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredItems.filter(i => i.status === 'pending').length && filteredItems.filter(i => i.status === 'pending').length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">样本ID</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">渠道</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">异常类型</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标记时间</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">审核人</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      {item.status === 'pending' ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelect(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="w-4 h-4 block" />
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{item.sampleId}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{item.channelName}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {item.abnormalTypes.map(type => {
                          const config = abnormalTypeLabels[type];
                          const Icon = iconMap[type];
                          return (
                            <span
                              key={type}
                              className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', config.bgColor, config.color)}
                            >
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{item.markedAt}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        statusLabels[item.status].bgColor,
                        statusLabels[item.status].color
                      )}>
                        {statusLabels[item.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{item.reviewer || '-'}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {item.status === 'pending' && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleSingleAction(item.id, 'rejected')}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="标记无效"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSingleAction(item.id, 'approved')}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="确认有效"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="px-5 py-12 text-center">
              <div className="text-gray-400 text-sm">暂无数据</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
