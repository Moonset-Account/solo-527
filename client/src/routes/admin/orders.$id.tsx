import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { orderApi } from '../../api';
import dayjs from 'dayjs';

export const Route = createFileRoute('/admin/orders/$id')({
  component: OrderDetailPage,
});

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待分配', color: 'bg-yellow-100 text-yellow-800' },
  assigned: { label: '已派单', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '维修中', color: 'bg-purple-100 text-purple-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
  refunded: { label: '已退款', color: 'bg-red-100 text-red-800' },
};

const sourceMap: Record<string, string> = {
  online: '线上预约',
  phone: '电话预约',
  walk_in: '到店预约',
  referral: '客户推荐',
  third_party: '第三方平台',
};

const delayReasonMap: Record<string, string> = {
  technician_shortage: '师傅人手不足',
  parts_unavailable: '配件缺货',
  customer_reschedule: '客户改约',
  weather: '天气原因',
  traffic: '交通拥堵',
  complex_repair: '维修难度大',
  other: '其他原因',
};

function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await orderApi.detail(parseInt(id));
      setOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-gray-500">订单不存在</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/admin/orders' })}
          className="text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </button>
        <h1 className="text-2xl font-bold text-gray-800">订单详情</h1>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusMap[order.status]?.color}`}>
          {statusMap[order.status]?.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">订单号：</span>
                <span className="text-gray-800 font-medium">{order.orderNo}</span>
              </div>
              <div>
                <span className="text-gray-500">来源：</span>
                <span className="text-gray-800">{sourceMap[order.source] || order.source}</span>
              </div>
              <div>
                <span className="text-gray-500">创建时间：</span>
                <span className="text-gray-800">{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              </div>
              <div>
                <span className="text-gray-500">城市：</span>
                <span className="text-gray-800">{order.city || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">客户信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">姓名：</span>
                <span className="text-gray-800 font-medium">{order.user?.name || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">手机号：</span>
                <span className="text-gray-800">{order.user?.phone || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">地址：</span>
                <span className="text-gray-800">{order.address || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">故障信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500">家电类型：</span>
                <span className="text-gray-800 font-medium">{order.applianceType}</span>
              </div>
              <div>
                <span className="text-gray-500">品牌：</span>
                <span className="text-gray-800">{order.applianceBrand || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">故障描述：</span>
                <span className="text-gray-800">{order.faultDescription}</span>
              </div>
            </div>
            {order.photos && order.photos.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">故障照片：</p>
                <div className="grid grid-cols-4 gap-3">
                  {order.photos.map((photo: any, idx: number) => (
                    <img
                      key={photo.id || idx}
                      src={photo.photoUrl}
                      alt={`故障照片${idx + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">预约与服务</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">预约日期：</span>
                <span className="text-gray-800">{dayjs(order.scheduledDate).format('YYYY-MM-DD')}</span>
              </div>
              <div>
                <span className="text-gray-500">时间段：</span>
                <span className="text-gray-800">{order.scheduledTimeSlot}</span>
              </div>
              <div>
                <span className="text-gray-500">分配师傅：</span>
                <span className="text-gray-800">{order.technician?.name || '未分配'}</span>
              </div>
              <div>
                <span className="text-gray-500">负责经理：</span>
                <span className="text-gray-800">{order.cityManager?.name || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">预估费用：</span>
                <span className="text-gray-800">¥{order.estimatedCost || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">实际费用：</span>
                <span className="text-gray-800">¥{order.actualCost || '-'}</span>
              </div>
              {order.isOnTime !== null && order.isOnTime !== undefined && (
                <>
                  <div>
                    <span className="text-gray-500">是否准时：</span>
                    <span className={order.isOnTime ? 'text-green-600' : 'text-red-600'}>
                      {order.isOnTime ? '是' : '否'}
                    </span>
                  </div>
                  {order.delayReason && (
                    <div>
                      <span className="text-gray-500">延迟原因：</span>
                      <span className="text-gray-800">{delayReasonMap[order.delayReason] || order.delayReason}</span>
                    </div>
                  )}
                </>
              )}
              {order.remark && (
                <div className="col-span-2">
                  <span className="text-gray-500">备注：</span>
                  <span className="text-gray-800">{order.remark}</span>
                </div>
              )}
            </div>
          </div>

          {order.review && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">客户评价</h3>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-500">评分：</span>
                  <span className="text-yellow-500">
                    {'⭐'.repeat(order.review.rating)}
                  </span>
                </div>
                {order.review.comment && (
                  <div>
                    <span className="text-gray-500">评价内容：</span>
                    <span className="text-gray-800">{order.review.comment}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">操作</h3>
            <div className="space-y-3">
              {order.status === 'pending' && (
                <button className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  分配师傅
                </button>
              )}
              {order.status === 'completed' && (
                <button className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  申请退款
                </button>
              )}
              {['pending', 'assigned'].includes(order.status) && (
                <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  改约
                </button>
              )}
              {['pending', 'assigned', 'in_progress'].includes(order.status) && (
                <button className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  取消订单
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">处理进度</h3>
            <div className="space-y-4">
              {[
                { label: '订单创建', time: order.createdAt, done: true },
                { label: '师傅分配', time: order.technicianId ? order.createdAt : null, done: !!order.technicianId },
                { label: '开始维修', time: order.actualStartTime, done: !!order.actualStartTime },
                { label: '维修完成', time: order.actualEndTime, done: !!order.actualEndTime },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className={`text-sm ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-xs text-gray-500">
                        {dayjs(step.time).format('YYYY-MM-DD HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
