import { Router } from "express";
import {
  getWaterConsumptionTrend,
  getSoilMoistureComparison,
  getPumpEnergyConsumption,
  getStrategyBenefits,
  getAnomalies,
  getSummaryStats,
  getFilterOptions,
} from "../services/aggregator.js";
import { deleteCachePattern } from "../services/cache.js";
import { createExportTask, getExportTaskStatus, getAllExportTasks } from "../services/export.js";

const router = Router();

function parseFilters(req) {
  const {
    fieldIds,
    cropIds,
    pumpIds,
    strategyIds,
    startDate,
    endDate,
  } = req.query;

  return {
    fieldIds: fieldIds ? (Array.isArray(fieldIds) ? fieldIds : [fieldIds]).map(Number) : undefined,
    cropIds: cropIds ? (Array.isArray(cropIds) ? cropIds : [cropIds]).map(Number) : undefined,
    pumpIds: pumpIds ? (Array.isArray(pumpIds) ? pumpIds : [pumpIds]).map(Number) : undefined,
    strategyIds: strategyIds ? (Array.isArray(strategyIds) ? strategyIds : [strategyIds]).map(Number) : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate + "T23:59:59") : undefined,
  };
}

router.get("/filters", async (req, res) => {
  try {
    const data = await getFilterOptions();
    res.json(data);
  } catch (err) {
    console.error("获取筛选选项失败:", err);
    res.status(500).json({ error: "获取筛选选项失败" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const filters = parseFilters(req);
    const data = await getSummaryStats(filters);
    res.json(data);
  } catch (err) {
    console.error("获取汇总统计失败:", err);
    res.status(500).json({ error: "获取汇总统计失败" });
  }
});

router.get("/water-trend", async (req, res) => {
  try {
    const filters = parseFilters(req);
    const data = await getWaterConsumptionTrend(filters);
    res.json(data);
  } catch (err) {
    console.error("获取水耗趋势失败:", err);
    res.status(500).json({ error: "获取水耗趋势失败" });
  }
});

router.get("/moisture-comparison", async (req, res) => {
  try {
    const filters = parseFilters(req);
    const data = await getSoilMoistureComparison(filters);
    res.json(data);
  } catch (err) {
    console.error("获取湿度对比失败:", err);
    res.status(500).json({ error: "获取湿度对比失败" });
  }
});

router.get("/pump-energy", async (req, res) => {
  try {
    const filters = parseFilters(req);
    const data = await getPumpEnergyConsumption(filters);
    res.json(data);
  } catch (err) {
    console.error("获取泵站能耗失败:", err);
    res.status(500).json({ error: "获取泵站能耗失败" });
  }
});

router.get("/strategy-benefits", async (req, res) => {
  try {
    const filters = parseFilters(req);
    const data = await getStrategyBenefits(filters);
    res.json(data);
  } catch (err) {
    console.error("获取策略收益失败:", err);
    res.status(500).json({ error: "获取策略收益失败" });
  }
});

router.get("/anomalies", async (req, res) => {
  try {
    const filters = parseFilters(req);
    const data = await getAnomalies(filters);
    res.json(data);
  } catch (err) {
    console.error("获取异常数据失败:", err);
    res.status(500).json({ error: "获取异常数据失败" });
  }
});

router.post("/cache/clear", async (req, res) => {
  try {
    await deleteCachePattern("*");
    res.json({ success: true, message: "缓存已清除" });
  } catch (err) {
    console.error("清除缓存失败:", err);
    res.status(500).json({ error: "清除缓存失败" });
  }
});

router.post("/export", async (req, res) => {
  try {
    const { type, filters } = req.body;
    const validTypes = ["irrigation_records", "water_summary", "pump_energy", "anomalies"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "无效的导出类型", validTypes });
    }
    const taskId = await createExportTask(type, filters || {});
    res.json({ success: true, taskId, message: "导出任务已创建" });
  } catch (err) {
    console.error("创建导出任务失败:", err);
    res.status(500).json({ error: "创建导出任务失败", details: err.message });
  }
});

router.get("/export/:taskId", async (req, res) => {
  try {
    const task = getExportTaskStatus(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: "任务不存在" });
    }
    res.json(task);
  } catch (err) {
    console.error("获取导出任务状态失败:", err);
    res.status(500).json({ error: "获取导出任务状态失败" });
  }
});

router.get("/exports", async (req, res) => {
  try {
    const tasks = getAllExportTasks();
    res.json(tasks);
  } catch (err) {
    console.error("获取导出任务列表失败:", err);
    res.status(500).json({ error: "获取导出任务列表失败" });
  }
});

export default router;
