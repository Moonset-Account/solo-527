import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye, Edit2, Trash2, GitCompare, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { quoteApi } from '../services/api';
import { Quote } from '../types';
import { formatCurrency, formatDateTime, formatPercent } from '../utils/format';

export const QuoteList: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
    demandId: searchParams.get('demandId') || '',
  });
  const navigate = useNavigate();

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await quoteApi.findAll(filters);
      setQuotes(response.data);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此报价单吗？')) {
      await quoteApi.remove(id);
      fetchQuotes();
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin < 15) return 'text-red-600';
    if (margin < 25) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">报价管理</h1>
            <p className="text-slate-500 mt-1">管理旅行定制报价单，支持版本对比</p>
          </div>
          <button
            onClick={() => navigate('/quotes/new')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus size={18} />
            新建报价
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="搜索客户名称或报价单号..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">全部状态</option>
                <option value="draft">草稿</option>
                <option value="pending_approval">待审批</option>
                <option value="approved">已审批</option>
                <option value="rejected">已拒绝</option>
                <option value="sent">已发送</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">报价信息</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">客户需求</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">金额</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">毛利率</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">创建人</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    暂无报价数据
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">报价单 #{quote.id.slice(0, 8)}</div>
                      <div className="text-sm text-slate-500">版本 {quote.version} | {quote.items.length} 项</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{quote.demand?.customerName || '-'}</div>
                      <div className="text-xs text-slate-500">
                        {quote.demand ? `${quote.demand.days}天${quote.demand.peopleCount}人` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{formatCurrency(quote.totalPrice)}</div>
                      <div className="text-xs text-slate-500">成本 {formatCurrency(quote.totalCost)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-medium ${getMarginColor(quote.profitMargin)}`}>
                          {formatPercent(quote.profitMargin)}
                        </span>
                        {quote.requiresManagerApproval && (
                          <AlertTriangle size={14} className="text-amber-500" />
                        )}
                      </div>
                      {quote.requiresManagerApproval && (
                        <div className="text-xs text-amber-600">需主管审批</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={quote.status} type="quote" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-medium">
                          {quote.createdBy?.name?.charAt(0) || '-'}
                        </div>
                        <span className="text-sm text-slate-700">{quote.createdBy?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/quotes/${quote.id}`)}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/quotes/${quote.id}/edit`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/quotes/${quote.id}/compare`)}
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="版本对比"
                        >
                          <GitCompare size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(quote.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
