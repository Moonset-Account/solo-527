import { createExportTask, getExportTaskStatus } from "../server/services/export.js";

const args = process.argv.slice(2);
const type = args[0] || "water_summary";
const validTypes = ["irrigation_records", "water_summary", "pump_energy", "anomalies"];

function printUsage() {
  console.log("\n用法: npm run export:run [类型] [--startDate=日期] [--endDate=日期]");
  console.log("\n可用类型:");
  validTypes.forEach((t) => console.log(`  - ${t}`));
  console.log("\n示例:");
  console.log("  npm run export:run water_summary");
  console.log("  npm run export:run irrigation_records --startDate=2025-06-01 --endDate=2025-06-07");
  console.log("");
}

if (args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

if (!validTypes.includes(type)) {
  console.error(`❌ 无效的导出类型: ${type}`);
  printUsage();
  process.exit(1);
}

function parseArgs() {
  const filters = {};
  args.slice(1).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      if (key && value) {
        filters[key] = value;
      }
    }
  });
  return filters;
}

async function main() {
  const filters = parseArgs();

  console.log(`\n🚀 开始导出任务`);
  console.log(`   类型: ${type}`);
  if (Object.keys(filters).length > 0) {
    console.log(`   筛选: ${JSON.stringify(filters)}`);
  }

  try {
    const taskId = await createExportTask(type, filters);
    console.log(`\n✅ 任务已创建: ${taskId}`);
    console.log(`\n⏳ 等待导出完成...\n`);

    const checkInterval = setInterval(() => {
      const task = getExportTaskStatus(taskId);
      if (!task) {
        console.error("❌ 任务不存在");
        clearInterval(checkInterval);
        process.exit(1);
      }

      process.stdout.write(`\r   状态: ${task.status} | 进度: ${task.progress}%`);

      if (task.status === "completed") {
        clearInterval(checkInterval);
        console.log("\n\n🎉 导出完成！");
        console.log(`   文件: ${task.filePath}`);
        console.log("");
        process.exit(0);
      }

      if (task.status === "failed") {
        clearInterval(checkInterval);
        console.error("\n\n❌ 导出失败");
        console.error(`   错误: ${task.error}`);
        console.log("");
        process.exit(1);
      }
    }, 500);
  } catch (err) {
    console.error("\n❌ 创建任务失败:", err.message);
    console.log("   提示: 确保数据库已启动并正确配置\n");
    process.exit(1);
  }
}

main();
