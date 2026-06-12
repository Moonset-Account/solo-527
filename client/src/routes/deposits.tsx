import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, DEPOSIT_STATUS, DISPUTE_STATUS } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';

interface Deposit {
  id: number;
  amount: number;
  receivedDate: string;
  status: string;
  refundDate: string;
  refundAmount: number;
  deductionReason: string;
  hasDispute: boolean;
  note: string;
  apartment: { id: number; apartmentNo: string; building: string };
  customer: { id: number; name: string; phone: string };
  lease: { id: number };
}

interface Dispute {
  id: number;
  title: string;
  description: string;
  disputedAmount: number;
  status: string;
  closeNote: string;
  closedAt: string;
  createdAt: string;
  deposit: Deposit;
  apartment: { apartmentNo: string; building: string };
  customer: { name: string; phone: string };
}

export const Route = createFileRoute('/deposits')({
  component: DepositsPage,
});

function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'deposits' | 'disputes'>('deposits');
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [closeDisputeModalOpen, setCloseDisputeModalOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [refundFormData, setRefundFormData] = useState({
    refundDate: '',
    refundAmount: 0,
    deductionReason: '',
    note: '',
  });
  const [disputeFormData, setDisputeFormData] = useState({
    title: '',
    description: '',
    disputedAmount: 0,
    assigneeId: 0,
  });
  const [closeDisputeFormData, setCloseDisputeFormData] = useState({
    closeNote: '',
    resolution: 'other' as 'customer_wins' | 'company_wins' | 'partial' | 'other',
  });
  const { user } = useAuthStore();

  const fetchDeposits = () => {
    setLoading(true);
    apiClient
      .get('/deposits', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setDeposits(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchDisputes = () => {
    setLoading(true);
    apiClient
      .get('/deposits/disputes', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setDisputes(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    apiClient.get('/users').then((res) => {
      setUsers(res.data.list || res.data);
    });
  };

  useEffect(() => {
    if (activeTab === 'deposits') {
      fetchDeposits();
    } else {
      fetchDisputes();
    }
  }, [page, pageSize, filters, activeTab]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const handleRefund = () => {
    if (selectedDeposit) {
      apiClient.post(`/deposits/${selectedDeposit.id}/refund`, refundFormData).then(() => {
        setRefundModalOpen(false);
        fetchDeposits();
      });
    }
  };

  const handleCreateDispute = () => {
    if (selectedDeposit) {
      const data = {
        ...disputeFormData,
        assigneeId: disputeFormData.assigneeId || undefined,
      };
      apiClient.post(`/deposits/${selectedDeposit.id}/dispute`, data).then(() => {
        setDisputeModalOpen(false);
        fetchDeposits();
      });
    }
  };

  const handleCloseDispute = () => {
    if (selectedDispute) {
      apiClient.post(`/deposits/disputes/${selectedDispute.id}/close`, closeDisputeFormData).then(() => {
        setCloseDisputeModalOpen(false);
        fetchDisputes();
      });
    }
  };

  const openRefundModal = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setRefundFormData({
      refundDate: dayjs().format('YYYY-MM-DD'),
      refundAmount: Number(deposit.amount),
      deductionReason: '',
      note: '',
    });
    setRefundModalOpen(true);
  };

  const openDisputeModal = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setDisputeFormData({
      title: '',
      description: '',
      disputedAmount: Number(deposit.amount),
      assigneeId: 0,
    });
    setDisputeModalOpen(true);
  };

  const openCloseDisputeModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setCloseDisputeFormData({
      closeNote: '',
      resolution: 'other',
    });
    setCloseDisputeModalOpen(true);
  };

  const depositColumns = [
    {
      key: 'apartment',
      title: '房源',
      render: (r: Deposit) => `${r.apartment?.building || ''} ${r.apartment?.apartmentNo || ''}`,
    },
    {
      key: 'customer',
      title: '客户',
      render: (r: Deposit) => `${r.customer?.name || ''} (${r.customer?.phone || ''})`,
    },
    {
      key: 'amount',
      title: '押金金额',
      render: (r: Deposit) => `¥${Number(r.amount).toLocaleString()}`,
    },
    {
      key: 'receivedDate',
      title: '收款日期',
      render: (r: Deposit) => dayjs(r.receivedDate).format('YYYY-MM-DD'),
    },
    {
      key: 'status',
      title: '状态',
      render: (r: Deposit) => (
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(r.status, DEPOSIT_STATUS)}`}>
            {getStatusLabel(r.status, DEPOSIT_STATUS)}
          </span>
          {r.hasDispute && (
            <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
              有争议
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'refund',
      title: '退款信息',
      render: (r: Deposit) => r.refundDate ? `${dayjs(r.refundDate).format('YYYY-MM-DD')} ¥${Number(r.refundAmount).toLocaleString()}` : '-',
    },
  ];

  const disputeColumns = [
    {
      key: 'apartment',
      title: '房源',
      render: (r: Dispute) => `${r.apartment?.building || ''} ${r.apartment?.apartmentNo || ''}`,
    },
    {
      key: 'customer',
      title: '客户',
      render: (r: Dispute) => `${r.customer?.name || ''} (${r.customer?.phone || ''})`,
    },
    {
      key: 'title',
      title: '争议标题',
      render: (r: Dispute) => r.title,
    },
    {
      key: 'disputedAmount',
      title: '争议金额',
      render: (r: Dispute) => `¥${Number(r.disputedAmount).toLocaleString()}`,
    },
    {
      key: 'status',
      title: '状态',
      render: (r: Dispute) => (
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(r.status, DISPUTE_STATUS)}`}>
          {getStatusLabel(r.status, DISPUTE_STATUS)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (r: Dispute) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">押金管理</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => { setActiveTab('deposits'); setPage(1); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'deposits'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              押金记录
            </button>
            <button
              onClick={() => { setActiveTab('disputes'); setPage(1); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'disputes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              押金争议
            </button>
          </nav>
        </div>
      </div>

      <SearchFilter
        filters={filters}
        onChange={setFilters}
        onSearch={() => setPage(1)}
        statusOptions={activeTab === 'deposits' ? DEPOSIT_STATUS : DISPUTE_STATUS}
        showDateRange={true}
        showAssignee={activeTab === 'disputes'}
        assigneeOptions={users.map((u) => ({ value: u.id, label: u.name }))}
      />

      {activeTab === 'deposits' ? (
        <DataTable
          columns={depositColumns}
          data={deposits}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          rowKey={(r) => r.id}
          actions={(r) =>
            r.status === 'held' && (
              <>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => openRefundModal(r)}
                    className="text-green-600 hover:text-green-800"
                  >
                    退款
                  </button>
                )}
                <button
                  onClick={() => openDisputeModal(r)}
                  className="text-red-600 hover:text-red-800"
                >
                  发起争议
                </button>
              </>
            )
          }
        />
      ) : (
        <DataTable
          columns={disputeColumns}
          data={disputes}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          rowKey={(r) => r.id}
          actions={(r) =>
            r.status !== 'closed' && (
              <button
                onClick={() => openCloseDisputeModal(r)}
                className="text-blue-600 hover:text-blue-800"
              >
                关闭
              </button>
            )
          }
        />
      )}

      <Modal
        open={refundModalOpen}
        title="押金退款"
        onClose={() => setRefundModalOpen(false)}
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setRefundModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleRefund}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              确认退款
            </button>
          </>
        }
      >
        {selectedDeposit && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">
                房源: <span className="font-medium">{selectedDeposit.apartment?.building} {selectedDeposit.apartment?.apartmentNo}</span>
                {' | '}客户: <span className="font-medium">{selectedDeposit.customer?.name}</span>
                {' | '}押金金额: <span className="font-medium text-green-600">¥{Number(selectedDeposit.amount).toLocaleString()}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款日期 *</label>
                <input
                  type="date"
                  value={refundFormData.refundDate}
                  onChange={(e) => setRefundFormData({ ...refundFormData, refundDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款金额(元) *</label>
                <input
                  type="number"
                  value={refundFormData.refundAmount}
                  onChange={(e) => setRefundFormData({ ...refundFormData, refundAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">扣款原因</label>
                <input
                  type="text"
                  value={refundFormData.deductionReason}
                  onChange={(e) => setRefundFormData({ ...refundFormData, deductionReason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="如有扣款，请说明原因"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={refundFormData.note}
                  onChange={(e) => setRefundFormData({ ...refundFormData, note: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="其他说明..."
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={disputeModalOpen}
        title="发起押金争议"
        onClose={() => setDisputeModalOpen(false)}
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setDisputeModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleCreateDispute}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              提交争议
            </button>
          </>
        }
      >
        {selectedDeposit && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                房源: <span className="font-medium">{selectedDeposit.apartment?.building} {selectedDeposit.apartment?.apartmentNo}</span>
                {' | '}客户: <span className="font-medium">{selectedDeposit.customer?.name}</span>
                {' | '}押金金额: <span className="font-medium">¥{Number(selectedDeposit.amount).toLocaleString()}</span>
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">争议标题 *</label>
                <input
                  type="text"
                  value={disputeFormData.title}
                  onChange={(e) => setDisputeFormData({ ...disputeFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="简要描述争议问题"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">争议详情 *</label>
                <textarea
                  value={disputeFormData.description}
                  onChange={(e) => setDisputeFormData({ ...disputeFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="详细描述争议情况..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">争议金额(元) *</label>
                <input
                  type="number"
                  value={disputeFormData.disputedAmount}
                  onChange={(e) => setDisputeFormData({ ...disputeFormData, disputedAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">指定处理人</label>
                  <select
                    value={disputeFormData.assigneeId}
                    onChange={(e) => setDisputeFormData({ ...disputeFormData, assigneeId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={0}>不指定（默认为当前用户）</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">注意：</span>发起争议后将自动生成高优先级待办事项，并发送给处理人。
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={closeDisputeModalOpen}
        title="关闭押金争议"
        onClose={() => setCloseDisputeModalOpen(false)}
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setCloseDisputeModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleCloseDispute}
              disabled={!closeDisputeFormData.closeNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              确认关闭
            </button>
          </>
        }
      >
        {selectedDispute && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">
                标题: <span className="font-medium">{selectedDispute.title}</span>
              </p>
              <p className="text-sm mt-1">
                争议金额: <span className="font-medium text-red-600">¥{Number(selectedDispute.disputedAmount).toLocaleString()}</span>
              </p>
              <p className="text-sm mt-1 text-gray-600">
                {selectedDispute.description}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">处理结果</label>
              <select
                value={closeDisputeFormData.resolution}
                onChange={(e) => setCloseDisputeFormData({ ...closeDisputeFormData, resolution: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="customer_wins">客户胜诉（全额退款）</option>
                <option value="company_wins">公司胜诉（不予退款）</option>
                <option value="partial">部分退款</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                处理说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={closeDisputeFormData.closeNote}
                onChange={(e) => setCloseDisputeFormData({ ...closeDisputeFormData, closeNote: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="请详细说明处理过程和结果，此为必填项..."
                required
              />
              {!closeDisputeFormData.closeNote.trim() && (
                <p className="mt-1 text-sm text-red-500">处理说明不能为空</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
