import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, VIEWING_STATUS } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import dayjs from 'dayjs';

interface Viewing {
  id: number;
  apartmentId: number;
  customerId: number;
  consultantId: number;
  viewingDate: string;
  status: string;
  note: string;
  feedback: string;
  apartment: { apartmentNo: string; building: string };
  customer: { name: string; phone: string };
  consultant: { name: string };
}

export const Route = createFileRoute()({
  component: ViewingsPage,
});

function ViewingsPage() {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [apartments, setApartments] = useState<Array<{ id: number; apartmentNo: string }>>([]);
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingViewing, setEditingViewing] = useState<Viewing | null>(null);
  const [formData, setFormData] = useState({
    apartmentId: 0,
    customerId: 0,
    viewingDate: '',
    note: '',
    status: 'pending',
    feedback: '',
  });

  const fetchViewings = () => {
    setLoading(true);
    apiClient
      .get('/viewings', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setViewings(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchSelectData = () => {
    apiClient.get('/apartments', { params: { pageSize: 100 } }).then((res) => {
      setApartments(res.data.list);
    });
    apiClient.get('/customers', { params: { pageSize: 100 } }).then((res) => {
      setCustomers(res.data.list);
    });
  };

  useEffect(() => {
    fetchViewings();
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchSelectData();
  }, []);

  const handleSubmit = () => {
    const submitData = {
      apartmentId: formData.apartmentId,
      customerId: formData.customerId,
      viewingDate: formData.viewingDate,
      note: formData.note,
    };

    const promise = editingViewing
      ? apiClient.put(`/viewings/${editingViewing.id}`, formData)
      : apiClient.post('/viewings', submitData);
    
    promise.then(() => {
      setModalOpen(false);
      fetchViewings();
      setEditingViewing(null);
      setFormData({ apartmentId: 0, customerId: 0, viewingDate: '', note: '', status: 'pending', feedback: '' });
    });
  };

  const handleEdit = (v: Viewing) => {
    setEditingViewing(v);
    setFormData({
      apartmentId: v.apartmentId,
      customerId: v.customerId,
      viewingDate: dayjs(v.viewingDate).format('YYYY-MM-DDTHH:mm'),
      note: v.note || '',
      status: v.status,
      feedback: v.feedback || '',
    });
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'apartment',
      title: '房源',
      render: (r: Viewing) => `${r.apartment?.building || ''} ${r.apartment?.apartmentNo || ''}`,
    },
    {
      key: 'customer',
      title: '客户',
      render: (r: Viewing) => `${r.customer?.name || ''} (${r.customer?.phone || ''})`,
    },
    {
      key: 'consultant',
      title: '顾问',
      render: (r: Viewing) => r.consultant?.name || '-',
    },
    {
      key: 'viewingDate',
      title: '看房时间',
      render: (r: Viewing) => dayjs(r.viewingDate).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'status',
      title: '状态',
      render: (r: Viewing) => (
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(r.status, VIEWING_STATUS)}`}>
          {getStatusLabel(r.status, VIEWING_STATUS)}
        </span>
      ),
    },
    { key: 'note', title: '备注', width: '150px' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">看房预约</h1>
        <button
          onClick={() => {
            setEditingViewing(null);
            setFormData({ apartmentId: 0, customerId: 0, viewingDate: '', note: '', status: 'pending', feedback: '' });
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新增预约
        </button>
      </div>

      <SearchFilter
        filters={filters}
        onChange={setFilters}
        onSearch={() => setPage(1)}
        statusOptions={VIEWING_STATUS}
      />

      <DataTable
        columns={columns}
        data={viewings}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(r) => r.id}
        actions={(r) => (
          <button
            onClick={() => handleEdit(r)}
            className="text-blue-600 hover:text-blue-800"
          >
            {r.status === 'pending' ? '处理' : '查看'}
          </button>
        )}
      />

      <Modal
        open={modalOpen}
        title={editingViewing ? '处理预约' : '新增预约'}
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
          {!editingViewing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择房源 *</label>
                <select
                  value={formData.apartmentId}
                  onChange={(e) => setFormData({ ...formData, apartmentId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">看房时间 *</label>
                <input
                  type="datetime-local"
                  value={formData.viewingDate}
                  onChange={(e) => setFormData({ ...formData, viewingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </>
          )}
          {editingViewing && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  房源: <span className="font-medium">{editingViewing.apartment?.building} {editingViewing.apartment?.apartmentNo}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  客户: <span className="font-medium">{editingViewing.customer?.name} ({editingViewing.customer?.phone})</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  看房时间: <span className="font-medium">{dayjs(editingViewing.viewingDate).format('YYYY-MM-DD HH:mm')}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {VIEWING_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">看房反馈</label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="记录客户看房后的反馈意见..."
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
