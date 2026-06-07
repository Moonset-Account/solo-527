import { createObjectCsvWriter } from "csv-writer";
import { v4 as uuidv4 } from "uuid";
import { mkdirSync, existsSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exportDir = join(__dirname, "../../exports");
if (!existsSync(exportDir)) {
  mkdirSync(exportDir, { recursive: true });
}

const exportTasks = new Map();

export async function createExportTask(type, filters = {}) {
  const taskId = uuidv4();
  const fileName = generateFileName(type);
  const filePath = join(exportDir, `${taskId}_${fileName}`);
  const publicPath = `/exports/${taskId}_${fileName}`;

  const task = {
    id: taskId,
    type,
    filters,
    status: "pending",
    createdAt: new Date(),
    progress: 0,
    filePath,
    publicPath,
    fileName,
    error: null,
  };

  exportTasks.set(taskId, task);

  setImmediate(() => processExportTask(taskId));

  return { taskId, publicPath, fileName };
}

async function processExportTask(taskId) {
  const task = exportTasks.get(taskId);
  if (!task) return;

  try {
    task.status = "processing";
    task.progress = 10;

    await delay(200);
    task.progress = 30;

    const data = generateExportData(task.type, task.filters);
    task.progress = 60;

    await delay(200);
    task.progress = 80;

    if (data.length > 0) {
      const csvWriter = createObjectCsvWriter({
        path: task.filePath,
        header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
      });
      await csvWriter.writeRecords(data);
    }

    task.progress = 100;
    task.status = "completed";
  } catch (err) {
    console.error(`导出任务 ${taskId} 失败:`, err);
    task.status = "failed";
    task.error = err.message;
  }
}

function generateExportData(type, filters) {
  const now = new Date().toISOString().split("T")[0];
  const rows = [];

  switch (type) {
    case "water_summary":
      for (let i = 0; i < 30; i++) {
        const date = new Date("2025-05-15");
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        const isRainy = [2, 5, 9, 14, 18, 22, 27].includes(i);
        const rainfall = isRainy ? (Math.random() * 20 + 5).toFixed(1) : "0";
        const totalWater = (800 + Math.random() * 600).toFixed(2);
        const postRainWater = isRainy ? (totalWater * 0.25).toFixed(2) : "0";

        rows.push({
          日期: dateStr,
          总灌溉水量_m3: totalWater,
          常规灌溉量_m3: (totalWater - postRainWater).toFixed(2),
          雨后灌溉量_m3: postRainWater,
          灌溉次数: Math.floor(Math.random() * 6) + 3,
          总电费_元: (totalWater * 0.42).toFixed(2),
          降雨量_mm: rainfall,
          是否降雨日: isRainy ? "是" : "否",
        });
      }
      break;

    case "irrigation_records":
      const fields = ["东一号田", "东二号田", "西一号田", "西二号田", "南一号田", "北一号田"];
      const crops = ["冬小麦", "夏玉米", "大豆", "棉花"];
      const pumps = ["1号泵站", "2号泵站", "3号泵站"];
      const strategies = ["传统漫灌", "喷灌", "滴灌", "智能灌溉"];

      for (let i = 0; i < 100; i++) {
        const date = new Date("2025-05-15");
        date.setDate(date.getDate() + Math.floor(Math.random() * 23));
        date.setHours(Math.floor(Math.random() * 14) + 6, 0, 0, 0);
        const field = fields[Math.floor(Math.random() * fields.length)];
        const crop = crops[Math.floor(Math.random() * crops.length)];
        const pump = pumps[Math.floor(Math.random() * pumps.length)];
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        const waterVolume = (50 + Math.random() * 250).toFixed(2);
        const isAfterRain = Math.random() > 0.85;
        const duration = (1 + Math.random() * 5).toFixed(1);

        rows.push({
          记录编号: `IR-${String(i + 1).padStart(4, "0")}`,
          地块名称: field,
          作物名称: crop,
          泵站名称: pump,
          灌溉策略: strategy,
          开始时间: date.toISOString(),
          灌溉时长_小时: duration,
          用水量_m3: waterVolume,
          耗电量_kWh: (waterVolume * 0.15).toFixed(2),
          电费_元: (waterVolume * 0.42).toFixed(2),
          是否雨后灌溉: isAfterRain ? "是" : "否",
          "24h降雨量_mm": isAfterRain ? (Math.random() * 20 + 5).toFixed(1) : "0",
        });
      }
      break;

    case "pump_energy":
      const pumpNames = ["1号泵站", "2号泵站", "3号泵站"];
      for (let i = 0; i < 18; i++) {
        const date = new Date("2025-05-20");
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        pumpNames.forEach((pump, idx) => {
          const hours = (2 + Math.random() * 5).toFixed(1);
          const efficiency = (65 + Math.random() * 25).toFixed(1);
          const totalWater = (hours * [200, 160, 100][idx] * (efficiency / 100)).toFixed(2);

          rows.push({
            日期: dateStr,
            泵站名称: pump,
            运行次数: Math.floor(Math.random() * 3) + 1,
            运行时长_小时: hours,
            供水量_m3: totalWater,
            耗电量_kWh: (hours * [55, 37, 22][idx]).toFixed(2),
            电费_元: (hours * [55, 37, 22][idx] * 0.65).toFixed(2),
            平均运行效率_百分比: efficiency,
            单方水成本_元_m3: ((hours * [55, 37, 22][idx] * 0.65) / totalWater).toFixed(4),
          });
        });
      }
      break;

    case "anomalies":
      const anomalyTypes = [
        { type: "过量灌溉", severity: "高", desc: "灌溉水量超过作物需求1.5倍" },
        { type: "雨后过度灌溉", severity: "高", desc: "降雨后仍大量灌溉" },
        { type: "泵站效率低下", severity: "中", desc: "泵站运行效率低于额定值70%" },
        { type: "土壤湿度异常", severity: "中", desc: "土壤湿度超出适宜范围" },
      ];
      const fieldList = ["东一号田", "东二号田", "西一号田", "西二号田", "南一号田", "北一号田"];
      const pumpList = ["1号泵站", "2号泵站", "3号泵站"];

      for (let i = 0; i < 15; i++) {
        const anomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
        const date = new Date("2025-05-20");
        date.setDate(date.getDate() + Math.floor(Math.random() * 18));
        const field = fieldList[Math.floor(Math.random() * fieldList.length)];
        const pump = pumpList[Math.floor(Math.random() * pumpList.length)];

        rows.push({
          异常编号: `AN-${String(i + 1).padStart(4, "0")}`,
          发生时间: date.toISOString(),
          地块名称: field,
          泵站名称: pump,
          异常类型: anomaly.type,
          严重程度: anomaly.severity,
          异常描述: anomaly.desc,
          用水量_m3: (100 + Math.random() * 400).toFixed(2),
          处理建议: getSuggestion(anomaly.type),
        });
      }
      break;

    default:
      rows.push({ 提示: "未知导出类型", 导出时间: now });
  }

  return rows;
}

function getSuggestion(type) {
  switch (type) {
    case "过量灌溉":
      return "检查土壤湿度传感器，考虑缩短灌溉时长";
    case "雨后过度灌溉":
      return "启用降雨联动控制，雨后自动减少灌溉量";
    case "泵站效率低下":
      return "检查水泵叶轮、管道是否堵塞，检查供电电压";
    case "土壤湿度异常":
      return "调整灌溉计划，检查传感器校准";
    default:
      return "建议人工核查";
  }
}

function generateFileName(type) {
  const typeNames = {
    water_summary: "用水汇总报表",
    irrigation_records: "灌溉明细记录",
    pump_energy: "泵站能耗分析",
    anomalies: "异常记录清单",
  };
  const now = new Date().toISOString().split("T")[0];
  return `${typeNames[type] || type}_${now}.csv`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getExportTaskStatus(taskId) {
  const task = exportTasks.get(taskId);
  if (!task) return null;
  return {
    id: task.id,
    type: task.type,
    status: task.status,
    progress: task.progress,
    createdAt: task.createdAt,
    fileName: task.fileName,
    publicPath: task.status === "completed" ? task.publicPath : null,
    error: task.error,
  };
}

export function getAllExportTasks() {
  return Array.from(exportTasks.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((task) => ({
      id: task.id,
      type: task.type,
      status: task.status,
      progress: task.progress,
      createdAt: task.createdAt,
      fileName: task.fileName,
      publicPath: task.status === "completed" ? task.publicPath : null,
    }));
}

export function getExportFilePath(fileName) {
  const filePath = join(exportDir, fileName);
  return existsSync(filePath) ? filePath : null;
}

export { exportDir };
