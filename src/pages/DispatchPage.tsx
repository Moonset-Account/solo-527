import { useState, useMemo } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import StatusBadge from '@/components/ui/StatusBadge'
import { appointments, technicians, workstations } from '@/data/mockData'
import { AppointmentStatus } from '@/types'
import {
  Calendar,
  Filter,
  User,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Wrench,
} from 'lucide-react'

export default function DispatchPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterTechnician, setFilterTechnician] = useState('')
  const [filterWorkstation, setFilterWorkstation] = useState('')

  const weekDays = useMemo(() => {
    const days = []
    const startOfWeek = new Date(selectedDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }, [selectedDate])

  const capacityData = useMemo(() => {
    return weekDays.map((day) => {
      const dayAppts = appointments.filter(
        (a) =>
          new Date(a.appointmentDate).toDateString() === day.toDateString() &&
          a.status !== AppointmentStatus.Cancelled
      )
      const count = dayAppts.length
      let level = 0
      if (count > 0) level = 1
      if (count >= 3) level = 2
      if (count >= 5) level = 3
      return { date: day, count, level }
    })
  }, [weekDays])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate).toDateString()
      const selDate = selectedDate.toDateString()
      if (aptDate !== selDate) return false
      if (filterTechnician && apt.technicianId !== filterTechnician) return false
      if (filterWorkstation && apt.workstationId !== filterWorkstation) return false
      return true
    })
  }, [selectedDate, filterTechnician, filterWorkstation])

  const pendingAppointments = filteredAppointments.filter(
    (a) => a.status === AppointmentStatus.Pending || a.status === AppointmentStatus.Confirmed
  )
  const inProgressAppointments = filteredAppointments.filter(
    (a) => a.status === AppointmentStatus.InService
  )
  const completedAppointments = filteredAppointments.filter(
    (a) => a.status === AppointmentStatus.Completed
  )

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

  const capacityColors = [
    'bg-gray-100',
    'bg-primary-200',
    'bg-primary-400',
    'bg-primary-600',
  ]

  const goToPrevWeek = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 7)
    setSelectedDate(d)
  }

  const goToNextWeek = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 7)
    setSelectedDate(d)
  }

  const weekDayNames = ['一', '二', '三', '四', '五', '六', '日']

  const AppointmentCard = ({ appointment }: { appointment: typeof appointments[0] }) => (
    <div className="bg-white rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-grab active:cursor-grabbing border border-gray-100 group">
      <div className="flex items-start justify-between mb-3">
        <StatusBadge
          status={getStatusType(appointment.status) as any}
          text={appointment.status as string}
          dot
        />
        <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      <h4 className="font-medium text-gray-900 mb-2">{appointment.servicePackage?.name}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4 text-primary-500" />
          <span>{appointment.customer?.name}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{appointment.vehicle?.plateNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 text-accent-500" />
          <span>
            {appointment.startTime} - {appointment.endTime}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Wrench className="w-4 h-4 text-primary-500" />
          <span>{appointment.technician?.name || '未分配'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 text-deep-500" />
          <span>{appointment.workstation?.name || '未分配'}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-lg font-bold text-accent-600">
          ¥{appointment.estimatedPrice}
        </span>
        <span className="text-xs text-gray-400">{appointment.appointmentNo}</span>
      </div>
    </div>
  )

  const KanbanColumn = ({
    title,
    count,
    items,
    color,
  }: {
    title: string
    count: number
    items: typeof appointments
    color: string
  }) => (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-6 rounded-full ${color}`} />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {count}
          </span>
        </div>
      </div>
      <div className="space-y-3 min-h-[400px] bg-gray-50 rounded-xl p-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Calendar className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-sm">暂无预约</span>
          </div>
        ) : (
          items.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
        )}
      </div>
    </div>
  )

  return (
    <AdminLayout title="工位调度">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={goToPrevWeek}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
              >
                今天
              </button>
              <button
                onClick={goToNextWeek}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5 text-primary-500" />
              <span className="font-medium">
                {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
                {selectedDate.getDate()}日
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterTechnician}
                onChange={(e) => setFilterTechnician(e.target.value)}
                className="input-field text-sm py-1.5 w-32"
              >
                <option value="">全部技师</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
              <select
                value={filterWorkstation}
                onChange={(e) => setFilterWorkstation(e.target.value)}
                className="input-field text-sm py-1.5 w-32"
              >
                <option value="">全部工位</option>
                {workstations.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            本周产能日历
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {capacityData.map((item, index) => {
              const isSelected =
                item.date.toDateString() === selectedDate.toDateString()
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(item.date)}
                  className={`p-3 rounded-xl text-center transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-accent-500 ring-offset-2'
                      : 'hover:ring-2 hover:ring-primary-300 hover:ring-offset-1'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    周{weekDayNames[index]}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    {item.date.getDate()}
                  </div>
                  <div
                    className={`h-2 rounded-full ${capacityColors[item.level]}`}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {item.count}单
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">产能负荷：</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">低</span>
              {capacityColors.map((color, i) => (
                <div key={i} className={`w-4 h-2 rounded-full ${color}`} />
              ))}
              <span className="text-xs text-gray-400">高</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <KanbanColumn
            title="待分配"
            count={pendingAppointments.length}
            items={pendingAppointments}
            color="bg-yellow-400"
          />
          <KanbanColumn
            title="进行中"
            count={inProgressAppointments.length}
            items={inProgressAppointments}
            color="bg-primary-500"
          />
          <KanbanColumn
            title="已完成"
            count={completedAppointments.length}
            items={completedAppointments}
            color="bg-green-500"
          />
        </div>
      </div>
    </AdminLayout>
  )
}
