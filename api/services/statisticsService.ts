import prisma from '../prisma.js'

export async function getCompleteness() {
  const materials = await prisma.materialItem.findMany({
    select: { status: true },
  })

  const total = materials.length
  const submitted = materials.filter((m) => m.status === 'SUBMITTED').length
  const missing = materials.filter((m) => m.status === 'MISSING').length
  const supplementing = materials.filter((m) => m.status === 'SUPPLEMENTING').length
  const rate = total > 0 ? Math.round((submitted / total) * 100) : 0

  return { total, submitted, missing, supplementing, rate }
}

export async function getDuration() {
  const nodes = await prisma.approvalNode.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { not: null },
    },
    select: {
      nodeName: true,
      startedAt: true,
      completedAt: true,
    },
  })

  const grouped: Record<string, number[]> = {}
  for (const node of nodes) {
    if (!grouped[node.nodeName]) {
      grouped[node.nodeName] = []
    }
    const minutes = (node.completedAt!.getTime() - node.startedAt.getTime()) / 60000
    grouped[node.nodeName].push(minutes)
  }

  return Object.entries(grouped).map(([nodeName, durations]) => {
    const sorted = durations.sort((a, b) => a - b)
    const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length
    const p90Index = Math.ceil(sorted.length * 0.9) - 1
    const p90 = sorted[p90Index] ?? sorted[sorted.length - 1] ?? 0
    return {
      nodeName,
      avgMinutes: Math.round(avg),
      p90Minutes: Math.round(p90),
      count: sorted.length,
    }
  })
}

export async function getReminders() {
  const reminders = await prisma.reminderRecord.findMany({
    select: {
      remindTo: true,
      node: {
        select: {
          assigneeDepartment: true,
        },
      },
    },
  })

  const grouped: Record<string, { assignee: string; department: string; count: number }> = {}
  for (const r of reminders) {
    if (!grouped[r.remindTo]) {
      grouped[r.remindTo] = {
        assignee: r.remindTo,
        department: r.node.assigneeDepartment,
        count: 0,
      }
    }
    grouped[r.remindTo].count++
  }

  return Object.values(grouped)
}

export async function getTimeoutRank() {
  const nodes = await prisma.approvalNode.findMany({
    where: { status: 'TIMEOUT' },
    select: {
      nodeName: true,
      startedAt: true,
      timeoutMinutes: true,
    },
  })

  const grouped: Record<string, { count: number; overdueMinutes: number[] }> = {}
  for (const node of nodes) {
    if (!grouped[node.nodeName]) {
      grouped[node.nodeName] = { count: 0, overdueMinutes: [] }
    }
    grouped[node.nodeName].count++
    const elapsed = (Date.now() - node.startedAt.getTime()) / 60000
    grouped[node.nodeName].overdueMinutes.push(elapsed - node.timeoutMinutes)
  }

  return Object.entries(grouped).map(([nodeName, data]) => ({
    nodeName,
    timeoutCount: data.count,
    avgOverdueMinutes: Math.round(
      data.overdueMinutes.reduce((s, v) => s + v, 0) / data.overdueMinutes.length
    ),
  }))
}
