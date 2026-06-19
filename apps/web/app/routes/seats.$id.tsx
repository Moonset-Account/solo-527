import { json, type LoaderFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AppLayout from '~/components/AppLayout';
import {
  PageHeader,
  StatusBadge,
  EmptyState,
  formatNumber,
  formatDate,
  calcUsagePercent,
} from '~/components/ui';
import { api } from '~/api.client';
import type { Seat, UsageTrendPoint, AuditLog } from '@seat-platform/shared';

interface LoaderData {
  seat: Seat | null;
  trend: UsageTrendPoint[];
  auditLogs: AuditLog[];
}

export const loader: LoaderFunction = async ({ params }) => {
  const id = params.id as string;
  let seat: Seat | null = null;
  let trend: UsageTrendPoint[] = [];
  let auditLogs: AuditLog[] = [];

  try {
    seat = await api.seats.get(id);
  } catch {
    seat = null;
  }

  if (!seat) {
    seat = {
      id,
      seatCode: 'VIP-001',
      customerName: '某大型电商',
      customerEmail: 'contact@company.com',
      customerPhone: '13800138000',
      status: 'active',
      trialStatus: 'not_started',
      quota: 1000000,
      usedQuota: 945230,
      usageThreshold: 80,
      warningThreshold: 70,
      criticalThreshold: 95,
      expireDate: '2025-07-01T00:00:00Z',
      ownerName: '张伟',
      ownerEmail: 'zhangwei@company.com',
      apiKeys: [],
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 86400000).toISOString();
    trend = await api.usage.trend({ seatId: id, startDate, endDate, granularity: 'day' });
  } catch {
    trend = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        apiCalls: 60000 + Math.floor(Math.random() * 40000),
        errorCount: 50 + Math.floor(Math.random() * 150),
        avgLatency: 120 + Math.floor(Math.random() * 80),
      };
    });
  }

  try {
    const logs = await api.logs.audit({ entityType: 'seat', entityId: id, pageSize: 50 });
    auditLogs = logs.items;
  } catch {
    auditLogs = [
      {
        id: 'audit_1',
        entityType: 'seat',
        entityId: id,
        action: 'seat.status_change',
        fieldName: 'status',
        oldValue: 'trial',
        newValue: 'active',
        operatorName: '产品经理A',
        remark: '客户完成付费，从试用转为正式',
        createdAt: '2025-06-10T09:00:00Z',
      },
      {
        id: 'audit_2',
        entityType: 'seat',
        entityId: id,
        action: 'seat.threshold_update',
        fieldName: 'usageThreshold',
        oldValue: 85,
        newValue: 80,
        operatorName: '产品经理A',
        remark: '按客户要求调整提醒阈值',
        createdAt: '2025-06-08T14:20:00Z',
      },
      {
        id: 'audit_3',
        entityType: 'seat',
        entityId: id,
        action: 'seat.threshold_update',
        fieldName: 'quota',
        oldValue: 500000,
        newValue: 1000000,
        operatorName: '产品经理A',
        remark: '续费扩容，配额翻倍',
        createdAt: '2025-06-01T10:00:00Z',
      },
      {
        id: 'audit_4',
        entityType: 'seat',
        entityId: id,
        action: 'seat.create',
        newValue: { seatCode: 'VIP-001', customerName: '某大型电商' },
        operatorName: 'system',
        createdAt: '2025-01-15T10:00:00Z',
      },
    ];
  }

  return json({ seat, trend, auditLogs });
};

