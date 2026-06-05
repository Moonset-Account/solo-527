import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  FileText,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency, hasPermission } from '@/lib/utils';

export default async function FinanceRecordsPage() {
  const session = await auth();
  const canManage = hasPermission(session?.user?.role || 'USER', [
    'SUPER_ADMIN',
    'COMMITTEE',
  ]);

  const [records, stats] = await Promise.all([
    prisma.financeRecord.findMany({
      include: {
        recordedBy: true,
        relatedOrder: true,
      },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    }),
    prisma.financeRecord.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        type: 'INCOME',
      },
    }),
  ]);

  const expenseStats = await prisma.financeRecord.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      type: 'EXPENSE',
    },
  });

  const totalIncome = parseFloat(stats._sum.amount?.toString() || '0');
  const totalExpense = parseFloat(expenseStats._sum.amount?.toString() || '0');
  const netProfit = totalIncome - totalExpense;

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
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>导出报表</span>
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

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500">总收入</p>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(totalIncome)}
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
            {formatCurrency(totalExpense)}
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
            className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(netProfit)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">财务记录</h3>
        </div>
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
                      {formatCurrency(record.amount.toString())}
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

        {records.length === 0 && (
          <div className="text-center py-16">
            <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无财务记录</h3>
            <p className="text-gray-500">点击上方按钮添加第一条记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
