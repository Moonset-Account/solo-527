import { useState, useEffect } from 'react';
import { AlertTriangle, Eye, CheckCircle } from 'lucide-react';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import StatusTag from '@/components/ui/StatusTag';
import { useToast } from '@/components/ui/Toast';
import { scheduleApi } from '@/api';
import { ScheduleConflict } from '@/types';
import { formatDateTime, getStatusText } from '@/utils';

export default function ScheduleConflicts() {
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [resolveModal, setResolveModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ScheduleConflict | null>(null);
  const [resolution, setResolution] = useState('');
  const [remark, setRemark] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const result = await scheduleApi.getConflicts({ page, size: 10 });
      setConflicts(result.content);
      setTotal(result.total);
    } catch (error) {
      showToast({ type: 'error', message: '加载冲突列表失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, [page]);

  const handleViewDetail = (conflict: ScheduleConflict) => {
    setSelectedConflict(conflict);
    setDetailModal(true);
  };

  const handleResolve = (conflict: ScheduleConflict) => {
    setSelectedConflict(conflict);
    setResolution('');
    setRemark('');
    setResolveModal(true);
  };

  const confirmResolve = async () => {
    if (!selectedConflict || !resolution) {
      showToast({ type: 'warning', message: '请选择解决方案' });
      return;
    }
    try {
      await scheduleApi.resolveConflict(selectedConflict.id, {
        resolution: `${resolution}: ${remark}`,
      });
      showToast({ type: 'success', message: '冲突已解决' });
      setResolveModal(false);
      loadConflicts();
    } catch (error) {
      showToast({ type: 'error', message: '解决冲突失败' });
    }
  };

  const getConflictTypeBadge = (type: string) => {
    const variantMap: Record<string, 'danger' | 'warning' | 'primary'> = {
      INVENTORY: 'danger',
      TIME_OVERLAP: 'warning',
      DEVICE: 'primary',
    };
    return <Badge variant={variantMap[type] || 'neutral'}>{getStatusText(type)}</Badge>;
  };

  const columns = [
    {
      key: 'id',
      title: '冲突编号',
      dataIndex: 'id' as keyof ScheduleConflict,
      width: 120,
      render: (record: ScheduleConflict) => (
        <span className="font-mono text-sm">{record.id}</span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type' as keyof ScheduleConflict,
      width: 120,
      render: (record: ScheduleConflict) => getConflictTypeBadge(record.type),
    },
    {
      key: 'reagent',
      title: '涉及试剂',
      render: (record: ScheduleConflict) => (
        <div>
          <p className="text-sm">{record.schedule1Info?.reagentName || '-'}</p>
          {record.schedule2Info && record.schedule2Info.reagentName !== record.schedule1Info?.reagentName && (
            <p className="text-xs text-neutral-500">{record.schedule2Info.reagentName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'time',
      title: '冲突时间',
      render: (record: ScheduleConflict) => (
        <div className="text-sm">
          <p>{formatDateTime(record.schedule1Info?.startTime)}</p>
          {record.schedule2Info && (
            <p className="text-xs text-neutral-500">{formatDateTime(record.schedule2Info?.startTime)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof ScheduleConflict,
      width: 100,
      render: (record: ScheduleConflict) => <StatusTag status={record.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: 160,
      align: 'right' as const,
      render: (record: ScheduleConflict) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleViewDetail(record)}>
            <Eye className="w-4 h-4" />
            详情
          </Button>
          {record.status === 'OPEN' && (
            <Button size="sm" onClick={() => handleResolve(record)}>
              <CheckCircle className="w-4 h-4" />
              解决
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-warning-500" />
          排期冲突处理
        </h1>
        <p className="text-neutral-500 mt-1">查看和处理试剂使用排期冲突</p>
      </div>

      <Table
        columns={columns}
        data={conflicts}
        loading={loading}
        rowKey={(record: ScheduleConflict) => record.id}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (p) => setPage(p),
        }}
      />

      <Modal
        open={detailModal}
        onClose={() => setDetailModal(false)}
        title="冲突详情"
        width={600}
      >
        {selectedConflict && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={selectedConflict.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                {selectedConflict.severity === 'CRITICAL' ? '严重' : '警告'}
              </Badge>
              <StatusTag status={selectedConflict.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">冲突编号</p>
                <p className="font-medium">{selectedConflict.id}</p>
              </div>
              <div>
                <p className="text-neutral-500">冲突类型</p>
                <p className="font-medium">{getStatusText(selectedConflict.type)}</p>
              </div>
              <div>
                <p className="text-neutral-500">创建时间</p>
                <p>{formatDateTime(selectedConflict.createdAt)}</p>
              </div>
              {selectedConflict.resolvedAt && (
                <div>
                  <p className="text-neutral-500">解决时间</p>
                  <p>{formatDateTime(selectedConflict.resolvedAt)}</p>
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">涉及排期</h4>
              <div className="space-y-3">
                {selectedConflict.schedule1Info && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="font-medium">{selectedConflict.schedule1Info.reagentName}</p>
                    <p className="text-sm text-neutral-500">
                      {formatDateTime(selectedConflict.schedule1Info.startTime)} - {formatDateTime(selectedConflict.schedule1Info.endTime)}
                    </p>
                    <p className="text-sm text-neutral-500">申请人：{selectedConflict.schedule1Info.applicantName}</p>
                  </div>
                )}
                {selectedConflict.schedule2Info && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="font-medium">{selectedConflict.schedule2Info.reagentName}</p>
                    <p className="text-sm text-neutral-500">
                      {formatDateTime(selectedConflict.schedule2Info.startTime)} - {formatDateTime(selectedConflict.schedule2Info.endTime)}
                    </p>
                    <p className="text-sm text-neutral-500">申请人：{selectedConflict.schedule2Info.applicantName}</p>
                  </div>
                )}
              </div>
            </div>
            {selectedConflict.resolution && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">解决方案</h4>
                <p className="text-sm text-neutral-600">{selectedConflict.resolution}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={resolveModal}
        onClose={() => setResolveModal(false)}
        title="解决冲突"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResolveModal(false)}>
              取消
            </Button>
            <Button onClick={confirmResolve}>确认解决</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              解决方案
            </label>
            <Select
              value={resolution}
              onChange={(v) => setResolution(v as string)}
              options={[
                { value: 'ADJUST_TIME', label: '调整时间' },
                { value: 'CHANGE_REAGENT', label: '更换试剂' },
                { value: 'CANCEL_APPLICATION', label: '取消申请' },
              ]}
              placeholder="请选择解决方案"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              备注说明
            </label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入解决说明..."
              rows={4}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
