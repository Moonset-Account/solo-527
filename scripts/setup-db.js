import { query, getClient } from "../server/db/index.js";
import { createTables } from "../server/db/schema.js";
import { seedDatabase } from "./seed-data.js";
import { cleanIrrigationData, validateDataQuality } from "./clean-data.js";

async function main() {
  console.log("=" .repeat(50));
  console.log("🚀 开始初始化数据库");
  console.log("=" .repeat(50));

  try {
    await query("SELECT 1");
    console.log("✅ 数据库连接成功");
  } catch (err) {
    console.error("❌ 数据库连接失败:", err.message);
    console.log("\n请确保 PostgreSQL 已启动并配置正确的连接信息");
    process.exit(1);
  }

  try {
    console.log("\n📋 创建数据表...");
    await createTables();

    console.log("\n🌱 生成测试数据...");
    await seedDatabase();

    console.log("\n🧹 清洗数据...");
    await cleanIrrigationData();

    console.log("\n🔍 数据质量检查...");
    await validateDataQuality();

    console.log("\n" + "=" .repeat(50));
    console.log("✅ 数据库初始化完成！");
    console.log("=" .repeat(50));
    console.log("\n下一步:");
    console.log("  1. 确保 Redis 已启动");
    console.log("  2. 运行 npm run dev 启动开发服务器");
    console.log("  3. 访问 http://localhost:3000");
  } catch (err) {
    console.error("\n❌ 初始化失败:", err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
