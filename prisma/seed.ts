import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stores = [
  { storeId: 'ST001', storeName: '中心店', city: '北京', area: '朝阳区' },
  { storeId: 'ST002', storeName: '海淀店', city: '北京', area: '海淀区' },
  { storeId: 'ST003', storeName: '朝阳店', city: '北京', area: '朝阳区' },
  { storeId: 'ST004', storeName: '西城店', city: '北京', area: '西城区' },
  { storeId: 'ST005', storeName: '东城店', city: '北京', area: '东城区' },
];

const categories = [
  { id: 'CAT001', name: '叶菜类' },
  { id: 'CAT002', name: '根茎类' },
  { id: 'CAT003', name: '畜禽肉' },
  { id: 'CAT004', name: '水产品' },
  { id: 'CAT005', name: '水果类' },
  { id: 'CAT006', name: '豆制品' },
];

const products = [
  { skuId: 'SKU001', skuName: '上海青', categoryId: 'CAT001', categoryName: '叶菜类', shelfLifeDays: 3 },
  { skuId: 'SKU002', skuName: '菠菜', categoryId: 'CAT001', categoryName: '叶菜类', shelfLifeDays: 3 },
  { skuId: 'SKU003', skuName: '生菜', categoryId: 'CAT001', categoryName: '叶菜类', shelfLifeDays: 4 },
  { skuId: 'SKU004', skuName: '土豆', categoryId: 'CAT002', categoryName: '根茎类', shelfLifeDays: 30 },
  { skuId: 'SKU005', skuName: '胡萝卜', categoryId: 'CAT002', categoryName: '根茎类', shelfLifeDays: 21 },
  { skuId: 'SKU006', skuName: '白萝卜', categoryId: 'CAT002', categoryName: '根茎类', shelfLifeDays: 14 },
  { skuId: 'SKU007', skuName: '五花肉', categoryId: 'CAT003', categoryName: '畜禽肉', shelfLifeDays: 2 },
  { skuId: 'SKU008', skuName: '里脊肉', categoryId: 'CAT003', categoryName: '畜禽肉', shelfLifeDays: 3 },
  { skuId: 'SKU009', skuName: '鸡胸肉', categoryId: 'CAT003', categoryName: '畜禽肉', shelfLifeDays: 2 },
  { skuId: 'SKU010', skuName: '草鱼', categoryId: 'CAT004', categoryName: '水产品', shelfLifeDays: 1 },
  { skuId: 'SKU011', skuName: '基围虾', categoryId: 'CAT004', categoryName: '水产品', shelfLifeDays: 2 },
  { skuId: 'SKU012', skuName: '苹果', categoryId: 'CAT005', categoryName: '水果类', shelfLifeDays: 30 },
  { skuId: 'SKU013', skuName: '香蕉', categoryId: 'CAT005', categoryName: '水果类', shelfLifeDays: 5 },
  { skuId: 'SKU014', skuName: '草莓', categoryId: 'CAT005', categoryName: '水果类', shelfLifeDays: 2 },
  { skuId: 'SKU015', skuName: '豆腐', categoryId: 'CAT006', categoryName: '豆制品', shelfLifeDays: 3 },
  { skuId: 'SKU016', skuName: '千张', categoryId: 'CAT006', categoryName: '豆制品', shelfLifeDays: 5 },
];

const suppliers = [
  { supplierId: 'SUP001', supplierName: '绿源蔬菜基地', creditLevel: 'A' },
  { supplierId: 'SUP002', supplierName: '田园牧场', creditLevel: 'A' },
  { supplierId: 'SUP003', supplierName: '海鲜直供', creditLevel: 'B' },
  { supplierId: 'SUP004', supplierName: '鲜果配送', creditLevel: 'A' },
  { supplierId: 'SUP005', supplierName: '豆坊世家', creditLevel: 'B' },
];

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Seeding data...');

  await prisma.dimStore.createMany({ data: stores, skipDuplicates: true });
  await prisma.dimSupplier.createMany({ data: suppliers, skipDuplicates: true });
  await prisma.dimProduct.createMany({ data: products, skipDuplicates: true });

  console.log('Dimension tables seeded.');

  const startDate = new Date('2026-05-01');
  const endDate = new Date('2026-06-07');
  const inventories: any[] = [];

  for (let i = 0; i < 200; i++) {
    const product = products[randomInt(0, products.length - 1)];
    const store = stores[randomInt(0, stores.length - 1)];
    const receiveDate = randomDate(startDate, endDate);
    const expiryDate = new Date(receiveDate);
    expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);

    let supplierId: string;
    if (product.categoryId === 'CAT001' || product.categoryId === 'CAT002') {
      supplierId = 'SUP001';
    } else if (product.categoryId === 'CAT003') {
      supplierId = 'SUP002';
    } else if (product.categoryId === 'CAT004') {
      supplierId = 'SUP003';
    } else if (product.categoryId === 'CAT005') {
      supplierId = 'SUP004';
    } else {
      supplierId = 'SUP005';
    }

    inventories.push({
      batchId: `BATCH${String(i + 1).padStart(4, '0')}`,
      storeId: store.storeId,
      skuId: product.skuId,
      supplierId,
      receiveDate,
      receivedQty: randomInt(50, 200),
      expiryDate,
      costPrice: randomInt(200, 1500) / 100,
    });
  }

  for (const inv of inventories) {
    try {
      const created = await prisma.factInventory.create({ data: inv });
      
      const lossCount = randomInt(0, 3);
      for (let j = 0; j < lossCount; j++) {
        const lossDate = new Date(inv.receiveDate);
        lossDate.setDate(lossDate.getDate() + randomInt(1, Math.ceil(inv.receivedQty / 50)));
        
        if (lossDate < inv.expiryDate) {
          const lossType = Math.random() > 0.7 ? 'returned' : 'written_off';
          const lossQty = randomInt(5, Math.floor(inv.receivedQty * 0.3));
          const reason = lossType === 'written_off' 
            ? (Math.random() > 0.5 ? 'quality' : 'expired') 
            : 'customer_return';

          await prisma.factLoss.create({
            data: {
              inventoryId: created.inventoryId,
              lossDate,
              lossType,
              lossQty,
              lossAmount: lossQty * inv.costPrice,
              reason,
            },
          });
        }
      }

      if (Math.random() > 0.6) {
        const promoStart = new Date(inv.receiveDate);
        promoStart.setDate(promoStart.getDate() + randomInt(1, 2));
        const promoEnd = new Date(promoStart);
        promoEnd.setDate(promoEnd.getDate() + randomInt(2, 4));
        const discountRate = randomInt(70, 90) / 100;
        const soldQty = randomInt(20, Math.floor(inv.receivedQty * 0.6));

        await prisma.factPromotion.create({
          data: {
            inventoryId: created.inventoryId,
            startDate: promoStart,
            endDate: promoEnd,
            discountRate,
            soldQty,
            revenue: soldQty * inv.costPrice * discountRate,
          },
        });
      }
    } catch (e) {
    }
  }

  for (const store of stores) {
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      try {
        await prisma.factDailyTraffic.create({
          data: {
            storeId: store.storeId,
            dateId: new Date(d),
            customerCount: randomInt(800, 2000),
            conversionRate: randomInt(60, 85) / 100,
          },
        });
      } catch (e) {
      }
    }
  }

  console.log('Seed data completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
