const { PrismaClient } = require('@prisma/client')
const dayjs = require('dayjs')

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

async function upsertReturnVisitStats({ periodType = 'day', periodStart, clinicId, doctorId, tx }) {
  const client = tx || prisma

  let start
  let end
  const base = periodStart ? dayjs(periodStart).startOf(periodType) : dayjs().startOf(periodType)

  if (periodType === 'day') {
    start = base.startOf('day').toDate()
    end = base.endOf('day').toDate()
  } else if (periodType === 'week') {
    start = base.startOf('week').toDate()
    end = base.endOf('week').toDate()
  } else {
    start = base.startOf('month').toDate()
    end = base.endOf('month').toDate()
  }

  const where = {
    periodType_periodStart_clinicId_doctorId: {
      periodType,
      periodStart: start,
      clinicId: clinicId || null,
      doctorId: doctorId || null,
    },
  }

  const statsWhere = {
    status: 'completed',
    appointDate: { gte: start, lte: end },
  }
  if (clinicId) statsWhere.clinicId = clinicId
  if (doctorId) statsWhere.doctorId = doctorId

  const totalVisits = await client.appointment.count({ where: statsWhere })

  const returnVisits = await client.appointment.count({
    where: { ...statsWhere, isReturnVisit: true },
  })

  const returnRate = totalVisits > 0 ? parseFloat(((returnVisits / totalVisits) * 100).toFixed(2)) : 0

  return await client.returnVisitStats.upsert({
    where,
    create: {
      periodType,
      periodStart: start,
      periodEnd: end,
      clinicId: clinicId || null,
      doctorId: doctorId || null,
      totalVisits,
      returnVisits,
      returnRate,
    },
    update: {
      totalVisits,
      returnVisits,
      returnRate,
    },
  })
}

async function refreshReturnVisitStatsForDate(date, clinicId, doctorId, tx) {
  const base = dayjs(date)
  const results = []
  const periods = ['day', 'week', 'month']
  for (const pt of periods) {
    const r = await upsertReturnVisitStats({
      periodType: pt,
      periodStart: base.toDate(),
      clinicId,
      doctorId,
      tx,
    })
    results.push(r)
  }
  return results
}

module.exports = prisma
module.exports.prisma = prisma
module.exports.upsertReturnVisitStats = upsertReturnVisitStats
module.exports.refreshReturnVisitStatsForDate = refreshReturnVisitStatsForDate
module.exports.default = prisma
