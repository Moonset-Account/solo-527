import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, LEASE_STATUS } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';

interface Lease {
  id: number;
  apartmentId: number;
  customerId: number;
  consultantId: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  paymentCycle: number;
  terms: string;
  status: string;
  signedAt: string;
  apartment: { apartmentNo: string; building: string };
  customer: { name: string; phone: string };
  consultant: { name: string };
}

interface LeaseDraft {
  id: number;
  apartmentId: number;
  customerId: number;
  consultantId: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  paymentCycle: number;
  terms: string;
  status: string;
  apartment: { apartmentNo: string };
  customer: { name: string };
}

export const Route = createFileRoute()({
  component: LeasesPage,
});

function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [drafts, setDrafts] = useState<LeaseDraft[]>([]);
  const [apartments, setApartments] = useState<Array<{ id: number; apartmentNo: string; monthlyRent: number }>>([]);
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'drafts' | 'active'>('drafts');
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<LeaseDraft | null>(null);
  const [editingDraft, setEditingDraft] = useState<LeaseDraft | null>(null);
  const [formData, setFormData] = useState({
    apartmentId: 0,
    customerId: 0,
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    depositAmount: 0,
    paymentCycle: 1,
    terms: '',
  });
  const [signFormData, setSignFormData] = useState({
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    depositAmount: 0,
    paymentCycle: 1,
    terms: '',
    depositReceivedDate: '',
  });
  const { user } = useAuthStore();

  const fetchLeases = () => {
    setLoading(true);
    apiClient
      .get('/leases', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setLeases(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchDrafts = () => {
    setLoading(true);
    apiClient
      .get('/leases/drafts', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setDrafts(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchSelectData = () => {
    apiClient.get('/apartments', { params: { pageSize: 100, status: 'vacant' } }).then((res) => {
      setApartments(res.data.list);
    });
    apiClient.get('/customers', { params: { pageSize: 100 } }).then((res) => {
      setCustomers(res.data.list);
    });
  };

  useEffect(() => {
    if (activeTab === 'drafts') {
      fetchDrafts();
    } else {
      fetchLeases();
    }
  }, [page, pageSize, filters, activeTab]);

  useEffect(() => {
    fetchSelectData();
  }, []);

  const handleApartmentChange = (id: number) => {
    const apt = apartments.find((a) => a.id === id);
    if (apt) {
      setFormData({
        ...formData,
        apartmentId: id,
        monthlyRent: Number(apt.monthlyRent),
        depositAmount: Number(apt.monthlyRent),
      });
    }
  };

  const handleDraftSubmit = () => {
    const promise = editingDraft
      ? apiClient.put(`/leases/drafts/${editingDraft.id}`, formData)
      : apiClient.post('/leases/drafts', formData);
    
    promise.then(() => {
      setDraftModalOpen(false);
      fetchDrafts();
      setEditingDraft(null);
      setFormData({ apartmentId: 0, customerId: 0, startDate: '', endDate: '', monthlyRent: 0, depositAmount: 0, paymentCycle: 1, terms: '' });
    });
  };

  const handleSign = () => {
    if (selectedDraft) {
      apiClient.post(`/leases/drafts/${selectedDraft.id}/sign`, signFormData).then(() => {
        setSignModalOpen(false);
        fetchDrafts();
      });
    }
  };

  const handleTerminate = (id: number) => {
    if (confirm('确定要终止此租约吗？')) {
      apiClient.patch(`/leases/${id}/terminate`).then(fetchLeases);
    }
  };

  const openSignModal = (draft: LeaseDraft) => {
    setSelectedDraft(draft);
    setSignFormData({
      startDate: draft.startDate,
      endDate: draft.endDate,
      monthlyRent: Number(draft.monthlyRent),
      depositAmount: Number(draft.depositAmount),
      paymentCycle: draft.paymentCycle,
      terms: draft.terms || '',
      depositReceivedDate: dayjs().format('YYYY-MM-DD'),
    });
    setSignModalOpen(true);
  };

  const openEditDraft = (draft: LeaseDraft) => {
    setEditingDraft(draft);
    setFormData({
      apartmentId: draft.apartmentId,
      customerId: draft.customerId,
      startDate: draft.startDate,
      endDate: draft.endDate,
      monthlyRent: Number(draft.monthlyRent),
      depositAmount: Number(draft.depositAmount),
      paymentCycle: draft.paymentCycle,
      terms: draft.terms || '',
    });
    setDraftModalOpen(true);
  };

  const columns = [
    {
      key: 'apartment',
      title: '房源',
      render: (r: Lease) => `${r.apartment?.building || ''} ${r.apartment?.apartmentNo || ''}`,
    },
    {
      key: 'customer',
      title: '客户',
      render: (r: Lease) => `${r.customer?.name || ''} (${r.customer?.phone || ''})`,
    },
    {
      key: 'consultant',
      title: '顾问',
      render: (r: Lease) => r.consultant?.name || '-',
    },
    {
      key: 'startDate',
      title: '租期',
      render: (r: Lease) => `${dayjs(r.startDate).format('YYYY-MM-DD')} 至 ${dayjs(r.endDate).format('YYYY-MM-DD')}`,
    },
    {
      key: 'monthlyRent',
      title: '月租金',
      render: (r: Lease) => `¥${Number(r.monthlyRent).toLocaleString()}`,
    },
    {
      key: 'depositAmount',
      title: '押金',
      render: (r: Lease) => `¥${Number(r.depositAmount).toLocaleString()}`,
    },
    {
      key: 'status',
      title: '状态',
      render: (r: Lease) => (
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(r.status, LEASE_STATUS)}`}>
          {getStatusLabel(r.status, LEASE_STATUS)}
        </span>
      ),
    },
  ];

  const draftColumns = [
    {
      key: 'apartment',
      title: '房源',
      render: (r: LeaseDraft) => r.apartment?.apartmentNo || '',
    },
    {
      key: 'customer',
      title: '客户',
      render: (r: LeaseDraft) => r.customer?.name || '',
    },
    {
      key: 'startDate',
      title: '租期',
      render: (r: LeaseDraft) => `${dayjs(r.startDate).format('YYYY-MM-DD')} 至 ${dayjs(r.endDate).format('YYYY-MM-DD')}`,
    },
    {
      key: 'monthlyRent',
      title: '月租金',
      render: (r: LeaseDraft) => `¥${Number(r.monthlyRent).toLocaleString()}`,
    },
    {
      key: 'depositAmount',
      title: '押金',
      render: (r: LeaseDraft) => `¥${Number(r.depositAmount).toLocaleString()}`,
    },
    {
      key: 'status',
      title: '状态',
      render: (r: LeaseDraft) => (
        <span className={`px-2 py-1 rounded text-xs ${r.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
          {r.status === 'draft' ? '草稿' : '已签约'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">租约管理</h1>
        <button
          onClick={() => {
            setEditingDraft(null);
            setFormData({ apartmentId: 0, customerId: 0, startDate: '', endDate: '', monthlyRent: 0, depositAmount: 0, paymentCycle: 1, terms: '' });
            setDraftModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新建租约草稿
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => { setActiveTab('drafts'); setPage(1); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'drafts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              租约草稿
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('active'); setPage(1); }}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                已签约租约
              </button>
            )}
          </nav>
        </div>
      </div>

      <SearchFilter
        filters={filters}
        onChange={setFilters}
        onSearch={() => setPage(1)}
        statusOptions={LEASE_STATUS}
      />

      {activeTab === 'drafts' ? (
        <DataTable
          columns={draftColumns}
          data={drafts}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          rowKey={(r) => r.id}
          actions={(r) =>
            r.status === 'draft' && (
              <>
                <button
                  onClick={() => openEditDraft(r)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  编辑
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => openSignModal(r)}
                    className="text-green-600 hover:text-green-800"
                  >
                    签约
                  </button>
                )}
              </>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={leases}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          rowKey={(r) => r.id}
          actions={(r) =>
            r.status === 'active' && (
              <button
                onClick={() => handleTerminate(r.id)}
                className="text-red-600 hover:text-red-800"
              >
                终止
              </button>
            )
          }
        />
      )}

      <Modal
        open={draftModalOpen}
        title={editingDraft ? '编辑租约草稿' : '新建租约草稿'}
        onClose={() => setDraftModalOpen(false)}
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => setDraftModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleDraftSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择房源 *</label>
            <select
              value={formData.apartmentId}
              onChange={(e) => handleApartmentChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value={0}>请选择房源</option>
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.apartmentNo} (¥{Number(a.monthlyRent).toLocaleString()}/月)
                </option>
              ))}
            </select>
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">起租日期 *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期 *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月租金(元) *</label>
            <input
              type="number"
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">押金(元) *</label>
            <input
              type="number"
              value={formData.depositAmount}
              onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">付款周期(月)</label>
            <input
              type="number"
              value={formData.paymentCycle}
              onChange={(e) => setFormData({ ...formData, paymentCycle: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">租约条款</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="详细描述租约条款..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={signModalOpen}
        title="签署租约"
        onClose={() => setSignModalOpen(false)}
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => setSignModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSign}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              确认签约
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedDraft && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">
                房源: <span className="font-medium">{selectedDraft.apartment?.apartmentNo}</span>
                {' | '}客户: <span className="font-medium">{selectedDraft.customer?.name}</span>
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">起租日期 *</label>
              <input
                type="date"
                value={signFormData.startDate}
                onChange={(e) => setSignFormData({ ...signFormData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期 *</label>
              <input
                type="date"
                value={signFormData.endDate}
                onChange={(e) => setSignFormData({ ...signFormData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">月租金(元) *</label>
              <input
                type="number"
                value={signFormData.monthlyRent}
                onChange={(e) => setSignFormData({ ...signFormData, monthlyRent: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">押金(元) *</label>
              <input
                type="number"
                value={signFormData.depositAmount}
                onChange={(e) => setSignFormData({ ...signFormData, depositAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">付款周期(月)</label>
              <input
                type="number"
                value={signFormData.paymentCycle}
                onChange={(e) => setSignFormData({ ...signFormData, paymentCycle: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">押金收款日期 *</label>
              <input
                type="date"
                value={signFormData.depositReceivedDate}
                onChange={(e) => setSignFormData({ ...signFormData, depositReceivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">租约条款</label>
              <textarea
                value={signFormData.terms}
                onChange={(e) => setSignFormData({ ...signFormData, terms: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
