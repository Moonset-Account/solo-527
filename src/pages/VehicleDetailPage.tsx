import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import Timeline from '@/components/ui/Timeline'
import StatusBadge from '@/components/ui/StatusBadge'
import { vehicles, appointments, cashierOrders } from '@/data/mockData'
import { AppointmentStatus } from '@/types'
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  FileText,
  Tag,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  MapPin,
  Wrench,
  Receipt,
} from 'lucide-react'

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const vehicle = useMemo(() => {
    return vehicles.find((v) => v.id === id)
  }, [id])

  const vehicleAppointments = useMemo(() => {
    if (!vehicle) return []
    return appointments
      .filter((a) => a.vehicleId === vehicle.id)
      .sort(
        (a, b) =>
          new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      )
  }, [vehicle])

  const vehicleOrders = useMemo(() => {
    if (!vehicle) return []
    return cashierOrders.filter((o) => o.vehicleId === vehicle.id)
  }, [vehicle])

  const stats = useMemo(() => {
    const completedAppts = vehicleAppointments.filter(
      (a) => a.status === AppointmentStatus.Completed
    )
    const totalSpent = vehicleOrders.reduce((sum, o) => sum + o.actualAmount, 0)
    const totalServices = completedAppts.length
    const lastService = completedAppts[0]?.appointmentDate

    return { totalSpent, totalServices, lastService }
  }, [vehicleAppointments, vehicleOrders])

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const getStatusType = (status: string) => {
    switch (status) {
      case AppointmentStatus.Pending:
        return 'warning'
      case AppointmentStatus.Confirmed:
        return 'info'
      case AppointmentStatus.InService:
        return 'primary'
      case AppointmentStatus.Completed:
        return 'success'
      case AppointmentStatus.Cancelled:
        return 'danger'
      default:
        return 'gray'
    }
  }

  const timelineItems = vehicleAppointments.map((appt) => ({
    id: appt.id,
    title: appt.servicePackage?.name || '服务项目',
    description: (
      <div className="space-y-1">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            {appt.technician?.name || '未分配'}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {appt.workstation?.name || '未分配'}
          </span>
        </div>
        {appt.remarks && (
          <p className="text-xs text-gray-400">备注：{appt.remarks}</p>
        )}
      </div>
    ),
    time: `${formatDate(appt.appointmentDate)} ${appt.startTime}`,
    status: getStatusType(appt.status) as any,
    extra: (
      <div className="flex items-center justify-between">
        <StatusBadge
          status={getStatusType(appt.status) as any}
          text={appt.status as string}
        />
        <span className="text-sm font-semibold text-accent-600">
          ¥{appt.actualPrice || appt.estimatedPrice}
        </span>
      </div>
    ),
  }))

  const tagColors = [
    'bg-primary-100 text-primary-700',
    'bg-accent-100 text-accent-700',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
  ]

  if (!vehicle) {
    return (
      <AdminLayout title="车辆详情">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Car className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">车辆不存在</p>
          <button
            onClick={() => navigate('/vehicles')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            返回列表
          </button>
        </div>
      </AdminLayout>
    )
  }

  const tags = vehicle.tags ? vehicle.tags.split(',').filter(Boolean) : []

  return (
    <AdminLayout title="车辆详情">
      <div className="space-y-6">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回列表</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-deep-600 flex items-center justify-center flex-shrink-0">
                  <Car className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {vehicle.plateNumber}
                    </h1>
                    {tags.length > 0 && (
                      <div className="flex gap-1.5">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tagColors[index % tagColors.length]
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mb-4">
                    {vehicle.brand} {vehicle.model} · {vehicle.color}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">VIN码</p>
                      <p className="text-sm font-mono text-gray-700">
                        {vehicle.vin || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">车主</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-primary-500" />
                        {vehicle.customer?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">联系电话</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-accent-500" />
                        {vehicle.customer?.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                备注信息
              </h3>
              <p className="text-gray-600 text-sm">
                {vehicle.notes || '暂无备注'}
              </p>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                历史服务记录
              </h3>
              {timelineItems.length > 0 ? (
                <Timeline items={timelineItems} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Calendar className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">暂无服务记录</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-500" />
                消费统计
              </h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary-500 to-deep-600 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-90 mb-1">累计消费</p>
                  <p className="text-3xl font-bold font-mono">
                    ¥{stats.totalSpent.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Receipt className="w-4 h-4" />
                      <span className="text-xs">服务次数</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {stats.totalServices}
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        次
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">上次服务</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {stats.lastService ? formatDate(stats.lastService) : '-'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">平均客单价</span>
                    <span className="font-semibold text-accent-600">
                      ¥
                      {stats.totalServices > 0
                        ? Math.round(stats.totalSpent / stats.totalServices)
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-500" />
                车辆标签
              </h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        tagColors[index % tagColors.length]
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">暂无标签</p>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent-500" />
                会员信息
              </h3>
              {vehicle.customer?.memberPackage ? (
                <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-90 mb-1">
                    {vehicle.customer.memberPackage.name}
                  </p>
                  <p className="text-lg font-bold">
                    ¥{vehicle.customer.memberPackage.price}
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    有效期 {vehicle.customer.memberPackage.validityDays} 天
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">非会员</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
