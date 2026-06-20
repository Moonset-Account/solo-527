import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';
import dayjs from 'dayjs';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  refunded: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: '待确认',
  confirmed: '已确认',
  assigned: '已派单',
  in_progress: '维修中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
};

const urgencyLabels = {
  normal: '普通',
  urgent: '加急',
  emergency: '紧急'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [assignForm, setAssignForm] = useState({ technicianId: '', remark: '' });
  const [rescheduleForm, setRescheduleForm] = useState({ newTime: '', reason: 'customer_request', reasonDetail: '', extraFee: 0 });
  const [refundForm, setRefundForm] = useState({ refundType: 'partial_refund', refundReason: 'service_not_satisfied', reasonDetail: '', refundAmount: 0, refundMethod: 'original_payment' });
  const [filters, setFilters] = useState({
    status: 'all',
    applianceType: 'all',
    keyword: ''
  });
  
  useEffect(() => {
    loadOrders();
  }, [pagination.page, filters]);
  
  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const result = await api.get('/orders', params);
      if (result.success) {
        setOrders(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadOrderDetail = async (orderId) => {
    try {
      const result = await api.get(`/orders/${orderId}`);
      if (result.success) {
        setSelectedOrder(result.data);
        setShowDetail(true);
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
    }
  };
  
  const loadTechnicians = async () => {
    try {
      const result = await api.get('/technicians/available');
      if (result.success) {
        setTechnicians(result.data);
      }
    } catch (error) {
      console.error('加载师傅列表失败:', error);
    }
  };
  
  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/orders/${selectedOrder._id}/assign`, assignForm);
      setShowAssignModal(false);
      setAssignForm({ technicianId: '', remark: '' });
      loadOrders();
      loadOrderDetail(selectedOrder._id);
    } catch (error) {
      alert(error.message || '派单失败');
    }
  };
  
  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/orders/${selectedOrder._id}/reschedule`, rescheduleForm);
      setShowRescheduleModal(false);
      setRescheduleForm({ newTime: '', reason: 'customer_request', reasonDetail: '', extraFee: 0 });
      loadOrders();
      loadOrderDetail(selectedOrder._id);
    } catch (error) {
      alert(error.message || '改约失败');
    }
  };
  
  const handleRefund = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/orders/${selectedOrder._id}/refund`, refundForm);
      setShowRefundModal(false);
      setRefundForm({ refundType: 'partial_refund', refundReason: 'service_not_satisfied', reasonDetail: '', refundAmount: 0, refundMethod: 'original_payment' });
      loadOrders();
      loadOrderDetail(selectedOrder._id);
    } catch (error) {
      alert(error.message || '退款申请失败');
    }
  };
  
  const updateOrderStatus = async (status) => {
    if (!confirm(`确定要将订单状态变更为"${statusLabels[status]}"吗？`)) return;
    try {
      await api.put(`/orders/${selectedOrder._id}/status`, { status });
      loadOrders();
      loadOrderDetail(selectedOrder._id);
    } catch (error) {
      alert(error.message || '状态更新失败');
    }
  };
  
  const openAssignModal = () => {
    loadTechnicians();
    setShowAssignModal(true);
  };
  
  return (
    <AdminLayout title="订单管理">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-wrap">
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
              value={filters.applianceType}
              onChange={(e) => setFilters(prev => ({ ...prev, applianceType: e.target.value }))}
              className="select"
              style={{ width: '140px' }}
            >
              <option value="all">全部家电</option>
              {['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="搜索订单号/客户名/电话"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              className="input"
              style={{ width: '220px' }}
            />
          </div>
          
          <button
            onClick={() => loadOrders()}
            className="btn btn-secondary"
          >
            刷新
          </button>
        </div>
        
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户信息</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">家电类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">预约时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">师傅</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金额</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => loadOrderDetail(order._id)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-blue-600">{order.orderNo}</p>
                      {order.urgencyLevel && order.urgencyLevel !== 'normal' && (
                        <span className={`text-xs ${order.urgencyLevel === 'emergency' ? 'text-red-600' : 'text-orange-600'}`}>
                          [{urgencyLabels[order.urgencyLevel]}]
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {order.applianceType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {dayjs(order.appointmentTime).format('YYYY-MM-DD HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.technicianName || <span className="text-gray-400">未派单</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      ¥{order.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        onClick={(e) => { e.stopPropagation(); loadOrderDetail(order._id); }}
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
                共 {pagination.total} 条，第 {pagination.page} / {pagination.totalPages} 页
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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
      
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold">{selectedOrder.orderNo}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">客户信息</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                    <p><span className="text-gray-500">姓名：</span>{selectedOrder.customerName}</p>
                    <p><span className="text-gray-500">电话：</span>{selectedOrder.customerPhone}</p>
                    <p><span className="text-gray-500">地址：</span>{selectedOrder.customerAddress}</p>
                    <p><span className="text-gray-500">门店：</span>{selectedOrder.store || '-'}</p>
                    <p><span className="text-gray-500">客服：</span>{selectedOrder.customerService || '-'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">家电信息</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                    <p><span className="text-gray-500">类型：</span>{selectedOrder.applianceType}</p>
                    <p><span className="text-gray-500">品牌：</span>{selectedOrder.applianceBrand || '-'}</p>
                    <p><span className="text-gray-500">型号：</span>{selectedOrder.applianceModel || '-'}</p>
                    <p><span className="text-gray-500">故障描述：</span>{selectedOrder.faultDescription}</p>
                    <p><span className="text-gray-500">紧急程度：</span>{urgencyLabels[selectedOrder.urgencyLevel]}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">预约与派单</h4>
                <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-4 text-sm">
                  <p><span className="text-gray-500">预约时间：</span>{dayjs(selectedOrder.appointmentTime).format('YYYY-MM-DD HH:mm')}</p>
                  <p><span className="text-gray-500">师傅：</span>{selectedOrder.technicianName || '未派单'}</p>
                  <p><span className="text-gray-500">改约次数：</span>{selectedOrder.rescheduleCount || 0} 次</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">价格明细</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">项目</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">金额</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.pricingBreakdown && selectedOrder.pricingBreakdown.length > 0 ? (
                        selectedOrder.pricingBreakdown.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{item.name}</td>
                            <td className={`px-3 py-2 text-right ${item.amount < 0 ? 'text-green-600' : ''}`}>
                              {item.amount < 0 ? '-' : ''}¥{Math.abs(item.amount).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-gray-500">{item.description || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-3 py-4 text-center text-gray-400">暂无价格明细</td>
                        </tr>
                      )}
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-3 py-2">合计</td>
                        <td className="px-3 py-2 text-right text-blue-600">¥{selectedOrder.totalAmount?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-gray-500">
                          支付状态：{selectedOrder.paymentStatus === 'paid' ? '已支付' : '未支付'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {selectedOrder.parts && selectedOrder.parts.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">配件明细</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">配件名称</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">数量</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">单价</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">小计</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.parts.map((part, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{part.partName}</td>
                            <td className="px-3 py-2 text-center">{part.quantity}</td>
                            <td className="px-3 py-2 text-right">¥{part.unitPrice?.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">¥{part.subtotal?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {selectedOrder.status === 'pending' && (
                  <button onClick={() => updateOrderStatus('confirmed')} className="btn btn-primary">
                    确认订单
                  </button>
                )}
                
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                  <button onClick={openAssignModal} className="btn btn-success">
                    派单
                  </button>
                )}
                
                {selectedOrder.status === 'assigned' && (
                  <button onClick={() => updateOrderStatus('in_progress')} className="btn btn-primary">
                    开始维修
                  </button>
                )}
                
                {selectedOrder.status === 'in_progress' && (
                  <button onClick={() => updateOrderStatus('completed')} className="btn btn-success">
                    完成订单
                  </button>
                )}
                
                {(selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'refunded') && (
                  <button onClick={() => setShowRescheduleModal(true)} className="btn btn-secondary">
                    改约
                  </button>
                )}
                
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                  <button onClick={() => updateOrderStatus('cancelled')} className="btn btn-danger">
                    取消订单
                  </button>
                )}
                
                {(selectedOrder.status === 'completed' || selectedOrder.status === 'confirmed') && (
                  <button onClick={() => { setRefundForm(prev => ({ ...prev, refundAmount: selectedOrder.totalAmount })); setShowRefundModal(true); }} className="btn btn-danger">
                    申请退款
                  </button>
                )}
              </div>
              
              {selectedOrder.rescheduleRecords && selectedOrder.rescheduleRecords.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">改约记录</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">原时间</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">新时间</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">原因</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">额外费用</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作人</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.rescheduleRecords.map((record, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{dayjs(record.originalTime).format('MM-DD HH:mm')}</td>
                            <td className="px-3 py-2">{dayjs(record.newTime).format('MM-DD HH:mm')}</td>
                            <td className="px-3 py-2">{record.reason}</td>
                            <td className="px-3 py-2 text-right">¥{record.extraFee?.toFixed(2)}</td>
                            <td className="px-3 py-2 text-gray-500">{record.operatorName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {selectedOrder.refunds && selectedOrder.refunds.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">退款记录</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">退款单号</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">类型</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">原因</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">金额</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.refunds.map((refund, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{refund.refundNo}</td>
                            <td className="px-3 py-2">{refund.refundType}</td>
                            <td className="px-3 py-2">{refund.refundReason}</td>
                            <td className="px-3 py-2 text-right">¥{refund.refundAmount?.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                refund.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                refund.status === 'processed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {refund.status === 'pending' ? '待审批' :
                                 refund.status === 'approved' ? '已通过' :
                                 refund.status === 'processed' ? '已退款' :
                                 refund.status === 'rejected' ? '已驳回' : '已取消'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">指派师傅</h3>
            </div>
            
            <form onSubmit={handleAssign} className="p-5 space-y-4">
              <div>
                <label className="label">选择师傅 *</label>
                <select
                  value={assignForm.technicianId}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, technicianId: e.target.value }))}
                  className="select"
                  required
                >
                  <option value="">请选择师傅</option>
                  {technicians.map(tech => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name} ({tech.level}) - ★{tech.rating?.toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">备注</label>
                <textarea
                  value={assignForm.remark}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, remark: e.target.value }))}
                  className="input"
                  rows="2"
                  placeholder="派单备注"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认派单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showRescheduleModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">改约</h3>
            </div>
            
            <form onSubmit={handleReschedule} className="p-5 space-y-4">
              <div>
                <label className="label">新预约时间 *</label>
                <input
                  type="datetime-local"
                  value={rescheduleForm.newTime}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, newTime: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="label">改约原因 *</label>
                <select
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="select"
                >
                  <option value="customer_request">客户要求</option>
                  <option value="technician_unavailable">师傅无法上门</option>
                  <option value="store_rearrange">门店调整</option>
                  <option value="other">其他原因</option>
                </select>
              </div>
              
              <div>
                <label className="label">原因详情</label>
                <textarea
                  value={rescheduleForm.reasonDetail}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, reasonDetail: e.target.value }))}
                  className="input"
                  rows="2"
                  placeholder="详细说明"
                />
              </div>
              
              <div>
                <label className="label">额外费用(元)</label>
                <input
                  type="number"
                  value={rescheduleForm.extraFee}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, extraFee: Number(e.target.value) }))}
                  className="input"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认改约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">申请退款</h3>
            </div>
            
            <form onSubmit={handleRefund} className="p-5 space-y-4">
              <div>
                <label className="label">退款类型 *</label>
                <select
                  value={refundForm.refundType}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, refundType: e.target.value }))}
                  className="select"
                >
                  <option value="full_refund">全额退款</option>
                  <option value="partial_refund">部分退款</option>
                  <option value="service_fee_refund">服务费退款</option>
                  <option value="parts_refund">配件退款</option>
                  <option value="other">其他</option>
                </select>
              </div>
              
              <div>
                <label className="label">退款原因 *</label>
                <select
                  value={refundForm.refundReason}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, refundReason: e.target.value }))}
                  className="select"
                >
                  <option value="cancelled_before_service">服务前取消</option>
                  <option value="service_not_satisfied">服务不满意</option>
                  <option value="repair_failed">维修失败</option>
                  <option value="duplicate_charge">重复收费</option>
                  <option value="price_dispute">价格争议</option>
                  <option value="other">其他</option>
                </select>
              </div>
              
              <div>
                <label className="label">退款金额(元) *</label>
                <input
                  type="number"
                  value={refundForm.refundAmount}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, refundAmount: Number(e.target.value) }))}
                  className="input"
                  min="0"
                  step="0.01"
                  max={selectedOrder.totalAmount}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">订单总金额: ¥{selectedOrder.totalAmount?.toFixed(2)}</p>
              </div>
              
              <div>
                <label className="label">退款方式</label>
                <select
                  value={refundForm.refundMethod}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, refundMethod: e.target.value }))}
                  className="select"
                >
                  <option value="original_payment">原路退回</option>
                  <option value="cash">现金</option>
                  <option value="transfer">转账</option>
                  <option value="other">其他</option>
                </select>
              </div>
              
              <div>
                <label className="label">详细说明</label>
                <textarea
                  value={refundForm.reasonDetail}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, reasonDetail: e.target.value }))}
                  className="input"
                  rows="3"
                  placeholder="请详细说明退款原因"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowRefundModal(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-danger">
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
