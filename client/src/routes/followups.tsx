import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { FOLLOWUP_TYPE, FOLLOWUP_RESULT } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import dayjs from 'dayjs';

interface FollowUp {
  id: number;
  customerId: number;
  apartmentId: number | null;
  consultantId: number;
  type: string;
  content: string;
  nextFollowDate: string | null;
  result: string | null;
  createdAt: string;
  customer: { name: string; phone: string };
  apartment: { apartmentNo: string } | null;
  consultant: { name: string };
}

export const Route = createFileRoute('/followups')({
  component: FollowUpsPage,
});

function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [apartments, setApartments] = useState<Array<{ id: number; apartmentNo: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: 0,
    apartmentId: 0,
    type: 'phone',
    content: '',
    nextFollowDate: '',
    result: '',
  });

  const fetchFollowups = () => {
    setLoading(true);
    apiClient
      .get('/followups', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setFollowups(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchSelectData = () => {
    apiClient.get('/customers', { params: { pageSize: 100 } }).then((res) => {
      setCustomers(res.data.list);
    });
    apiClient.get('/apartments', { params: { pageSize: 100 } }).then((res) => {
      setApartments(res.data.list);
    });
  };

  useEffect(() => {
    fetchFollowups();
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchSelectData();
  }, []);

  const handleSubmit = () => {
    const submitData = {
      customerId: formData.customerId,
      apartmentId: formData.apartmentId || undefined,
      type: formData.type,
      content: formData.content,
      nextFollowDate: formData.nextFollowDate || undefined,
      result: formData.result || undefined,
    };

    apiClient.post('/followups', submitData).then(() => {
      setModalOpen(false);
      fetchFollowups();
      setFormData({ customerId: 0, apartmentId: 0, type: 'phone', content: '', nextFollowDate: '', result: '' });
    });
  };

  const typeLabels: Record<string, string> = {
    phone: '电话',
    wechat: '微信',
    visit: '到访',
    other: '其他',
  };

  const resultColors: Record<string, string> = {
    interested: 'bg-blue-100 text-blue-800',
    negotiating: 'bg-yellow-100 text-yellow-800',
    signed: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
  };

  const resultLabels: Record<string, string> = {
    interested: '意向强',
    negotiating: '洽谈中',
    signed: '已签约',
    lost: '已流失',
    pending: '待跟进',
  };

  const columns = [
    {
      key: 'customer',
      title: '客户',
      render: (r: FollowUp) => `${r.customer?.name || ''} (${r.customer?.phone || ''})`,
    },
    {
      key: 'apartment',
      title: '意向房源',
      render: (r: FollowUp) => r.apartment?.apartmentNo || '-',
    },
    {
      key: 'type',
      title: '跟进类型',
      render: (r: FollowUp) => typeLabels[r.type] || r.type,
    },
    { key: 'content', title: '跟进内容', width: '200px' },
    {
      key: 'result',
      title: '跟进结果',
      render: (r: FollowUp) =>
        r.result ? (
          <span className={`px-2 py-1 rounded text-xs ${resultColors[r.result]}`}>
            {resultLabels[r.result]}
          </span>
        ) : (
          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">跟进中</span>
        ),
    },
    {
      key: 'nextFollowDate',
      title: '下次跟进',
      render: (r: FollowUp) => (r.nextFollowDate ? dayjs(r.nextFollowDate).format('YYYY-MM-DD') : '-'),
    },
    {
      key: 'createdAt',
      title: '跟进时间',
      render: (r: FollowUp) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">跟进记录</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新增跟进
        </button>
      </div>

      <SearchFilter
        filters={filters}
        onChange={setFilters}
        onSearch={() => setPage(1)}
        showStatus={false}
        extraFilters={
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">跟进类型</label>
              <select
                value={(filters.type as string) || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部类型</option>
                {FOLLOWUP_TYPE.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">待跟进</label>
              <select
                value={(filters.pending as string) || ''}
                onChange={(e) => setFilters({ ...filters, pending: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部</option>
                <option value="true">待跟进</option>
                <option value="false">已处理</option>
              </select>
            </div>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={followups}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(r) => r.id}
      />

      <Modal
        open={modalOpen}
        title="新增跟进记录"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择客户 *</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value={0}>请选择客户</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.phone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">意向房源</label>
            <select
              value={formData.apartmentId}
              onChange={(e) => setFormData({ ...formData, apartmentId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={0}>请选择房源</option>
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.apartmentNo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">跟进方式 *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              {FOLLOWUP_TYPE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">跟进内容 *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="请详细记录跟进内容..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">下次跟进时间</label>
              <input
                type="datetime-local"
                value={formData.nextFollowDate}
                onChange={(e) => setFormData({ ...formData, nextFollowDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">跟进结果</label>
              <select
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">未处理</option>
                {FOLLOWUP_RESULT.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