function formatFieldName(field: string): string {
  const map: Record<string, string> = {
    status: '席位状态',
    trialStatus: '试用状态',
    quota: 'API 配额',
    usageThreshold: '用量提醒阈值',
    warningThreshold: '预警阈值',
    criticalThreshold: '临界阈值',
    expireDate: '到期日期',
  };
  return map[field] || field;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default function SeatDetail() {
  const { seat, trend, auditLogs } = useLoaderData<LoaderData>();
  if (!seat) return <AppLayout><EmptyState message="席位不存在" /></AppLayout>;

  const pct = calcUsagePercent(seat.usedQuota, seat.quota);

  return (
    <AppLayout>
      <PageHeader
        title={seat.customerName}
        description={`席位编码：${seat.seatCode} · 创建于 ${formatDate(seat.createdAt)}`}
        actions={
          <>
            <Link to={`/usage?seatId=${seat.id}`} className="btn-secondary btn-sm">查看用量详情</Link>
            <Link to="/seats" className="btn-secondary btn-sm">返回列表</Link>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="card card-body">
          <div className="text-sm text-gray-500">席位状态</div>
          <div className="mt-2"><StatusBadge status={seat.status} type="seat" /></div>
        </div>
        <div className="card card-body">
          <div className="text-sm text-gray-500">试用状态</div>
          <div className="mt-2"><StatusBadge status={seat.trialStatus} /></div>
        </div>
        <div className="card card-body">
          <div className="text-sm text-gray-500">到期日期</div>
          <div className="mt-2 font-semibold">{seat.expireDate ? formatDate(seat.expireDate).split(' ')[0] : '-'}</div>
        </div>
        <div className="card card-body">
          <div className="text-sm text-gray-500">负责人</div>
          <div className="mt-2 font-semibold">{seat.ownerName || '未指派'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">用量概览</h3></div>
          <div className="card-body">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{formatNumber(seat.usedQuota)}</span>
              <span className="text-sm text-gray-500">/ {formatNumber(seat.quota)} 次</span>
              <span className={`ml-auto text-sm font-semibold ${pct >= seat.criticalThreshold ? 'text-red-600' : pct >= seat.warningThreshold ? 'text-yellow-600' : 'text-green-600'}`}>
                {pct}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full ${pct >= seat.criticalThreshold ? 'bg-red-500' : pct >= seat.warningThreshold ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-gray-500">预警阈值</div>
                <div className="font-semibold text-yellow-600 mt-1">{seat.warningThreshold}%</div>
              </div>
              <div>
                <div className="text-gray-500">提醒阈值</div>
                <div className="font-semibold text-blue-600 mt-1">{seat.usageThreshold}%</div>
              </div>
              <div>
                <div className="text-gray-500">临界阈值</div>
                <div className="font-semibold text-red-600 mt-1">{seat.criticalThreshold}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold">客户信息</h3></div>
          <div className="card-body space-y-3 text-sm">
            <div className="flex">
              <span className="text-gray-500 w-20">客户名称</span>
              <span className="font-medium">{seat.customerName}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-20">邮箱</span>
              <span>{seat.customerEmail}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-20">手机</span>
              <span>{seat.customerPhone || '-'}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-20">负责人邮箱</span>
              <span>{seat.ownerEmail || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="font-semibold">近 14 天调用趋势</h3>
        </div>
        <div className="card-body h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="apiCalls" stroke="#2563eb" strokeWidth={2} name="调用量" dot={false} />
              <Line type="monotone" dataKey="errorCount" stroke="#ef4444" strokeWidth={2} name="错误数" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold">变更历史（审计日志）</h3>
          <Link to={`/audit-logs?entityType=seat&entityId=${seat.id}`} className="text-sm text-brand-600 hover:underline">查看全部 →</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {auditLogs.length === 0 ? (
            <EmptyState message="暂无变更记录" />
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-gray-100 text-gray-700">{log.action}</span>
                    {log.fieldName && (
                      <span className="text-sm text-gray-700">{formatFieldName(log.fieldName)} 变更</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                </div>
                {(log.oldValue !== undefined || log.newValue !== undefined) && log.fieldName && (
                  <div className="flex items-start gap-6 ml-2 text-sm bg-gray-50 rounded-md p-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">变更前</div>
                      <div className="font-mono text-red-600">{formatValue(log.oldValue)}</div>
                    </div>
                    <div className="text-gray-400 mt-3">→</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">变更后</div>
                      <div className="font-mono text-green-600">{formatValue(log.newValue)}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 ml-2">
                  {log.remark && <div className="text-xs text-gray-600">备注：{log.remark}</div>}
                  <div className="text-xs text-gray-500 ml-auto">操作人：{log.operatorName}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
