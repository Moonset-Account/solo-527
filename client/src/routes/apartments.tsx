import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, APARTMENT_STATUS } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';

interface Apartment {
  id: number;
  apartmentNo: string;
  building: string;
  floor: number;
  area: number;
  layout: string;
  orientation: string;
  decoration: string;
  status: string;
  monthlyRent: number;
  depositMonths: number;
  description: string;
  facilities: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute('/apartments')({
  component: ApartmentsPage,
});

function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [priceData, setPriceData] = useState({ monthlyRent: 0, effectiveDate: dayjs().format('YYYY-MM-DD'), reason: '' });
  const [formData, setFormData] = useState<Partial<Apartment>>({});
  const { user } = useAuthStore();

  const fetchApartments = () => {
    setLoading(true);
    apiClient
      .get('/apartments', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setApartments(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApartments();
  }, [page, pageSize, filters]);

  const handleSubmit = () => {
    const promise = editingApartment
      ? apiClient.put(`/apartments/${editingApartment.id}`, formData)
      : apiClient.post('/apartments', formData);
    
    promise.then(() => {
      setModalOpen(false);
      fetchApartments();
      setEditingApartment(null);
      setFormData({});
    });
  };

  const handleEdit = (apt: Apartment) => {
    setEditingApartment(apt);
    setFormData(apt);
    setModalOpen(true);
  };

  const handleStatusChange = (id: number, status: string) => {
    if (confirm(`确定要修改房源状态吗？`)) {
      apiClient.patch(`/apartments/${id}/status`, { status }).then(fetchApartments);
    }
  };

  const handlePriceUpdate = (apt: Apartment) => {
    setEditingApartment(apt);
    setPriceData({ monthlyRent: Number(apt.monthlyRent), effectiveDate: dayjs().format('YYYY-MM-DD'), reason: '' });
    setPriceModalOpen(true);
  };

  const submitPriceUpdate = () => {
    if (editingApartment) {
      apiClient.post(`/apartments/${editingApartment.id}/price`, priceData).then(() => {
        setPriceModalOpen(false);
        fetchApartments();
      });
    }
  };

  const columns = [
    { key: 'apartmentNo', title: '房源编号' },
    { key: 'building', title: '楼栋' },
    { key: 'floor', title: '楼层' },
    { key: 'layout', title: '户型' },
    { key: 'area', title: '面积(㎡)', render: (r: Apartment) => Number(r.area).toFixed(0) },
    { key: 'monthlyRent', title: '月租金(元)', render: (r: Apartment) => Number(r.monthlyRent).toLocaleString() },
    {
      key: 'status',
      title: '状态',
      render: (r: Apartment) => (
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(r.status, APARTMENT_STATUS)}`}>
          {getStatusLabel(r.status, APARTMENT_STATUS)}
        </span>
      ),
    },
    { key: 'updatedAt', title: '更新时间', render: (r: Apartment) => dayjs(r.updatedAt).format('YYYY-MM-DD HH:mm') },
  ];

  const layoutOptions = ['一室一厅', '两室一厅', '三室一厅', '两室两厅', '三室两厅'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">房源管理</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingApartment(null);
              setFormData({});
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 新增房源
          </button>
        )}
      </div>

      <SearchFilter
        filters={filters}
        onChange={setFilters}
        onSearch={() => setPage(1)}
        statusOptions={APARTMENT_STATUS}
        extraFilters={
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">户型</label>
              <select
                value={(filters.layout as string) || ''}
                onChange={(e) => setFilters({ ...filters, layout: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部户型</option>
                {layoutOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低租金</label>
              <input
                type="number"
                value={(filters.minRent as string) || ''}
                onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                placeholder="元/月"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高租金</label>
              <input
                type="number"
                value={(filters.maxRent as string) || ''}
                onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                placeholder="元/月"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={apartments}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(r) => r.id}
        actions={(r) => (
          <>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => handleEdit(r)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  编辑
                </button>
                <button
                  onClick={() => handlePriceUpdate(r)}
                  className="text-green-600 hover:text-green-800"
                >
                  调价
                </button>
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  {APARTMENT_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </>
        )}
      />

      <Modal
        open={modalOpen}
        title={editingApartment ? '编辑房源' : '新增房源'}
        onClose={() => setModalOpen(false)}
        width="max-w-3xl"
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">房源编号 *</label>
            <input
              type="text"
              value={formData.apartmentNo || ''}
              onChange={(e) => setFormData({ ...formData, apartmentNo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">楼栋</label>
            <input
              type="text"
              value={formData.building || ''}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">楼层</label>
            <input
              type="number"
              value={formData.floor || ''}
              onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">面积(㎡)</label>
            <input
              type="number"
              step="0.01"
              value={formData.area || ''}
              onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">户型</label>
            <select
              value={formData.layout || ''}
              onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">请选择</option>
              {layoutOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">朝向</label>
            <select
              value={formData.orientation || ''}
              onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">请选择</option>
              {['南', '北', '东', '西', '东南', '西南', '东北', '西北'].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">装修</label>
            <select
              value={formData.decoration || ''}
              onChange={(e) => setFormData({ ...formData, decoration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">请选择</option>
              {['精装', '简装', '毛坯'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月租金(元)</label>
            <input
              type="number"
              value={formData.monthlyRent || ''}
              onChange={(e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">押金月数</label>
            <input
              type="number"
              value={formData.depositMonths || 1}
              onChange={(e) => setFormData({ ...formData, depositMonths: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">房源描述</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={priceModalOpen}
        title="调整租金"
        onClose={() => setPriceModalOpen(false)}
        footer={
          <>
            <button
              onClick={() => setPriceModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={submitPriceUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              确认
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              房源: <span className="font-medium">{editingApartment?.apartmentNo}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              当前租金: <span className="font-medium">¥{Number(editingApartment?.monthlyRent || 0).toLocaleString()}/月</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新租金(元/月) *</label>
            <input
              type="number"
              value={priceData.monthlyRent}
              onChange={(e) => setPriceData({ ...priceData, monthlyRent: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生效日期 *</label>
            <input
              type="date"
              value={priceData.effectiveDate}
              onChange={(e) => setPriceData({ ...priceData, effectiveDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调整原因</label>
            <textarea
              value={priceData.reason}
              onChange={(e) => setPriceData({ ...priceData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
