import { createObjectCsvWriter } from "csv-writer";
import { query } from "../server/db/index.js";
import { v4 as uuidv4 } from "uuid";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exportDir = join(__dirname, "../exports");
if (!existsSync(exportDir)) {
  mkdirSync(exportDir, { recursive: true });
}

const exportTasks = new Map();

export async function createExportTask(type, filters) {
  const taskId = uuidv4();
  const task = {
    id: taskId,
    type,
    filters,
    status: "pending",
    createdAt: new Date(),
    progress: 0,
    filePath: null,
    error: null,
  };

  exportTasks.set(taskId, task);

  processExportTask(taskId).catch((err) => {
    console.error(`导出任务 ${taskId} 失败:`, err);
    const t = exportTasks.get(taskId);
    if (t) {
      t.status = "failed";
      t.error = err.message;
    }
  });

  return taskId;
}

async function processExportTask(taskId) {
  const task = exportTasks.get(taskId);
  if (!task) return;

  task.status = "processing";
  task.progress = 10;

  try {
    let data;
    let fileName;

    switch (task.type) {
      case "irrigation_records":
        data = await exportIrrigationRecords(task.filters);
        fileName = `灌溉记录_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "water_summary":
        data = await exportWaterSummary(task.filters);
        fileName = `用水汇总_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "pump_energy":
        data = await exportPumpEnergy(task.filters);
        fileName = `泵站能耗_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "anomalies":
        data = await exportAnomalies(task.filters);
        fileName = `异常记录_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      default:
        throw new Error(`未知导出类型: ${task.type}`);
    }

    task.progress = 60;

    const filePath = join(exportDir, `${taskId}_${fileName}`);

    if (data.length > 0) {
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
      });
      await csvWriter.writeRecords(data);
    }

    task.filePath = filePath;
    task.status = "completed";
    task.progress = 100;
  } catch (err) {
    task.status = "failed";
    task.error = err.message;
  }
}

async function exportIrrigationRecords(filters) {
  const { where, params } = buildExportWhere(filters);

  const result = await query(
    `
    SELECT 
      f.name as 地块名称,
      c.name as 作物名称,
      ps.name as 泵站名称,
      s.name as 灌溉策略,
      ir.start_time as 开始时间,
      ir.end_time as 结束时间,
      ir.water_volume as 用水量_m3,
      ir.electricity_consumed as 耗电量_kWh,
      ir.electricity_cost as 电费_元,
      ir.flow_rate as 流量_m3h,
      ir.is_after_rain as 是否雨后灌溉,
      ir.rain_amount_24h as 24h降雨量_mm,
      ir.notes as 备注
    FROM irrigation_records ir
    JOIN fields f ON ir.field_id = f.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN crops c ON fcr.crop_id = c.id
    JOIN pump_stations ps ON ir.pump_station_id = ps.id
    LEFT JOIN irrigation_strategies s ON ir.strategy_id = s.id
    ${where}
    ORDER BY ir.start_time DESC
    `,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    开始时间: row.开始时间?.toISOString(),
    结束时间: row.结束时间?.toISOString(),
  }));
}

async function exportWaterSummary(filters) {
  const { where, params } = buildExportWhere(filters);

  const result = await query(
    `
    SELECT 
      DATE(ir.start_time) as 日期,
      f.name as 地块名称,
      c.name as 作物名称,
      COUNT(ir.id) as 灌溉次数,
      SUM(ir.water_volume) as 总用水量_m3,
      SUM(CASE WHEN ir.is_after_rain THEN ir.water_volume ELSE 0 END) as 雨后灌溉量_m3,
      SUM(ir.electricity_cost) as 总电费_元,
      AVG(ir.flow_rate) as 平均流量_m3h
    FROM irrigation_records ir
    JOIN fields f ON ir.field_id = f.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN crops c ON fcr.crop_id = c.id
    ${where}
    GROUP BY DATE(ir.start_time), f.name, c.name
    ORDER BY 日期 DESC
    `,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    日期: row.日期?.toISOString().split("T")[0],
  }));
}

