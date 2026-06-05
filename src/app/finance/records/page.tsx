'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  FileText,
  Calendar,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency, hasPermission } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface FinanceRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: string;
  description: string | null;
  receiptUrl: string | null;
  recordedAt: string;
  recordedBy: { name: string };
  relatedOrder: { orderNo: string; id: string } | null;
}

export default function FinanceRecordsPage() {
  const { data: session } = useSession();
  const canManage = hasPermission(session?.user?.role || 'USER', [
    'SUPER_ADMIN',
    'COMMITTEE',
  ]);

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const stats = {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
  };

  records.forEach((record) => {
    const amount = parseFloat(record.amount);
    if (record.type === 'INCOME') {
      stats.totalIncome += amount;
    } else {
      stats.totalExpense += amount;
    }
  });
  stats.netProfit = stats.totalIncome - stats.totalExpense;

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);

      const res = await fetch(`/api/v1/finance/records?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Failed to fetch finance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);

      const res = await fetch(`/api/v1/finance/export?${params.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-report-${formatDate(new Date(), 'yyyyMMdd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
      category: '',
    });
  };

  const categories = Array.from(new Set(records.map((r) => r.category)));

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const categoryColors: Record<string, string> = {
    INCOME: 'text-green-600 bg-green-50',
    EXPENSE: 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            财务管理
          </h1>
          <p className="text-gray-500 mt-1">管理收入支出和财务记录</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'border-primary text-primary bg-primary/5'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <Filter className="h-5 w-5" />
            <span>筛选</span>
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span>{exporting ? '导出中...' : '导出报表'}</span>
          </button>
          {canManage && (
            <Link
              href="/finance/records/new"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>新增记录</span>
            </Link>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">筛选条件</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-primary flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>重置</span>
            </button>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始日期
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束日期
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类型
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="">全部</option>
                <option value="INCOME">收入</option>
                <option value="EXPENSE">支出</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="">全部</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>当前筛选口径：</strong>
                {filters.startDate && ` 开始日期：${filters.startDate}`}
                {filters.endDate && ` 结束日期：${filters.endDate}`}
                {filters.type &&
                  ` 类型：${filters.type === 'INCOME' ? '收入' : '支出'}`}
                {filters.category && ` 分类：${filters.category}`}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500">总收入</p>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(stats.totalIncome)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500">总支出</p>
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(stats.totalExpense)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500">净利润</p>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p
            className={`text-3xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(stats.netProfit)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            财务记录
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                (筛选后 {records.length} 条)
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    相关订单
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    记录人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    附件
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(record.recordedAt, 'yyyy-MM-dd')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[record.type]}`}
                      >
                        {record.type === 'INCOME' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {record.type === 'INCOME' ? '收入' : '支出'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-semibold ${record.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {record.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(record.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-gray-600 truncate">
                        {record.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.relatedOrder ? (
                        <Link
                          href={`/tickets/orders/${record.relatedOrder.id}`}
                          className="text-primary hover:underline"
                        >
                          {record.relatedOrder.orderNo}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.recordedBy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.receiptUrl ? (
                        <a
                          href={record.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center text-sm"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          查看
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && records.length === 0 && (
          <div className="text-center py-16">
            <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无财务记录
            </h3>
            <p className="text-gray-500">
              {activeFiltersCount > 0
                ? '当前筛选条件下没有记录，请调整筛选条件'
                : '点击上方按钮添加第一条记录'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
