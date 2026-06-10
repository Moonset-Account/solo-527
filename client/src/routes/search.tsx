import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, APARTMENT_STATUS, VIEWING_STATUS, LEASE_STATUS, DEPOSIT_STATUS, FOLLOWUP_RESULT } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';

interface QueryResult {
  apartments?: Array<{
    id: number;
    apartmentNo: string;
    building: string;
    status: string;
    monthlyRent: number;
    area: number;
    updatedAt: string;
  }>;
  customers?: Array<{
    id: number;
    name: string;
    phone: string;
    gender: string;
    createdAt: string;
  }>;
  viewings?: Array<{
    id: number;
    viewingDate: string;
    status: string;
    apartment: { apartmentNo: string; building: string };
    customer: { name: string; phone: string };
    consultant: { name: string };
  }>;
  followups?: Array<{
    id: number;
    type: string;
    content: string;
    result: string;
    createdAt: string;
    customer: { name: string; phone: string };
    consultant: { name: string };
  }>;
  leases?: Array<{
    id: number;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    status: string;
    apartment: { apartmentNo: string; building: string };
    customer: { name: string; phone: string };
    consultant: { name: string };
  }>;
  deposits?: Array<{
    id: number;
    amount: number;
    receivedDate: string;
    status: string;
    hasDispute: boolean;
    apartment: { apartmentNo: string; building: string };
    customer: { name: string; phone: string };
  }>;
}

export const Route = createFileRoute()({
  component: SearchPage,
});

