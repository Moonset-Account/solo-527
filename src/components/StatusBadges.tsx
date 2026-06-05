import type { BookingStatus, PaymentStatus, EquipmentStatus, ContractStatus } from '@/types/database'

const bookingStatusConfig: Record<BookingStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '进行中', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
  rescheduled: { label: '已改期', color: 'bg-orange-100 text-orange-700' },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  unpaid: { label: '未付款', color: 'bg-red-100 text-red-700' },
  deposit_paid: { label: '已付定金', color: 'bg-yellow-100 text-yellow-700' },
  partial_paid: { label: '部分付款', color: 'bg-orange-100 text-orange-700' },
  paid: { label: '已付清', color: 'bg-green-100 text-green-700' },
  refunded: { label: '已退款', color: 'bg-gray-100 text-gray-600' },
}

const equipmentStatusConfig: Record<EquipmentStatus, { label: string; color: string }> = {
  available: { label: '可用', color: 'bg-green-100 text-green-700' },
  rented: { label: '已出租', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: '维护中', color: 'bg-yellow-100 text-yellow-700' },
  damaged: { label: '损坏', color: 'bg-red-100 text-red-700' },
  lost: { label: '丢失', color: 'bg-gray-100 text-gray-600' },
}

const contractStatusConfig: Record<ContractStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  sent: { label: '已发送', color: 'bg-blue-100 text-blue-700' },
  signed: { label: '已签署', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = bookingStatusConfig[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = paymentStatusConfig[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const config = equipmentStatusConfig[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const config = contractStatusConfig[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
