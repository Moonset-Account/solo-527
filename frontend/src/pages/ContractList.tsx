import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye, CheckCircle, XCircle, Clock, User, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { contractApi } from '../services/api';
import { Contract } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

export const ContractList: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
  });
  const navigate = useNavigate();

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await contractApi.findAll(filters);
      setContracts(response.data);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [filters]);

  const handleApprove = async (id: string) => {
    const comment = prompt('请输入审批意见（可选）：');
    if (comment !== null) {
      await contractApi.approve(id, comment);
      fetchContracts();
    }
  };

  const handleReject = async (id: string) => {
    const comment = prompt('请输入拒绝原因：');
    if (comment) {
      await contractApi.reject(id, comment);
      fetchContracts();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">合同审批</h1>
            <p className="text-slate-500 mt-1">管理合同审批流程</p>
          </div>
          <button
            onClick={() => navigate('/contracts/new')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus size={18} />
            新建合同
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="搜索合同或客户名称..."
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
                <option value="pending">待审批</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
                <option value="signed">已签署</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">合同编号</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">关联报价</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">金额</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">创建时间</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    暂无合同数据
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">HT#{contract.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">
                        报价 #{contract.quote?.id.slice(0, 8) || '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {contract.quote?.demand?.customerName || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">
                        {formatCurrency(contract.quote?.totalPrice || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={contract.status} type="contract" />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDateTime(contract.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye size={16} />
                        </button>
                        {contract.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(contract.id)}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="通过"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(contract.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="拒绝"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
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
