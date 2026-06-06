import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanRawData() {
  console.log('Starting data cleaning process...');

  console.log('1. Removing duplicate inventory records...');
  const duplicates = await prisma.$queryRaw`
    SELECT batch_id, sku_id, store_id, COUNT(*) 
    FROM fact_inventory 
    GROUP BY batch_id, sku_id, store_id 
    HAVING COUNT(*) > 1
  `;
  console.log(`Found ${Array.isArray(duplicates) ? duplicates.length : 0} duplicate batches`);

  console.log('2. Validating expiry dates...');
  const invalidExpiry = await prisma.factInventory.findMany({
    where: {
      expiryDate: {
        lt: prisma.factInventory.fields.receiveDate,
      },
    },
    select: { inventoryId: true, batchId: true },
  });
  console.log(`Found ${invalidExpiry.length} records with invalid expiry dates`);

  console.log('3. Normalizing category names...');
  const categories = await prisma.dimProduct.findMany({
    distinct: ['categoryId', 'categoryName'],
    select: { categoryId: true, categoryName: true },
  });
  console.log(`Found ${categories.length} unique categories`);

  console.log('4. Cleaning loss records...');
  const orphanLosses = await prisma.$queryRaw`
    SELECT l.loss_id 
    FROM fact_loss l 
    LEFT JOIN fact_inventory i ON l.inventory_id = i.inventory_id 
    WHERE i.inventory_id IS NULL
  `;
  console.log(`Found ${Array.isArray(orphanLosses) ? orphanLosses.length : 0} orphan loss records`);

  console.log('Data cleaning completed!');
  return {
    duplicates: Array.isArray(duplicates) ? duplicates.length : 0,
    invalidExpiry: invalidExpiry.length,
    categories: categories.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanRawData()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
