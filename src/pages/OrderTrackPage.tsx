import {
  Car,
  Clock,
  CalendarDays,
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Wrench,
  Star,
  ChevronRight,
  Check,
  Circle,
  Receipt,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { appointments } from '@/data/mockData';
import type { Appointment, AppointmentStatus as AppointmentStatusType } from '@/types';
import { cn } from '@/lib/utils';

const DEEP_BLUE = '#0F2B46';
const VIBRANT_ORANGE = '#FF6B35';

const statusSteps = [
  { key: '待确认', title: '待确认', description: '订单已提交，等待商家确认' },
  { key: '已确认', title: '已确认', description: '商家已确认预约' },
  { key: '到店', title: '已到店', description: '您的车辆已到店' },
  { key: '服务中', title: '服务中', description: '技师正在为您服务' },
  { key: '已完成', title: '已完成', description: '服务已完成，欢迎下次光临' },
];

export default function OrderTrackPage() {
  const appointment: Appointment = appointments[0] || appointments[1];

  const currentStatus = appointment.status as string;

  const getCurrentStepIndex = () => {
    const index = statusSteps.findIndex(s => s.key === currentStatus);
    if (index === -1) {
      if (currentStatus === '已取消') return -1;
      return 0;
    }
    return index;
  };

  const currentStepIndex = getCurrentStepIndex();

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
  };

  const formatTime = (date?: Date) => {
    if (!date) return '--';
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待确认':
        return '#F59E0B';
      case '已确认':
        return '#3B82F6';
      case '服务中':
        return VIBRANT_ORANGE;
      case '已完成':
        return '#22C55E';
      case '已取消':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div
        className="relative pt-12 pb-20 px-4"
        style={{ backgroundColor: DEEP_BLUE }}
      >
        <div className="max-w-3xl mx-auto">
          <button className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors mb-4">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">订单状态</p>
              <h1
                className="text-2xl font-bold text-white"
                style={{ color: currentStatus === '已取消' ? '#EF4444' : undefined }}
              >
                {currentStatus}
              </h1>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <p className="text-white/60 text-sm mt-2">
            订单号：{appointment.appointmentNo}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${getStatusColor(currentStatus)}15` }}
            >
              <Clock className="w-5 h-5" style={{ color: getStatusColor(currentStatus) }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">服务进度</h3>
              <p className="text-sm text-gray-500">实时跟踪您的服务状态</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {statusSteps.map((step, index) => {
              const isCompleted = currentStepIndex >= 0 && index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isCancelled = currentStatus === '已取消';

              return (
                <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                  {/* Vertical line */}
                  {index < statusSteps.length - 1 && (
                    <div
                      className="absolute left-[11px] top-6 bottom-0 w-0.5"
                      style={{
                        backgroundColor: isCompleted ? '#22C55E' : '#E5E7EB',
                      }}
                    />
                  )}

                  {/* Circle indicator */}
                  <div className="relative z-10 flex-shrink-0">
                    {isCompleted ? (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#22C55E' }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : isCurrent && !isCancelled ? (
                      <div className="relative">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: VIBRANT_ORANGE }}
                        >
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </div>
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-30"
                          style={{ backgroundColor: VIBRANT_ORANGE }}
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={cn(
                          'font-medium',
                          isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                        )}
                      >
                        {step.title}
                      </h4>
                      {isCompleted && (
                        <span className="text-xs text-gray-400">
                          {index === 0 && '10:30'}
                          {index === 1 && '10:35'}
                          {index === 2 && '10:50'}
                          {index === 3 && '11:00'}
                          {index === 4 && '12:30'}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-sm mt-1',
                        isCompleted || isCurrent ? 'text-gray-500' : 'text-gray-300'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ backgroundColor: DEEP_BLUE }}
          >
            <h3 className="font-semibold text-white">订单信息</h3>
            <button className="text-sm text-white/70 hover:text-white flex items-center gap-1">
              查看详情
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${DEEP_BLUE}10` }}
              >
                <Car className="w-5 h-5" style={{ color: DEEP_BLUE }} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {appointment.servicePackage?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {appointment.servicePackage?.description}
                </p>
              </div>
              <span className="text-lg font-bold" style={{ color: VIBRANT_ORANGE }}>
                ¥{appointment.estimatedPrice}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500 flex-shrink-0">预约时间</span>
                <span className="ml-auto font-medium text-gray-900">
                  {formatDate(appointment.appointmentDate)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500 flex-shrink-0">服务时段</span>
                <span className="ml-auto font-medium text-gray-900">
                  {appointment.startTime} - {appointment.endTime}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500 flex-shrink-0">车辆信息</span>
                <span className="ml-auto font-medium text-gray-900">
                  {appointment.vehicle?.plateNumber}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500 flex-shrink-0">车主</span>
                <span className="ml-auto font-medium text-gray-900">
                  {appointment.customer?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technician & Workstation Card */}
        {(appointment.technician || appointment.workstation) && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5" style={{ color: VIBRANT_ORANGE }} />
              服务信息
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointment.technician && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-2">服务技师</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: DEEP_BLUE }}
                    >
                      {appointment.technician.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.technician.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.technician.position}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-gray-500">
                          {appointment.technician.averageRating} 分
                        </span>
                        <span className="text-xs text-gray-400">
                          · {appointment.technician.totalServices}次服务
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {appointment.workstation && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-2">服务工位</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${VIBRANT_ORANGE}15` }}
                    >
                      <MapPin className="w-6 h-6" style={{ color: VIBRANT_ORANGE }} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.workstation.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.workstation.type}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        编号：{appointment.workstation.code}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Details Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" style={{ color: DEEP_BLUE }} />
            服务详情
          </h3>

          {appointment.servicePackage?.serviceItems && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">服务项目</p>
              <div className="flex flex-wrap gap-2">
                {appointment.servicePackage.serviceItems.split(',').map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-lg text-sm"
                    style={{ backgroundColor: `${DEEP_BLUE}08`, color: DEEP_BLUE }}
                  >
                    {item.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">服务时长</span>
              <span className="font-medium text-gray-900">
                {appointment.servicePackage?.durationMinutes} 分钟
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">服务原价</span>
              <span className="text-gray-400 line-through">
                ¥{appointment.servicePackage?.price}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">实付金额</span>
              <span className="text-lg font-bold" style={{ color: VIBRANT_ORANGE }}>
                ¥{appointment.estimatedPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Remarks Card */}
        {appointment.remarks && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              备注信息
            </h3>
            <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-sm">
              {appointment.remarks}
            </p>
          </div>
        )}

        {/* Store Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">门店信息</h3>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${DEEP_BLUE}10` }}
            >
              <MapPin className="w-5 h-5" style={{ color: DEEP_BLUE }} />
            </div>
            <div>
              <p className="font-medium text-gray-900">靓车坊·朝阳店</p>
              <p className="text-sm text-gray-500 mt-1">
                北京市朝阳区建国路88号
              </p>
              <div className="flex items-center gap-4 mt-3">
                <button
                  className="flex items-center gap-1 text-sm"
                  style={{ color: VIBRANT_ORANGE }}
                >
                  <Phone className="w-4 h-4" />
                  电话咨询
                </button>
                <button
                  className="flex items-center gap-1 text-sm"
                  style={{ color: DEEP_BLUE }}
                >
                  <MapPin className="w-4 h-4" />
                  导航
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {currentStepIndex >= 0 && currentStepIndex < 3 && (
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              取消预约
            </button>
            <button
              className="flex-1 py-3 rounded-xl text-white font-medium transition-colors"
              style={{ backgroundColor: VIBRANT_ORANGE }}
            >
              修改预约
            </button>
          </div>
        )}

        {currentStatus === '已完成' && (
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              查看评价
            </button>
            <button
              className="flex-1 py-3 rounded-xl text-white font-medium transition-colors"
              style={{ backgroundColor: VIBRANT_ORANGE }}
            >
              再次预约
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
