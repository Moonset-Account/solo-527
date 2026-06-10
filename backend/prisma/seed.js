const { PrismaClient } = require('@prisma/client')
const dayjs = require('dayjs')

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建种子数据...')

  const clinic = await prisma.clinic.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '口腔健康中心（总店）',
      address: '北京市朝阳区健康路100号',
      phone: '010-12345678',
    },
  })

  const doctors = await Promise.all([
    prisma.doctor.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '张伟',
        title: '主任医师',
        specialty: '种植牙',
        clinicId: clinic.id,
        phone: '13800000001',
        status: true,
      },
    }),
    prisma.doctor.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '李娜',
        title: '副主任医师',
        specialty: '正畸',
        clinicId: clinic.id,
        phone: '13800000002',
        status: true,
      },
    }),
    prisma.doctor.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: '王强',
        title: '主治医师',
        specialty: '牙周病',
        clinicId: clinic.id,
        phone: '13800000003',
        status: true,
      },
    }),
    prisma.doctor.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: '刘芳',
        title: '主治医师',
        specialty: '儿童牙科',
        clinicId: clinic.id,
        phone: '13800000004',
        status: true,
      },
    }),
  ])

  const patients = await Promise.all([
    prisma.patient.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '赵小明',
        gender: 'male',
        phone: '13900000001',
        clinicId: clinic.id,
        birthDate: new Date('1990-05-15'),
        allergy: '青霉素过敏',
        medicalHistory: '高血压',
      },
    }),
    prisma.patient.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '孙小红',
        gender: 'female',
        phone: '13900000002',
        clinicId: clinic.id,
        birthDate: new Date('1985-08-20'),
        allergy: '无',
        medicalHistory: '无',
      },
    }),
    prisma.patient.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: '周大龙',
        gender: 'male',
        phone: '13900000003',
        clinicId: clinic.id,
        birthDate: new Date('1978-03-10'),
        allergy: '无',
        medicalHistory: '糖尿病',
      },
    }),
    prisma.patient.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: '吴小美',
        gender: 'female',
        phone: '13900000004',
        clinicId: clinic.id,
        birthDate: new Date('2015-12-01'),
        allergy: '无',
        medicalHistory: '无',
      },
    }),
    prisma.patient.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: '郑建国',
        gender: 'male',
        phone: '13900000005',
        clinicId: clinic.id,
        birthDate: new Date('1965-11-20'),
        allergy: '磺胺类药物',
        medicalHistory: '心脏病、高血压',
      },
    }),
  ])

  console.log('基础数据创建完成')
  console.log(`诊所: ${clinic.name}`)
  console.log(`医生: ${doctors.length} 位`)
  console.log(`患者: ${patients.length} 位`)

  const today = dayjs()
  for (let i = 0; i < 7; i++) {
    const date = today.add(i, 'day')
    const dayOfWeek = date.day()

    if (dayOfWeek !== 0) {
      for (const doctor of doctors.slice(0, 3)) {
        const startTime = '08:00'
        const endTime = '12:00'
        const slots = []

        let current = dayjs(`2000-01-01 ${startTime}`)
        const end = dayjs(`2000-01-01 ${endTime}`)
        let index = 0

        while (current.isBefore(end)) {
          const slotEnd = current.add(30, 'minute')
          const isBooked = Math.random() > 0.6
          slots.push({
            startTime: current.format('HH:mm'),
            endTime: slotEnd.format('HH:mm'),
            slotIndex: index,
            status: isBooked ? 'booked' : 'available',
            maxPatients: 1,
            bookedCount: isBooked ? 1 : 0,
          })
          current = slotEnd
          index++
        }

        const bookedCount = slots.filter((s) => s.status === 'booked').length

        await prisma.schedule.create({
          data: {
            doctorId: doctor.id,
            clinicId: clinic.id,
            date: date.toDate(),
            startTime,
            endTime,
            shiftType: 'morning',
            totalSlots: slots.length,
            bookedSlots: bookedCount,
            status: 'active',
            slots: {
              create: slots,
            },
            statusHistory: {
              create: {
                fromStatus: null,
                toStatus: 'active',
                remark: '系统初始化排班',
                operatorName: '系统',
              },
            },
          },
        })
      }
    }
  }

  console.log('排班和号源数据创建完成')

  const schedules = await prisma.schedule.findMany({
    take: 5,
    include: { slots: true },
  })

  for (let i = 0; i < 8; i++) {
    const patient = patients[i % patients.length]
    const schedule = schedules[i % schedules.length]
    const availableSlots = schedule.slots.filter((s) => s.status === 'available')

    if (availableSlots.length > 0) {
      const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)]
      const isReturn = i > 2

      const chiefComplaints = [
        '牙痛，需要检查',
        '定期洗牙',
        '牙齿不齐，想做矫正',
        '种植牙复查',
        '牙龈出血',
        '儿童牙齿检查',
        '补牙',
        '智齿疼痛',
      ]

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: schedule.doctorId,
          clinicId: clinic.id,
          scheduleId: schedule.id,
          timeSlotId: slot.id,
          appointDate: schedule.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          chiefComplaint: chiefComplaints[i % chiefComplaints.length],
          status: isReturn ? 'confirmed' : 'pending',
          source: '线下',
          isReturnVisit: isReturn,
          statusHistory: {
            create: [
              {
                fromStatus: null,
                toStatus: 'pending',
                remark: '创建预约',
                operatorName: '系统',
              },
              ...(isReturn
                ? [
                    {
                      fromStatus: 'pending',
                      toStatus: 'confirmed',
                      remark: '系统确认',
                      operatorName: '系统',
                    },
                  ]
                : []),
            ],
          },
          operationLogs: {
            create: {
              operation: 'create',
              fieldName: 'status',
              oldValue: null,
              newValue: 'pending',
              operatorName: '系统',
            },
          },
        },
      })

      if (isReturn && i > 3) {
        await prisma.medicalRecord.create({
          data: {
            appointmentId: appointment.id,
            patientId: patient.id,
            doctorId: schedule.doctorId,
            diagnosis: i % 2 === 0 ? '龋齿' : '牙周炎',
            treatment: i % 2 === 0 ? '树脂充填治疗' : '牙周基础治疗',
            summary: i % 2 === 0 ? '右下后牙深龋，已行充填治疗' : '慢性牙周炎，建议定期复查',
            cost: i % 2 === 0 ? 500 : 800,
            statusHistory: {
              create: {
                status: 'confirmed',
                remark: '医生确认',
                operatorName: '医生',
              },
            },
          },
        })

        await prisma.followUp.create({
          data: {
            patientId: patient.id,
            doctorId: schedule.doctorId,
            appointmentId: appointment.id,
            type: 'post_op',
            content: '术后随访，询问恢复情况',
            planDate: dayjs(schedule.date).add(7, 'day').toDate(),
            status: 'pending',
            statusHistory: {
              create: {
                fromStatus: null,
                toStatus: 'pending',
                remark: '系统自动创建随访',
                operatorName: '系统',
              },
            },
          },
        })
      }
    }
  }

  console.log('预约和病历数据创建完成')

  console.log('\n✅ 种子数据创建完成！')
  console.log('可以使用以下账号登录（演示模式）:')
  console.log('  管理员 / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
