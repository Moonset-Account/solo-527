import { json, type LoaderFunction, type ActionFunction, redirect } from '@remix-run/node';
import { Link, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useEffect, useState } from 'react';
import AppLayout from '~/components/AppLayout';
import {
  PageHeader,
  StatusBadge,
  Pagination,
  EmptyState,
  formatNumber,
  formatDate,
  calcUsagePercent,
} from '~/components/ui';
import { api } from '~/api.client';
import type { Seat, PaginationResult } from '@seat-platform/shared';

function mockSeats(): PaginationResult<Seat> {
  const statuses: Seat['status'][] = ['active', 'active', 'active', 'trial', 'expired', 'suspended', 'active', 'trial'];
  const trialStatuses: Seat['trialStatus'][] = ['in_progress', 'not_started', 'ended', 'in_progress'];
  const customers = ['某大型电商', '金融科技A', '在线教育E', '物流平台C', 'SaaS服务商D', '医疗科技F', '新注册客户B', '游戏公司G'];
  const owners = ['张伟', '李娜', '王强', '赵敏', '陈杰', null];

  const items = Array.from({ length: 8 }, (_, i) => {
    const quota = [1000000, 500000, 200000, 10000, 800000, 3000000, 150000, 250000][i];
    const usedQuota = Math.floor(quota * (0.3 + Math.random() * 0.65));
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + Math.floor(Math.random() * 120) - 10);
    return {
      id: `seat_mock_${i + 1}`,
      seatCode: ['VIP-001', 'VIP-002', 'VIP-003', 'TR-015', 'VIP-005', 'VIP-006', 'VIP-007', 'VIP-008'][i],
      customerName: customers[i],
      customerEmail: `contact${i + 1}@company${i + 1}.com`,
      customerPhone: '138' + String(10000000 + i * 111),
      status: statuses[i],
      trialStatus: statuses[i] === 'trial' ? trialStatuses[i % 4] : 'not_started',
      trialStartDate: statuses[i] === 'trial' ? '2025-06-01T00:00:00Z' : undefined,
      trialEndDate: statuses[i] === 'trial' ? '2025-06-15T00:00:00Z' : undefined,
      quota,
      usedQuota,
      usageThreshold: 80,
      warningThreshold: 70,
      criticalThreshold: 95,
      expireDate: expireDate.toISOString(),
      ownerName: owners[i % owners.length] || undefined,
      ownerEmail: owners[i % owners.length] ? `${owners[i % owners.length]}@company.com` : undefined,
      apiKeys: [],
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    };
  });

  return {
    items,
    total: 128,
    page: 1,
    pageSize: 20,
    totalPages: 7,
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);
  try {
    const data = await api.seats.list(query);
    return json(data);
  } catch {
    return json(mockSeats());
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id') as string;
  const _action = formData.get('_action') as string;
  try {
    if (_action === 'delete' && id) {
      await api.seats.remove(id);
    }
  } catch {
    // ignore
  }
  return redirect('/seats');
};

