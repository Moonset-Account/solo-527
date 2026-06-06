import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runETL() {
  console.log('Starting ETL process...');

  console.log('1. Extracting raw data...');
  
  console.log('2. Transforming and aggregating...');
  const summaryResult = await prisma.$executeRaw`
    INSERT INTO dws_daily_loss_summary (
      summary_date, store_id, category_id, supplier_id,
      total_received_qty, total_loss_qty, total_loss_amount, loss_rate
    )
    SELECT 
      i.receive_date as summary_date,
      i.store_id,
      p.category_id,
      i.supplier_id,
      SUM(i.received_qty) as total_received_qty,
      COALESCE(SUM(l.loss_qty), 0) as total_loss_qty,
      COALESCE(SUM(l.loss_amount), 0) as total_loss_amount,
      CASE 
        WHEN SUM(i.received_qty) > 0 
        THEN COALESCE(SUM(l.loss_qty), 0)::decimal / SUM(i.received_qty)
        ELSE 0 
      END as loss_rate
    FROM fact_inventory i
    JOIN dim_product p ON i.sku_id = p.sku_id
    LEFT JOIN fact_loss l ON i.inventory_id = l.inventory_id
    GROUP BY i.receive_date, i.store_id, p.category_id, i.supplier_id
    ON CONFLICT (summary_date, store_id, category_id, supplier_id) 
    DO UPDATE SET
      total_received_qty = EXCLUDED.total_received_qty,
      total_loss_qty = EXCLUDED.total_loss_qty,
      total_loss_amount = EXCLUDED.total_loss_amount,
      loss_rate = EXCLUDED.loss_rate
  `;

  console.log(`3. Loaded/Updated ${summaryResult} summary records`);
  console.log('ETL process completed!');

  return { summaryRecords: summaryResult };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runETL()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
