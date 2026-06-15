import Doctor from './models/Doctor.js'
import TimeSlot from './models/TimeSlot.js'
import Service from './models/Service.js'
import Schedule from './models/Schedule.js'
import Appointment from './models/Appointment.js'
import AppointmentHistory from './models/AppointmentHistory.js'
import Closure from './models/Closure.js'

function getWeekDates(): string[] {
  const dates: string[] = []
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export async function seedData() {
  const doctors = await Doctor.insertMany([
    { name: '王明华', title: '主任医师', department: '口腔洁牙科', avatar: '', isActive: true },
    { name: '李洁', title: '副主任医师', department: '口腔洁牙科', avatar: '', isActive: true },
    { name: '张晓芳', title: '主治医师', department: '口腔预防科', avatar: '', isActive: true },
    { name: '陈思远', title: '主治医师', department: '口腔预防科', avatar: '', isActive: true },
    { name: '刘婷', title: '住院医师', department: '口腔洁牙科', avatar: '', isActive: true },
  ])

  const timeSlots = await TimeSlot.insertMany([
    { startTime: '09:00', endTime: '10:00', label: '09:00-10:00' },
    { startTime: '10:00', endTime: '11:00', label: '10:00-11:00' },
    { startTime: '11:00', endTime: '12:00', label: '11:00-12:00' },
    { startTime: '14:00', endTime: '15:00', label: '14:00-15:00' },
    { startTime: '15:00', endTime: '16:00', label: '15:00-16:00' },
    { startTime: '16:00', endTime: '17:00', label: '16:00-17:00' },
  ])

  const services = await Service.insertMany([
    { name: '超声波洁牙', category: '基础洁牙', duration: 30, price: 200 },
    { name: '喷砂洁牙', category: '深度洁牙', duration: 45, price: 380 },
    { name: '牙面抛光', category: '基础洁牙', duration: 20, price: 150 },
    { name: '龈上洁治', category: '深度洁牙', duration: 60, price: 500 },
    { name: '儿童洁牙', category: '儿童口腔', duration: 25, price: 180 },
  ])

  const weekDates = getWeekDates()

  const scheduleData: any[] = []
  for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
    for (const doctor of doctors) {
      const morningSlots = timeSlots.slice(0, 3).map((ts) => ({
        doctorId: doctor._id,
        date: weekDates[dayIdx],
        timeSlotId: ts._id,
        shiftType: 'morning' as const,
        createdBy: 'system',
      }))
      const afternoonSlots = timeSlots.slice(3).map((ts) => ({
        doctorId: doctor._id,
        date: weekDates[dayIdx],
        timeSlotId: ts._id,
        shiftType: 'afternoon' as const,
        createdBy: 'system',
      }))
      scheduleData.push(...morningSlots, ...afternoonSlots)
    }
  }

  const schedules = await Schedule.insertMany(scheduleData)

  const statuses: Array<'pending' | 'confirmed' | 'arrived' | 'completed' | 'no_show' | 'cancelled'> = [
    'pending', 'confirmed', 'arrived', 'completed', 'no_show', 'cancelled',
  ]
  const noShowReasons = ['患者未到', '忘记预约', '临时有事', '交通不便', '身体不适']
  const patientNames = ['赵先生', '钱女士', '孙先生', '李女士', '周先生', '吴女士', '郑先生', '王女士', '冯先生', '陈女士']
  const phones = ['13800001001', '13800001002', '13800001003', '13800001004', '13800001005',
    '13800001006', '13800001007', '13800001008', '13800001009', '13800001010']

  const appointmentData: any[] = []
  const historyData: any[] = []

  const usedSchedules = schedules.slice(0, 40)

  for (let i = 0; i < usedSchedules.length; i++) {
    const schedule = usedSchedules[i]
    const status = statuses[i % statuses.length]
    const isNoShow = status === 'no_show'

    appointmentData.push({
      patientName: patientNames[i % patientNames.length],
      patientPhone: phones[i % phones.length],
      doctorId: schedule.doctorId,
      scheduleId: schedule._id,
      date: schedule.date,
      timeSlotId: schedule.timeSlotId,
      serviceId: services[i % services.length]._id,
      status,
      noShowReason: isNoShow ? noShowReasons[i % noShowReasons.length] : undefined,
      createdBy: 'system',
    })
  }

  const appointments = await Appointment.insertMany(appointmentData)

  for (let i = 0; i < appointments.length; i++) {
    const apt = appointments[i]
    if (apt.status !== 'pending') {
      historyData.push({
        appointmentId: apt._id,
        fromStatus: 'pending',
        toStatus: apt.status,
        changedBy: 'system',
        remark: apt.status === 'no_show' ? `No-show reason: ${apt.noShowReason}` : 'Status updated',
      })
    }
  }

  if (historyData.length > 0) {
    await AppointmentHistory.insertMany(historyData)
  }

  await Closure.insertMany([
    {
      date: weekDates[5],
      reason: '周末休息',
      createdBy: 'system',
    },
    {
      date: weekDates[6],
      reason: '周末休息',
      createdBy: 'system',
    },
  ])

  return {
    doctors: doctors.length,
    timeSlots: timeSlots.length,
    services: services.length,
    schedules: schedules.length,
    appointments: appointments.length,
    closures: 2,
  }
}
