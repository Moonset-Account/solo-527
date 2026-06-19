import { NextResponse } from 'next/server';
import { db, data } from '@/lib/mock-db';

export async function GET() {
  const stats = {
    users: db.users.findMany().length,
    contracts: db.contracts.findMany().length,
    reminders: db.reminders.findMany().length,
    reminderRules: db.reminderRules.findMany().length,
    materials: db.evidenceMaterials.findMany().length,
    stampNodes: db.stampNodes.findMany().length,
    downloadRecords: db.downloadRecords.findMany().length,
    operationLogs: db.operationLogs.findMany().length,
    rolePermissions: db.rolePermissions.findMany().length,
    efficiencyStats: db.efficiencyStats.findMany().length,
  };

  return NextResponse.json({
    status: 'ok',
    stats,
    message: '合同审查节点提醒系统运行中',
    techStack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Redis'],
  });
}
