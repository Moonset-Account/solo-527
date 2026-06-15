import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

export const Route = createLazyFileRoute('/receipts/')({
  component: ReceiptsIndex,
});

interface Receipt {
  id: string;
  receiptNo: string;
  receiptType: string;
  amount: number;
  status: string;
  pet: {
    id: string;
    name: string;
  };
  createdAt: string;
}

function ReceiptsIndex() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [receiptType, setReceiptType] = useState('');

  useEffect(() => {
    loadReceipts();
  }, [status, receiptType]);

  const loadReceipts = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (receiptType) params.append('receiptType', receiptType);

      const { data } = await apiClient.get(`/receipts?${params.toString()}`);
      setReceipts(data.items);
    } catch (error) {
      console.error('Failed to load receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      draft: '草稿',
      pending: '待处理',
      paid: '已完成',
      cancelled: '已取消',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">单据管理</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + 新增单据
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="pending">待处理</option>
            <option value="paid">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <select
            value={receiptType}
            onChange={(e) => setReceiptType(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            <option value="fostering">寄养费</option>
            <option value="medical">医疗费</option>
            <option value="grooming">洗护费</option>
            <option value="other">其他</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">单据编号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">关联宠物</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金额</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-600">{receipt.receiptNo}</td>
                <td className="px-4 py-3 text-gray-600">{receipt.pet?.name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {receipt.receiptType === 'fostering'
                    ? '寄养费'
                    : receipt.receiptType === 'medical'
                    ? '医疗费'
                    : receipt.receiptType === 'grooming'
                    ? '洗护费'
                    : '其他'}
                </td>
                <td className="px-4 py-3 font-medium">
                  {receipt.amount ? `¥${(receipt.amount / 100).toFixed(2)}` : '-'}
                </td>
                <td className="px-4 py-3">{getStatusBadge(receipt.status)}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {new Date(receipt.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/receipts/$id"
                    params={{ id: receipt.id }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