export default function SeatsPage() {
  const data = useLoaderData<PaginationResult<Seat>>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  const handlePageChange = (p: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: String(p) });
  };

  return (
    <AppLayout>
      <PageHeader
        title="席位管理"
        description="查看和管理所有席位的开通、试用状态与用量配置"
        actions={
          <>
            <Link to="/exports" className="btn-secondary btn-sm">批量导出</Link>
            <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>新增席位</button>
          </>
        }
      />

      <div className="card mb-6">
        <div className="card-body flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">状态：</label>
            <select
              className="input"
              style={{ width: 140 }}
              value={searchParams.get('status') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('status', e.target.value); else p.delete('status');
                p.set('page', '1');
                setSearchParams(p);
              }}
            >
              <option value="">全部</option>
              <option value="active">正常</option>
              <option value="trial">试用中</option>
              <option value="expired">已过期</option>
              <option value="suspended">已暂停</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">试用状态：</label>
            <select
              className="input"
              style={{ width: 140 }}
              value={searchParams.get('trialStatus') || ''}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('trialStatus', e.target.value); else p.delete('trialStatus');
                p.set('page', '1');
                setSearchParams(p);
              }}
            >
              <option value="">全部</option>
              <option value="not_started">未开始</option>
              <option value="in_progress">进行中</option>
              <option value="ended">已结束</option>
            </select>
          </div>
          <div className="flex-1" />
          <input
            className="input"
            style={{ width: 280 }}
            placeholder="搜索席位编码、客户名、邮箱..."
            value={searchParams.get('keyword') || ''}
            onChange={(e) => {
              const p = new URLSearchParams(searchParams);
              if (e.target.value) p.set('keyword', e.target.value); else p.delete('keyword');
              p.set('page', '1');
              setSearchParams(p);
            }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>席位编码</th>
                    <th>客户信息</th>
                    <th>席位状态</th>
                    <th>试用状态</th>
                    <th>用量 / 配额</th>
                    <th>阈值配置</th>
                    <th>到期日期</th>
                    <th>负责人</th>
                    <th>更新时间</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((seat) => {
                    const pct = calcUsagePercent(seat.usedQuota, seat.quota);
                    return (
                      <tr key={seat.id}>
                        <td className="font-mono text-xs font-medium">{seat.seatCode}</td>
                        <td>
                          <div className="font-medium">{seat.customerName}</div>
                          <div className="text-xs text-gray-500">{seat.customerEmail}</div>
                        </td>
                        <td><StatusBadge status={seat.status} type="seat" /></td>
                        <td><StatusBadge status={seat.trialStatus} /></td>
                        <td>
                          <div className="flex items-center gap-2 min-w-[180px]">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${pct >= seat.criticalThreshold ? 'bg-red-500' : pct >= seat.warningThreshold ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-24 text-right">
                              {formatNumber(seat.usedQuota)}/{formatNumber(seat.quota)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="text-xs text-gray-600">
                            预警 {seat.warningThreshold}% · 提醒 {seat.usageThreshold}% · 临界 {seat.criticalThreshold}%
                          </div>
                        </td>
                        <td>
                          {seat.expireDate ? (
                            <div>
                              <div>{formatDate(seat.expireDate).split(' ')[0]}</div>
                              {(() => {
                                const days = Math.ceil((new Date(seat.expireDate).getTime() - Date.now()) / 86400000);
                                if (days <= 0) return <span className="text-xs text-red-600">已过期</span>;
                                if (days <= 7) return <span className="text-xs text-red-600">{days} 天后到期</span>;
                                if (days <= 30) return <span className="text-xs text-yellow-600">{days} 天后到期</span>;
                                return <span className="text-xs text-gray-500">{days} 天</span>;
                              })()}
                            </div>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td>
                          {seat.ownerName ? (
                            <div>
                              <div className="text-sm">{seat.ownerName}</div>
                              {seat.ownerEmail && <div className="text-xs text-gray-500">{seat.ownerEmail}</div>}
                            </div>
                          ) : <span className="text-gray-400">未指派</span>}
                        </td>
                        <td className="text-gray-500">{formatDate(seat.updatedAt)}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-xs text-brand-600 hover:underline" onClick={() => navigate(`/seats/${seat.id}`)}>详情</button>
                            <Link to={`/usage?seatId=${seat.id}`} className="text-xs text-brand-600 hover:underline">用量</Link>
                            <form method="post" onSubmit={(e) => { if (!confirm('确定删除此席位？')) e.preventDefault(); }}>
                              <input type="hidden" name="id" value={seat.id} />
                              <button type="submit" name="_action" value="delete" className="text-xs text-red-600 hover:underline">删除</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[520px] max-h-[85vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">新增席位</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form
              method="post"
              className="p-6 space-y-4"
              onSubmit={() => setShowForm(false)}
            >
              <div>
                <label className="label">席位编码 *</label>
                <input name="seatCode" className="input" placeholder="如 VIP-009" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">客户名称 *</label>
                  <input name="customerName" className="input" required />
                </div>
                <div>
                  <label className="label">客户邮箱 *</label>
                  <input name="customerEmail" type="email" className="input" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">客户手机</label>
                  <input name="customerPhone" className="input" />
                </div>
                <div>
                  <label className="label">初始状态</label>
                  <select name="status" className="input">
                    <option value="active">正常</option>
                    <option value="trial">试用中</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">API 配额 *</label>
                  <input name="quota" type="number" className="input" defaultValue="100000" required />
                </div>
                <div>
                  <label className="label">到期日期</label>
                  <input name="expireDate" type="date" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">预警阈值 %</label>
                  <input name="warningThreshold" type="number" className="input" defaultValue="70" />
                </div>
                <div>
                  <label className="label">提醒阈值 %</label>
                  <input name="usageThreshold" type="number" className="input" defaultValue="80" />
                </div>
                <div>
                  <label className="label">临界阈值 %</label>
                  <input name="criticalThreshold" type="number" className="input" defaultValue="95" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">负责人姓名</label>
                  <input name="ownerName" className="input" />
                </div>
                <div>
                  <label className="label">负责人邮箱</label>
                  <input name="ownerEmail" type="email" className="input" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="btn-primary">创建席位</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
