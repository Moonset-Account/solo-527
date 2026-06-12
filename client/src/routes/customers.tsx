import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import dayjs from 'dayjs';

interface Customer {
  id: number;
  name: string;
  phone: string;
  idCard: string;
  source: string;
  requirements: string;
  consultantId: number;
  createdAt: string;
}

export const Route = createFileRoute('/customers')({
  component: CustomersPage,
});

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer & { viewings?: unknown[]; followUps?: unknown[] } | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  const fetchCustomers = () => {
    setLoading(true);
    apiClient
      .get('/customers', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setCustomers(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, pageSize, filters]);

  const handleSubmit = () => {
    const promise = editingCustomer
      ? apiClient.put(`/customers/${editingCustomer.id}`, formData)
      : apiClient.post('/customers', formData);
    
    promise.then(() => {
      setModalOpen(false);
      fetchCustomers();
      setEditingCustomer(null);
      setFormData({});
    });
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData(c);
    setModalOpen(true);
  };

  const handleViewDetail = (id: number) => {
    apiClient.get(`/customers/${id}`).then((res) => {
      setSelectedCustomer(res.data);
      setDetailModalOpen(true);
    });
  };

  const sourceOptions = ['线上', '转介绍', '门店', '其他'];

  const columns = [
    { key: 'name', title: '姓名' },
    { key: 'phone', title: '手机号' },
    { key: 'source', title: '客户来源' },
    { key: 'requirements', title: '需求', width: '200px' },
    { key: 'createdAt', title: '创建时间', render: (r: Customer) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">客户管理</h1>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({});
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新增客户
        </button>
      </div>

      <SearchFilter
        filters={filters}
        onChange={setFilters}
        onSearch={() => setPage(1)}
        showStatus={false}
        extraFilters={
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户来源</label>
            <select
              value={(filters.source as string) || ''}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部来源</option>
              {sourceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(r) => r.id}
        actions={(r) => (
          <>
            <button
              onClick={() => handleViewDetail(r.id)}
              className="text-blue-600 hover:text-blue-800"
            >
              详情
            </button>
            <button
              onClick={() => handleEdit(r)}
              className="text-green-600 hover:text-green-800"
            >
              编辑
            </button>
          </>
        )}
      />

      <Modal
        open={modalOpen}
        title={editingCustomer ? '编辑客户' : '新增客户'}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
              <input
                type="text"
                value={formData.idCard || ''}
                onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户来源</label>
              <select
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">请选择</option>
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户需求</label>
            <textarea
              value={formData.requirements || ''}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="描述客户的租房需求..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={detailModalOpen}
        title="客户详情"
        onClose={() => setDetailModalOpen(false)}
        width="max-w-4xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">姓名</p>
                <p className="font-medium">{selectedCustomer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">手机号</p>
                <p className="font-medium">{selectedCustomer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">身份证号</p>
                <p className="font-medium">{selectedCustomer.idCard || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">客户来源</p>
                <p className="font-medium">{selectedCustomer.source || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">客户需求</p>
                <p className="font-medium">{selectedCustomer.requirements || '-'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">看房记录</h3>
              {selectedCustomer.viewings?.length ? (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">房源</th>
                        <th className="px-4 py-2 text-left">看房时间</th>
                        <th className="px-4 py-2 text-left">状态</th>
                        <th className="px-4 py-2 text-left">反馈</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedCustomer.viewings as Array<{ apartmentNo?: string; viewingDate: string; status: string; feedback: string }>).map((v, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2">{v.apartmentNo || '-'}</td>
                          <td className="px-4 py-2">{dayjs(v.viewingDate).format('YYYY-MM-DD HH:mm')}</td>
                          <td className="px-4 py-2">{v.status}</td>
                          <td className="px-4 py-2">{v.feedback || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">暂无看房记录</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">跟进记录</h3>
              {selectedCustomer.followUps?.length ? (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">类型</th>
                        <th className="px-4 py-2 text-left">内容</th>
                        <th className="px-4 py-2 text-left">结果</th>
                        <th className="px-4 py-2 text-left">下次跟进</th>
                        <th className="px-4 py-2 text-left">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedCustomer.followUps as Array<{ type: string; content: string; result: string; nextFollowDate: string; createdAt: string }>).map((f, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2">{f.type}</td>
                          <td className="px-4 py-2 max-w-xs truncate">{f.content}</td>
                          <td className="px-4 py-2">{f.result || '-'}</td>
                          <td className="px-4 py-2">{f.nextFollowDate ? dayjs(f.nextFollowDate).format('YYYY-MM-DD') : '-'}</td>
                          <td className="px-4 py-2">{dayjs(f.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">暂无跟进记录</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
