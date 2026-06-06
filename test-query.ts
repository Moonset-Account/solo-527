import { prisma } from './server/utils/db';

async function test() {
  const startDate = new Date('2026-05-01');
  const endDate = new Date('2026-06-07');
  const batchIds = ['BATCH0010', 'BATCH0065'];

  const inventoryWhere: any = {
    receiveDate: { gte: startDate, lte: endDate },
    batchId: { in: batchIds },
  };

  const matchedInventories = await prisma.factInventory.findMany({
    where: inventoryWhere,
    select: { storeId: true },
    distinct: ['storeId'],
  });

  console.log('Matched inventories:', matchedInventories);
  const matchedStoreIds = matchedInventories.map((i: any) => i.storeId);
  console.log('Matched store IDs:', matchedStoreIds);

  const trafficData = await prisma.factDailyTraffic.findMany({
    where: {
      dateId: { gte: startDate, lte: endDate },
      storeId: { in: matchedStoreIds },
    },
  });

  console.log('Traffic count:', trafficData.length);
  console.log('Total customers:', trafficData.reduce((sum, t) => sum + t.customerCount, 0));

  await prisma.$disconnect();
}

test().catch(console.error);
