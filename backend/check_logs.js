import prisma from './src/db.js';

async function main() {
  const logs = await prisma.changeLog.findMany({ where: { entityType: 'Viewing' } });
  console.log('Total viewing change logs:', logs.length);
  console.log(logs.map(l => ({ id: l.id, action: l.action, entityId: l.entityId })));
  
  const allLogs = await prisma.changeLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  console.log('\nRecent 10 logs:', allLogs.map(l => ({ id: l.id, entityType: l.entityType, action: l.action })));
  
  await prisma.$disconnect();
}
main();
