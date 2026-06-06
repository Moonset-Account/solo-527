import { pool } from "../server/db.js";
import bcrypt from "bcryptjs";

export async function seed() {
  const client = await pool.connect();
  try {
    console.log("Seeding database...");
    await client.query("BEGIN");

    const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

    await client.query(
      `INSERT INTO users (username, password_hash, real_name, email, phone, role, region) VALUES 
       ($1, $2, $3, $4, $5, 'supervisor', '华东区'),
       ($6, $7, $8, $9, $10, 'engineer', '华东区'),
       ($11, $12, $13, $14, $15, 'engineer', '华东区'),
       ($16, $17, $18, $19, $20, 'warehouse', '华东区'),
       ($21, $22, $23, $24, $25, 'finance', '总部')
      ON CONFLICT (username) DO NOTHING`,
      [
        "supervisor01", hash("123456"), "张主管", "zhang.sp@example.com", "13800000001",
        "engineer01", hash("123456"), "李工", "li.gong@example.com", "13800000002",
        "engineer02", hash("123456"), "王工", "wang.gong@example.com", "13800000003",
        "warehouse01", hash("123456"), "仓管员", "cangguan@example.com", "13800000004",
        "finance01", hash("123456"), "财务", "finance@example.com", "13800000005",
      ]
    );

    const partsResult = await client.query(
      `INSERT INTO spare_parts (part_code, part_name, category, specification, unit, price, deposit_ratio, description) VALUES 
       ('PCB-A001', '主控板A型号', '电路板', '100x150mm, v2.0', '块', 1500.00, 1.0, 'XX型号机器主控板'),
       ('MOTOR-B002', '驱动电机B型', '电机', '50W, 24V', '台', 800.00, 0.8, '伺服驱动电机'),
       ('SENS-C003', '温度传感器', '传感器', 'PT100, -40~200℃', '个', 120.00, 1.0, '高精度温度传感器'),
       ('PSU-D004', '电源模块', '电源', '24V/10A', '个', 350.00, 1.0, '开关电源模块')
      ON CONFLICT (part_code) DO NOTHING
      RETURNING id, part_code`
    );

    const partIds = partsResult.rows;
    
    for (const part of partIds) {
      for (let i = 1; i <= 2; i++) {
        await client.query(
          `INSERT INTO inventory (part_id, batch_no, quantity, available_quantity, locked_quantity, location)
           VALUES ($1, $2, $3, $3, 0, $4)
           ON CONFLICT (part_id, batch_no) DO NOTHING`,
          [part.id, `BATCH-2024-${String(i).padStart(3, '0')}`, 50, `A-${i}-0${i}`]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Seeding completed!");
    console.log("Test accounts:");
    console.log("  区域主管: supervisor01 / 123456");
    console.log("  工程师: engineer01 / 123456");
    console.log("  仓库: warehouse01 / 123456");
    console.log("  财务: finance01 / 123456");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
