import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';
import dayjs from 'dayjs';

const refundTypeLabels = {
  full_refund: '全额退款',
  partial_refund: '部分退款',
  service_fee_refund: '服务费退款',
  parts_refund: '配件退款',
  other: '其他'
};

const refundReasonLabels = {
  cancelled_before_service: '服务前取消',
  service_not_satisfied: '服务不满意',
  repair_failed: '维修失败',
  duplicate_charge: '重复收费',
  price_dispute: '价格争议',
  other: '其他'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  processed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  processed: '已退款',
  cancelled: '已取消'
};

export default function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    refundReason: 'all'
  });
  
  useEffect(() => {
    loadRefunds();
  }, [pagination.page, filters]);
  
  const loadRefunds = async () => {
    setLoading(true);
    try {
      const result = await api.get('/orders/refunds/list', {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      });
      if (result.success) {
        setRefunds(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('加载退款列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadDetail = async (id) => {
    try {
      const result = await api.get(`/orders/refunds/${id}`);
    } catch (e) {}
    const item = refunds.find(r => r._id === id);
    if (item) {
      setSelectedItem(item);
      setShowDetail(true);
    }
  };
  
  const processRefund = async (status) => {
    if (!confirm(`确定要${status === 'approved' ? '通过' : status === 'processed' ? '处理' : '驳回'}该退款申请吗？`)) return;
    try {
      await api.put(`/orders/refunds/${selectedItem._id}`, { status });
      setShowDetail(false);
      loadRefunds();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };
  
  return (
    <AdminLayout title="退款管理">
      <div className="space-y-4">
        <div className="flex gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="select"
            style={{ width: '140px' }}
          >
            <option value="all">全部状态</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          <select
            value={filters.refundReason}
            onChange={(e) => setFilters(prev => ({ ...prev, refundReason: e.target.value }))}
            className="select"
            style={{ width: '160px' }}
          >
            <option value="all">全部原因</option>
            {Object.entries(refundReasonLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">退款单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">关联订单</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型/原因</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">退款金额</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">订单金额</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">申请时间</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                  refunds.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{item.refundNo}</td>
                      <td className="px-4 py-3 text-gray-600">{item.orderNo}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">{refundTypeLabels[item.refundType]}</p>
                        <p className="text-xs text-gray-500">{refundReasonLabels[item.refundReason]}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        -¥{item.refundAmount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ¥{item.orderAmount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {dayjs(item.createdAt).format('MM-DD HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
          
          {pagination.total > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                共 {pagination.total} 条
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 })}
                  disabled={pagination.page <= 1}
                  className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showDetail && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">退款详情</h3>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                <p className="text-gray-500">退款单号</p>
                <p className="font-medium">{selectedItem.refundNo}</p>
              </div>
              <div>
                <p className="text-gray-500">关联订单</p>
                <p className="font-medium">{selectedItem.orderNo}</p>
              </div>
              <div>
                <p className="text-gray-500">退款类型</p>
                <p>{refundTypeLabels[selectedItem.refundType]}</p>
              </div>
              <div>
                <p className="text-gray-500">退款原因</p>
                <p>{refundReasonLabels[selectedItem.refundReason]}</p>
              </div>
              <div>
                <p className="text-gray-500">订单金额</p>
                <p>¥{selectedItem.orderAmount?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">退款金额</p>
                <p className="text-red-600 font-medium">-¥{selectedItem.refundAmount?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">退款方式</p>
                <p>{selectedItem.refundMethod || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">申请人</p>
                <p>{selectedItem.applicant || '-'}</p>
              </div>
            </div>
            
            {selectedItem.reasonDetail && (
              <div>
                <p className="text-sm text-gray-500 mb-1">详细说明</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                  {selectedItem.reasonDetail}
                </p>
              </div>
            )}
            
            {selectedItem.reviewRemark && (
              <div>
                <p className="text-sm text-gray-500 mb-1">审核意见</p>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg text-sm">
                  {selectedItem.reviewRemark}
                </p>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className={`px-3 py-1 text-sm rounded-full ${statusColors[selectedItem.status]}`}>
                {statusLabels[selectedItem.status]}
              </span>
              
              {selectedItem.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => processRefund('rejected')}
                    className="btn btn-danger text-sm"
                  >
                    驳回
                  </button>
                  <button
                    onClick={() => processRefund('approved')}
                    className="btn btn-success text-sm"
                  >
                    通过
                  </button>
                </div>
              )}
              
              {selectedItem.status === 'approved' && (
                <button
                  onClick={() => processRefund('processed')}
                  className="btn btn-primary text-sm"
                >
                  确认退款
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