function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [consultantId, setConsultantId] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['apartments', 'customers', 'viewings', 'followups', 'leases', 'deposits']);
  const [activeTab, setActiveTab] = useState('apartments');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'admin') {
      apiClient.get('/users').then((res) => {
        setUsers(res.data.list || res.data);
      });
    }
  }, [user]);

  const typeOptions = [
    { value: 'apartments', label: '房源档案', icon: '🏢' },
    { value: 'customers', label: '客户信息', icon: '👥' },
    { value: 'viewings', label: '看房预约', icon: '📅' },
    { value: 'followups', label: '跟进记录', icon: '📝' },
    { value: 'leases', label: '租约档案', icon: '📄' },
    { value: 'deposits', label: '押金记录', icon: '💰' },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    ...APARTMENT_STATUS.map((s) => ({ value: s.value, label: `房源: ${s.label}` })),
    ...VIEWING_STATUS.map((s) => ({ value: s.value, label: `预约: ${s.label}` })),
    ...LEASE_STATUS.filter((s) => s.value !== 'draft').map((s) => ({ value: s.value, label: `租约: ${s.label}` })),
    ...DEPOSIT_STATUS.map((s) => ({ value: s.value, label: `押金: ${s.label}` })),
  ];

  const handleSearch = () => {
    setLoading(true);
    const data: Record<string, unknown> = {
      types: selectedTypes,
    };
    if (keyword.trim()) data.keyword = keyword.trim();
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;
    if (status) data.status = status;
    if (consultantId > 0) data.consultantId = consultantId;

    apiClient
      .post('/reports/batch', data)
      .then((res) => {
        setResults(res.data);
        const firstType = selectedTypes.find((t) => res.data[t] && res.data[t].length > 0);
        if (firstType) {
          setActiveTab(firstType);
        }
      })
      .finally(() => setLoading(false));
  };

  const handleExport = () => {
    if (!results) return;
    let csv = '类型,详情,状态,日期\n';
    if (results.apartments) {
      results.apartments.forEach((a) => {
        csv += `房源,${a.building} ${a.apartmentNo},${getStatusLabel(a.status, APARTMENT_STATUS)},${dayjs(a.updatedAt).format('YYYY-MM-DD')}\n`;
      });
    }
    if (results.customers) {
      results.customers.forEach((c) => {
        csv += `客户,${c.name} (${c.phone}),,${dayjs(c.createdAt).format('YYYY-MM-DD')}\n`;
      });
    }
    if (results.viewings) {
      results.viewings.forEach((v) => {
        csv += `预约,${v.apartment?.building} ${v.apartment?.apartmentNo} - ${v.customer?.name},${getStatusLabel(v.status, VIEWING_STATUS)},${dayjs(v.viewingDate).format('YYYY-MM-DD')}\n`;
      });
    }
    if (results.followups) {
      results.followups.forEach((f) => {
        csv += `跟进,${f.customer?.name} - ${f.content},${f.result ? getStatusLabel(f.result, FOLLOWUP_RESULT) : ''},${dayjs(f.createdAt).format('YYYY-MM-DD')}\n`;
      });
    }
    if (results.leases) {
      results.leases.forEach((l) => {
        csv += `租约,${l.apartment?.building} ${l.apartment?.apartmentNo} - ${l.customer?.name},${getStatusLabel(l.status, LEASE_STATUS)},${dayjs(l.startDate).format('YYYY-MM-DD')} 至 ${dayjs(l.endDate).format('YYYY-MM-DD')}\n`;
      });
    }
    if (results.deposits) {
      results.deposits.forEach((d) => {
        csv += `押金,${d.apartment?.building} ${d.apartment?.apartmentNo} - ${d.customer?.name},${getStatusLabel(d.status, DEPOSIT_STATUS)}${d.hasDispute ? ' (有争议)' : ''},${dayjs(d.receivedDate).format('YYYY-MM-DD')}\n`;
      });
    }
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `批量查询结果_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    link.click();
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const getResultCount = (type: string) => {
    if (!results) return 0;
    return (results[type as keyof QueryResult] as Array<unknown>)?.length || 0;
  };

  const totalCount = selectedTypes.reduce((sum, type) => sum + getResultCount(type), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">综合查询</h1>
        {results && totalCount > 0 && (
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📥 导出CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关键字</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="房源号/客户名/电话..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">顾问</label>
              <select
                value={consultantId}
                onChange={(e) => setConsultantId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={0}>全部顾问</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">查询类型</label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleType(opt.value)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedTypes.includes(opt.value)
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{opt.icon}</span>
                {opt.label}
                {results && getResultCount(opt.value) > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {getResultCount(opt.value)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            支持组合查询：关键字 + 日期范围 + 状态 + 处理人，可同时查询多种类型数据
          </p>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '查询中...' : '🔍 开始查询'}
          </button>
        </div>
      </div>

      {results && totalCount > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b px-6 py-3">
            <p className="text-sm text-gray-600">
              查询完成，共找到 <span className="font-bold text-blue-600">{totalCount}</span> 条记录
            </p>
          </div>
          <div className="border-b">
            <nav className="flex px-4">
              {typeOptions
                .filter((opt) => selectedTypes.includes(opt.value))
                .map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setActiveTab(opt.value)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === opt.value
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.icon} {opt.label}
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {getResultCount(opt.value)}
                    </span>
                  </button>
                ))}
            </nav>
          </div>
          <div className="p-4">
            {activeTab === 'apartments' && results.apartments && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">房源</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">面积</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">月租金</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.apartments.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{a.building} {a.apartmentNo}</td>
                        <td className="px-4 py-3 text-sm">{a.area} ㎡</td>
                        <td className="px-4 py-3 text-sm">¥{Number(a.monthlyRent).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(a.status, APARTMENT_STATUS)}`}>
                            {getStatusLabel(a.status, APARTMENT_STATUS)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{dayjs(a.updatedAt).format('YYYY-MM-DD HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'customers' && results.customers && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">电话</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">性别</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.customers.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-sm">{c.phone}</td>
                        <td className="px-4 py-3 text-sm">{c.gender === 'male' ? '男' : c.gender === 'female' ? '女' : '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{dayjs(c.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'viewings' && results.viewings && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">房源</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">顾问</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">看房时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.viewings.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{v.apartment?.building} {v.apartment?.apartmentNo}</td>
                        <td className="px-4 py-3 text-sm">{v.customer?.name} ({v.customer?.phone})</td>
                        <td className="px-4 py-3 text-sm">{v.consultant?.name}</td>
                        <td className="px-4 py-3 text-sm">{dayjs(v.viewingDate).format('YYYY-MM-DD HH:mm')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(v.status, VIEWING_STATUS)}`}>
                            {getStatusLabel(v.status, VIEWING_STATUS)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'followups' && results.followups && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">顾问</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">内容</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">结果</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.followups.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{f.customer?.name} ({f.customer?.phone})</td>
                        <td className="px-4 py-3 text-sm">{f.consultant?.name}</td>
                        <td className="px-4 py-3 text-sm">{f.type === 'phone' ? '电话' : f.type === 'wechat' ? '微信' : f.type === 'visit' ? '到访' : '其他'}</td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate" title={f.content}>{f.content}</td>
                        <td className="px-4 py-3">
                          {f.result ? (
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                              {getStatusLabel(f.result, FOLLOWUP_RESULT)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{dayjs(f.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'leases' && results.leases && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">房源</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">顾问</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">租期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">月租金</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.leases.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{l.apartment?.building} {l.apartment?.apartmentNo}</td>
                        <td className="px-4 py-3 text-sm">{l.customer?.name} ({l.customer?.phone})</td>
                        <td className="px-4 py-3 text-sm">{l.consultant?.name}</td>
                        <td className="px-4 py-3 text-sm">{dayjs(l.startDate).format('YYYY-MM-DD')} 至 {dayjs(l.endDate).format('YYYY-MM-DD')}</td>
                        <td className="px-4 py-3 text-sm">¥{Number(l.monthlyRent).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(l.status, LEASE_STATUS)}`}>
                            {getStatusLabel(l.status, LEASE_STATUS)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'deposits' && results.deposits && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">房源</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">押金金额</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">收款日期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.deposits.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{d.apartment?.building} {d.apartment?.apartmentNo}</td>
                        <td className="px-4 py-3 text-sm">{d.customer?.name} ({d.customer?.phone})</td>
                        <td className="px-4 py-3 text-sm font-medium">¥{Number(d.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">{dayjs(d.receivedDate).format('YYYY-MM-DD')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(d.status, DEPOSIT_STATUS)}`}>
                              {getStatusLabel(d.status, DEPOSIT_STATUS)}
                            </span>
                            {d.hasDispute && (
                              <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                争议
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {results && totalCount === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">未找到符合条件的记录</p>
          <p className="text-gray-400 text-sm mt-2">请尝试调整查询条件</p>
        </div>
      )}

      {!results && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">输入查询条件后点击开始查询</p>
          <p className="text-gray-400 text-sm mt-2">可同时查询房源、客户、预约、跟进、租约、押金等多类数据</p>
        </div>
      )}
    </div>
  );
}
