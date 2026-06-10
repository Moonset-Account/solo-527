'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Plus, Clock, User, FileText, ChevronRight, Filter, Link as LinkIcon } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { getAllExceptions, getExceptionWithLogs, createException, closeException, addExceptionLog } from '@/lib/services/data';
import { formatDate, getExceptionTypeLabel, getExceptionStatusLabel, getExceptionStatusColor } from '@/lib/utils/format';
import type { ExceptionRecord } from '@/lib/types';

export default function ExceptionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [detailData, setDetailData] = useState<ExceptionRecord | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'material_discrepancy',
    impact_scope: '',
    description: '',
  });

  const loadExceptions = async () => {
    const data = await getAllExceptions();
    setExceptions(data);
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await loadExceptions();
      setIsLoading(false);
    };
    initData();
  }, []);

  const filteredExceptions = statusFilter === 'all'
    ? exceptions
    : exceptions.filter(e => e.status === statusFilter);

  const openCount = exceptions.filter(e => e.status !== 'closed').length;
  const closedCount = exceptions.filter(e => e.status === 'closed').length;

  const handleCreateException = async () => {
    if (!formData.title || !formData.impact_scope) return;

    await createException({
      title: formData.title,
      type: formData.type as 'material_discrepancy' | 'budget_overrun' | 'other',
      impact_scope: formData.impact_scope,
    });

    if (formData.description) {
      await addExceptionLog('', 'note', formData.description);
    }

    setIsCreateModalOpen(false);
    setFormData({ title: '', type: 'material_discrepancy', impact_scope: '', description: '' });
    loadExceptions();
  };

  const openDetail = async (exception: ExceptionRecord) => {
    setSelectedException(exception);
    const detail = await getExceptionWithLogs(exception.id);
    setDetailData(detail);
    setIsDetailModalOpen(true);
  };

  const handleCloseException = async () => {
    if (!closeReason.trim()) {
      alert('请填写关闭原因');
      return;
    }

    if (selectedException) {
      await closeException(selectedException.id, closeReason);
    }

    setIsCloseModalOpen(false);
    setCloseReason('');
    setIsDetailModalOpen(false);
    setDetailData(null);
    loadExceptions();
  };

  const handleTraceToOriginal = async (parentId: string) => {
    const original = exceptions.find(e => e.id === parentId);
    if (original) {
      setSelectedException(original);
      const detail = await getExceptionWithLogs(original.id);
      setDetailData(detail);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">异常处理</h1>
          <p className="text-gray-500">管理物资差异、预算超支等异常情况</p>
        </div>
        <Button icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
          登记异常
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">待处理</p>
            <p className="text-3xl font-bold text-red-600 font-serif">{openCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">处理中</p>
            <p className="text-3xl font-bold text-yellow-600 font-serif">
              {exceptions.filter(e => e.status === 'investigating' || e.status === 'handling').length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">已关闭</p>
            <p className="text-3xl font-bold text-green-600 font-serif">{closedCount}</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Select
          icon={Filter}
          className="w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'pending', label: '待处理' },
            { value: 'investigating', label: '调查中' },
            { value: 'handling', label: '处理中' },
            { value: 'closed', label: '已关闭' },
          ]}
        />
        <span className="text-sm text-gray-500">共 {filteredExceptions.length} 条记录</span>
      </div>

      <div className="space-y-4">
        {filteredExceptions.map((exception) => (
          <Card key={exception.id} hover>
            <CardBody>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${
                    exception.type === 'material_discrepancy' ? 'bg-red-100' :
                    exception.type === 'budget_overrun' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${
                      exception.type === 'material_discrepancy' ? 'text-red-600' :
                      exception.type === 'budget_overrun' ? 'text-yellow-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{exception.title}</h3>
                      <Badge className={getExceptionStatusColor(exception.status)}>
                        {getExceptionStatusLabel(exception.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getExceptionTypeLabel(exception.type)}
                      </Badge>
                      {(() => {
                        const parentId = exception.parent_exception_id;
                        if (!parentId) return null;
                        return (
                          <button
                            onClick={() => handleTraceToOriginal(parentId)}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                          >
                            <LinkIcon className="w-3 h-3" />
                            追溯原单
                          </button>
                        );
                      })()}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-500">影响范围：</span>
                        {exception.impact_scope}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        登记于 {formatDate(exception.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        更新于 {formatDate(exception.updated_at)}
                      </div>
                    </div>
                    {exception.close_reason && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm">
                        <p className="text-gray-500 mb-1 font-medium">关闭原因：</p>
                        <p className="text-gray-700">{exception.close_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" icon={ChevronRight} onClick={() => openDetail(exception)}>
                  详情
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="登记异常"
        size="lg"
      >
        <div className="space-y-5">
          <Input
            label="异常标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="请简要描述异常情况"
          />
          <Select
            label="异常类型"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'material_discrepancy', label: '物资差异' },
              { value: 'budget_overrun', label: '预算超支' },
              { value: 'other', label: '其他异常' },
            ]}
          />
          <Textarea
            label="影响范围 *"
            value={formData.impact_scope}
            onChange={(e) => setFormData({ ...formData, impact_scope: e.target.value })}
            placeholder="请详细描述异常影响的范围，例如：影响云南山区3所学校，涉及50名学生，物资价值约5000元"
            rows={3}
          />
          <Textarea
            label="详细描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请详细描述异常发生的经过、发现方式等"
            rows={4}
          />
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              <strong>提示：</strong>异常登记后将自动进入处理流程，请确保影响范围描述准确完整。
              系统将自动保留所有处理记录，便于后续复盘。
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleCreateException}>
              登记异常
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={detailData?.title || '异常详情'}
        size="xl"
      >
        {detailData && (() => {
          const logs = detailData.logs ?? [];
          return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">异常类型</p>
                <Badge variant="outline">{getExceptionTypeLabel(detailData.type)}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">当前状态</p>
                <Badge className={getExceptionStatusColor(detailData.status)}>
                  {getExceptionStatusLabel(detailData.status)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2 font-medium">影响范围</p>
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800">{detailData.impact_scope}</p>
              </div>
            </div>

            {detailData.handling_path && (
              <div>
                <p className="text-sm text-gray-500 mb-2 font-medium">处理路径</p>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-800">{detailData.handling_path}</p>
                </div>
              </div>
            )}

            {detailData.review_notes && (
              <div>
                <p className="text-sm text-gray-500 mb-2 font-medium">复盘备注</p>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-800">{detailData.review_notes}</p>
                </div>
              </div>
            )}

            {detailData.close_reason && (
              <div>
                <p className="text-sm text-gray-500 mb-2 font-medium">关闭原因</p>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-gray-800">{detailData.close_reason}</p>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-4 font-medium">处理日志</p>
                <div className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                  {logs.map((log, index) => (
                    <div key={log.id} className="relative pb-6 last:pb-0">
                      <div className={`absolute left-[-22px] w-4 h-4 rounded-full border-4 ${
                        index === 0 ? 'bg-primary-500 border-primary-200' :
                        index === logs.length - 1 ? 'bg-green-500 border-green-200' :
                        'bg-blue-500 border-blue-200'
                      }`} />
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={log.action_type === 'status_change' ? 'primary' : 'outline'}>
                            {log.action_type === 'status_change' ? '状态变更' :
                             log.action_type === 'note' ? '备注' :
                             log.action_type === 'handling' ? '处理' : '操作'}
                          </Badge>
                          <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                        </div>
                        <p className="text-gray-700">{log.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button variant="ghost" className="flex-1" onClick={() => setIsDetailModalOpen(false)}>
                关闭
              </Button>
              {detailData.status !== 'closed' && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setSelectedException(detailData);
                    setIsCloseModalOpen(true);
                  }}
                >
                  关闭异常
                </Button>
              )}
            </div>
          </div>
        )})()}
      </Modal>

      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="关闭异常"
        size="lg"
      >
        <div className="space-y-5">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              <strong>重要提示：</strong>关闭异常后将无法重新打开，请务必填写完整的关闭原因。
              该原因将被永久保存，用于后续复盘和审计。
            </p>
          </div>
          <Textarea
            label="关闭原因 *"
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            placeholder="请详细说明异常的处理结果、问题根源、改进措施等"
            rows={5}
          />
          <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">建议包含以下内容：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>异常是否完全解决</li>
              <li>问题的根本原因</li>
              <li>采取的改进措施</li>
              <li>经验教训和预防措施</li>
            </ul>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsCloseModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleCloseException}>
              确认关闭
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
