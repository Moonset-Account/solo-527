import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Filter, User } from 'lucide-react';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store';
import { notificationApi } from '@/api';
import { Notification, NotificationType } from '@/types';
import { cn, formatDateTime, getStatusText } from '@/utils';

export default function NotificationFailures() {
  const [loading, setLoading] = useState(false);
  const [failures, setFailures] = useState<Notification[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();
  const user = useAppStore((state) => state.user);

  const loadFailures = async () => {
    setLoading(true);
    try {
      const params: { type?: string } = {};
      if (typeFilter) params.type = typeFilter;

      const result = await notificationApi.getFailures({ ...params, page, size: 10 });
      setFailures(result.content);
      setTotal(result.total);
    } catch (error) {
      showToast({ type: 'error', message: '加载失败记录失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailures();
  }, [page, typeFilter]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const result = await notificationApi.retryFailure(id);
      if (result.success) {
        showToast({ type: 'success', message: '重试成功，通知已发送' });
        setFailures((prev) => prev.filter((f) => f.id !== id));
        setTotal((prev) => prev - 1);
      } else {
        showToast({ type: 'error', message: '重试失败，请稍后再试' });
        setFailures((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, retryCount: f.retryCount + 1 } : f
          )
        );
      }
    } catch (error) {
      showToast({ type: 'error', message: '重试失败' });
    } finally {
      setRetryingId(null);
    }
  };

  const getReceiverName = (userId: string) => {
    const userMap: Record<string, string> = {
      admin001: '系统管理员',
      teacher001: '张老师',
      principal001: '李负责人',
      researcher001: '王研究员',
      researcher002: '刘研究员',
    };
    return userMap[userId] || userId;
  };

  const getTypeBadge = (type: NotificationType) => {
    const variantMap: Record<NotificationType, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
      APPLICATION: 'primary',
      SCHEDULE: 'warning',
      CONFLICT: 'danger',
      COMPLIANCE: 'success',
      SYSTEM: 'neutral',
    };
    return (
      <Badge variant={variantMap[type]}>
        {getStatusText(type)}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'id',
      title: '通知ID',
      dataIndex: 'id' as keyof Notification,
      width: 120,
      render: (record: Notification) => (
        <span className="font-mono text-sm">{record.id}</span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: 100,
      render: (record: Notification) => getTypeBadge(record.type),
    },
    {
      key: 'receiver',
      title: '接收人',
      width: 120,
      render: (record: Notification) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neutral-400" />
          <span>{getReceiverName(record.userId)}</span>
        </div>
      ),
    },
    {
      key: 'failureReason',
      title: '失败原因',
      dataIndex: 'failureReason' as keyof Notification,
      render: (record: Notification) => (
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-danger-600">{record.failureReason || '未知错误'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: '发送时间',
      width: 160,
      render: (record: Notification) => formatDateTime(record.createdAt),
    },
    {
      key: 'retryCount',
      title: '重试次数',
      width: 100,
      align: 'center' as const,
      render: (record: Notification) => (
        <span
          className={cn(
            'font-medium',
            record.retryCount >= 3 ? 'text-danger-600' : 'text-neutral-700'
          )}
        >
          {record.retryCount}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      align: 'right' as const,
      render: (record: Notification) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant={record.retryCount >= 3 ? 'secondary' : 'primary'}
            onClick={() => handleRetry(record.id)}
            loading={retryingId === record.id}
            disabled={record.retryCount >= 3}
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </Button>
        </div>
      ),
    },
  ];

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-danger-400" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">无权限访问</h2>
          <p className="text-neutral-500">该页面仅限管理员访问</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-danger-500" />
          发送失败记录
        </h1>
        <p className="text-neutral-500 mt-1">查看和重试发送失败的通知</p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-600">通知类型：</span>
        </div>
        <div className="w-40">
          <Select
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v as string);
              setPage(1);
            }}
            options={[
              { value: '', label: '全部类型' },
              { value: 'APPLICATION', label: '申请通知' },
              { value: 'SCHEDULE', label: '排期通知' },
              { value: 'CONFLICT', label: '冲突通知' },
              { value: 'COMPLIANCE', label: '合规通知' },
              { value: 'SYSTEM', label: '系统通知' },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={failures}
        loading={loading}
        rowKey={(record: Notification) => record.id}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (p) => setPage(p),
        }}
      />
    </div>
  );
}