async function exportPumpEnergy(filters) {
  const { where, params } = buildExportWhere(filters);

  const result = await query(
    `
    SELECT 
      DATE(ir.start_time) as 日期,
      ps.name as 泵站名称,
      COUNT(ir.id) as 运行次数,
      SUM(EXTRACT(EPOCH FROM (ir.end_time - ir.start_time)) / 3600) as 运行时长_小时,
      SUM(ir.water_volume) as 供水量_m3,
      SUM(ir.electricity_consumed) as 耗电量_kWh,
      SUM(ir.electricity_cost) as 电费_元,
      AVG(ir.flow_rate / ps.rated_flow) * 100 as 平均效率_百分比
    FROM irrigation_records ir
    JOIN pump_stations ps ON ir.pump_station_id = ps.id
    ${where}
    GROUP BY DATE(ir.start_time), ps.name
    ORDER BY 日期 DESC
    `,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    日期: row.日期?.toISOString().split("T")[0],
  }));
}

async function exportAnomalies(filters) {
  const { where, params } = buildExportWhere(filters);

  const result = await query(
    `
    SELECT 
      f.name as 地块名称,
      c.name as 作物名称,
      ps.name as 泵站名称,
      ir.start_time as 发生时间,
      ir.water_volume as 用水量_m3,
      ir.rain_amount_24h as 降雨量_mm,
      CASE 
        WHEN ir.water_volume > f.area * COALESCE(c.water_requirement, 5) * 1.5 THEN '过量灌溉'
        WHEN ir.is_after_rain AND ir.rain_amount_24h > 10 AND ir.water_volume > f.area * 2 THEN '雨后过度灌溉'
        WHEN ps.rated_flow > 0 AND ir.flow_rate < ps.rated_flow * 0.7 THEN '泵站效率低'
        ELSE '其他异常'
      END as 异常类型,
      CASE 
        WHEN ir.water_volume > f.area * COALESCE(c.water_requirement, 5) * 1.5 THEN '高'
        WHEN ir.is_after_rain AND ir.rain_amount_24h > 10 THEN '高'
        ELSE '中'
      END as 严重程度
    FROM irrigation_records ir
    JOIN fields f ON ir.field_id = f.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN crops c ON fcr.crop_id = c.id
    JOIN pump_stations ps ON ir.pump_station_id = ps.id
    ${where}
    AND (
      ir.water_volume > f.area * COALESCE(c.water_requirement, 5) * 1.5
      OR (ir.is_after_rain AND ir.rain_amount_24h > 10 AND ir.water_volume > f.area * 2)
      OR (ps.rated_flow > 0 AND ir.flow_rate < ps.rated_flow * 0.7)
    )
    ORDER BY ir.start_time DESC
    `,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    发生时间: row.发生时间?.toISOString(),
  }));
}

function buildExportWhere(filters) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filters.fieldIds?.length) {
    conditions.push(`ir.field_id = ANY($${paramIndex++}::int[])`);
    params.push(filters.fieldIds);
  }
  if (filters.cropIds?.length) {
    conditions.push(`fcr.crop_id = ANY($${paramIndex++}::int[])`);
    params.push(filters.cropIds);
  }
  if (filters.pumpIds?.length) {
    conditions.push(`ir.pump_station_id = ANY($${paramIndex++}::int[])`);
    params.push(filters.pumpIds);
  }
  if (filters.startDate) {
    conditions.push(`ir.start_time >= $${paramIndex++}`);
    params.push(new Date(filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(`ir.start_time <= $${paramIndex++}`);
    params.push(new Date(filters.endDate + "T23:59:59"));
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export function getExportTaskStatus(taskId) {
  return exportTasks.get(taskId) || null;
}

export function getAllExportTasks() {
  return Array.from(exportTasks.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const type = process.argv[2] || "irrigation_records";
    const taskId = await createExportTask(type, {});
    console.log(`已创建导出任务: ${taskId}`);

    const checkStatus = setInterval(() => {
      const task = getExportTaskStatus(taskId);
      console.log(`状态: ${task?.status}, 进度: ${task?.progress}%`);
      if (task?.status === "completed" || task?.status === "failed") {
        if (task?.filePath) console.log(`文件: ${task.filePath}`);
        if (task?.error) console.error(`错误: ${task.error}`);
        clearInterval(checkStatus);
        process.exit(0);
      }
    }, 1000);
  })();
}
