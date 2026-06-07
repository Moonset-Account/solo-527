import { query } from "../db/index.js";
import { getCache, setCache, generateCacheKey } from "./cache.js";
import { config } from "../config.js";

function buildWhereClause(filters) {
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
  if (filters.strategyIds?.length) {
    conditions.push(`ir.strategy_id = ANY($${paramIndex++}::int[])`);
    params.push(filters.strategyIds);
  }
  if (filters.startDate) {
    conditions.push(`ir.start_time >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`ir.start_time <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function getWaterConsumptionTrend(filters) {
  const cacheKey = generateCacheKey("water_trend", filters);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const result = await query(
    `
    SELECT 
      DATE(ir.start_time) as date,
      SUM(ir.water_volume) as total_water,
      SUM(CASE WHEN ir.is_after_rain THEN ir.water_volume ELSE 0 END) as post_rain_water,
      COUNT(ir.id) as irrigation_count,
      SUM(ir.electricity_cost) as total_cost,
      COALESCE(w.rainfall, 0) as rainfall
    FROM irrigation_records ir
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN weather_records w ON DATE(ir.start_time) = w.record_date
    ${where}
    GROUP BY DATE(ir.start_time), w.rainfall
    ORDER BY date ASC
    `,
    params
  );

  const data = result.rows.map((row) => ({
    date: row.date.toISOString().split("T")[0],
    totalWater: parseFloat(row.total_water) || 0,
    postRainWater: parseFloat(row.post_rain_water) || 0,
    normalWater:
      (parseFloat(row.total_water) || 0) - (parseFloat(row.post_rain_water) || 0),
    irrigationCount: parseInt(row.irrigation_count) || 0,
    totalCost: parseFloat(row.total_cost) || 0,
    rainfall: parseFloat(row.rainfall) || 0,
    hasRain: parseFloat(row.rainfall) > 0,
  }));

  await setCache(cacheKey, data, config.cache.metricsTTL);
  return data;
}

export async function getSoilMoistureComparison(filters) {
  const cacheKey = generateCacheKey("moisture_compare", filters);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const fieldCondition = filters.fieldIds?.length
    ? `WHERE smr.field_id = ANY($1::int[])`
    : "";
  const params = filters.fieldIds?.length ? [filters.fieldIds] : [];

  const result = await query(
    `
    SELECT 
      f.id as field_id,
      f.name as field_name,
      c.name as crop_name,
      DATE(smr.reading_time) as date,
      AVG(smr.moisture_level) as avg_moisture,
      MIN(smr.moisture_level) as min_moisture,
      MAX(smr.moisture_level) as max_moisture,
      f.area as field_area
    FROM soil_moisture_readings smr
    JOIN fields f ON smr.field_id = f.id
    LEFT JOIN field_crop_relations fcr ON f.id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN crops c ON fcr.crop_id = c.id
    ${fieldCondition}
    GROUP BY f.id, f.name, c.name, DATE(smr.reading_time), f.area
    ORDER BY date ASC, f.id ASC
    `,
    params
  );

  const data = result.rows.map((row) => ({
    fieldId: row.field_id,
    fieldName: row.field_name,
    cropName: row.crop_name,
    date: row.date.toISOString().split("T")[0],
    avgMoisture: parseFloat(row.avg_moisture) || 0,
    minMoisture: parseFloat(row.min_moisture) || 0,
    maxMoisture: parseFloat(row.max_moisture) || 0,
    fieldArea: parseFloat(row.field_area) || 0,
  }));

  await setCache(cacheKey, data, config.cache.metricsTTL);
  return data;
}

export async function getPumpEnergyConsumption(filters) {
  const cacheKey = generateCacheKey("pump_energy", filters);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const result = await query(
    `
    SELECT 
      ps.id as pump_id,
      ps.name as pump_name,
      ps.rated_flow,
      ps.power_rating,
      DATE(ir.start_time) as date,
      SUM(ir.water_volume) as total_water,
      SUM(ir.electricity_consumed) as total_electricity,
      SUM(ir.electricity_cost) as total_cost,
      AVG(ir.flow_rate) as avg_flow,
      COUNT(ir.id) as run_count,
      SUM(EXTRACT(EPOCH FROM (ir.end_time - ir.start_time)) / 3600) as run_hours
    FROM irrigation_records ir
    JOIN pump_stations ps ON ir.pump_station_id = ps.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    ${where}
    GROUP BY ps.id, ps.name, ps.rated_flow, ps.power_rating, DATE(ir.start_time)
    ORDER BY date ASC, ps.id ASC
    `,
    params
  );

  const data = result.rows.map((row) => ({
    pumpId: row.pump_id,
    pumpName: row.pump_name,
    ratedFlow: parseFloat(row.rated_flow) || 0,
    powerRating: parseFloat(row.power_rating) || 0,
    date: row.date.toISOString().split("T")[0],
    totalWater: parseFloat(row.total_water) || 0,
    totalElectricity: parseFloat(row.total_electricity) || 0,
    totalCost: parseFloat(row.total_cost) || 0,
    avgFlow: parseFloat(row.avg_flow) || 0,
    runCount: parseInt(row.run_count) || 0,
    runHours: parseFloat(row.run_hours) || 0,
    efficiency:
      row.rated_flow > 0
        ? Math.min((parseFloat(row.avg_flow) / parseFloat(row.rated_flow)) * 100, 100)
        : 0,
    unitWaterCost:
      parseFloat(row.total_water) > 0
        ? parseFloat(row.total_cost) / parseFloat(row.total_water)
        : 0,
  }));

  await setCache(cacheKey, data, config.cache.metricsTTL);
  return data;
}

export async function getStrategyBenefits(filters) {
  const cacheKey = generateCacheKey("strategy_benefits", filters);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const result = await query(
    `
    SELECT 
      s.id as strategy_id,
      s.name as strategy_name,
      s.strategy_type,
      c.name as crop_name,
      f.name as field_name,
      COUNT(ir.id) as application_count,
      SUM(ir.water_volume) as total_water,
      SUM(ir.electricity_cost) as total_cost,
      AVG(f.area) as avg_field_area,
      SUM(ir.water_volume) / NULLIF(COUNT(DISTINCT ir.field_id), 0) as water_per_field
    FROM irrigation_records ir
    JOIN irrigation_strategies s ON ir.strategy_id = s.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN crops c ON fcr.crop_id = c.id
    JOIN fields f ON ir.field_id = f.id
    ${where}
    GROUP BY s.id, s.name, s.strategy_type, c.name, f.name
    ORDER BY s.id ASC
    `,
    params
  );

  const baseline = await query(
    `
    SELECT 
      AVG(ir.water_volume / f.area) as baseline_water_per_mu
    FROM irrigation_records ir
    JOIN fields f ON ir.field_id = f.id
    WHERE ir.strategy_id = 1
    `
  );

  const baselineWaterPerMu = parseFloat(baseline.rows[0]?.baseline_water_per_mu) || 10;

  const data = result.rows.map((row) => ({
    strategyId: row.strategy_id,
    strategyName: row.strategy_name,
    strategyType: row.strategy_type,
    cropName: row.crop_name,
    fieldName: row.field_name,
    applicationCount: parseInt(row.application_count) || 0,
    totalWater: parseFloat(row.total_water) || 0,
    totalCost: parseFloat(row.total_cost) || 0,
    avgFieldArea: parseFloat(row.avg_field_area) || 0,
    waterPerField: parseFloat(row.water_per_field) || 0,
    waterPerMu:
      parseFloat(row.avg_field_area) > 0
        ? parseFloat(row.total_water) / parseFloat(row.avg_field_area)
        : 0,
    waterSavingRate: baselineWaterPerMu > 0
      ? Math.max(
          0,
          ((baselineWaterPerMu -
            (parseFloat(row.total_water) / parseFloat(row.avg_field_area || 1))) /
            baselineWaterPerMu) *
            100
        )
      : 0,
  }));

  await setCache(cacheKey, data, config.cache.metricsTTL);
  return data;
}

export async function getAnomalies(filters) {
  const cacheKey = generateCacheKey("anomalies", filters);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const result = await query(
    `
    SELECT 
      ir.id,
      f.name as field_name,
      c.name as crop_name,
      ps.name as pump_name,
      s.name as strategy_name,
      ir.start_time,
      ir.water_volume,
      ir.is_after_rain,
      ir.rain_amount_24h,
      ir.flow_rate,
      ps.rated_flow,
      f.area,
      c.water_requirement,
      'excessive' as anomaly_type,
      '高' as severity
    FROM irrigation_records ir
    JOIN fields f ON ir.field_id = f.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN crops c ON fcr.crop_id = c.id
    JOIN pump_stations ps ON ir.pump_station_id = ps.id
    LEFT JOIN irrigation_strategies s ON ir.strategy_id = s.id
    ${where}
    AND ir.water_volume > f.area * COALESCE(c.water_requirement, 5) * 1.5
    
    UNION ALL
    
    SELECT 
      ir.id,
      f.name as field_name,
      c.name as crop_name,
      ps.name as pump_name,
      s.name as strategy_name,
      ir.start_time,
      ir.water_volume,
      ir.is_after_rain,
      ir.rain_amount_24h,
      ir.flow_rate,
      ps.rated_flow,
      f.area,
      c.water_requirement,
      'post_rain' as anomaly_type,
      '高' as severity
    FROM irrigation_records ir
    JOIN fields f ON ir.field_id = f.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN crops c ON fcr.crop_id = c.id
    JOIN pump_stations ps ON ir.pump_station_id = ps.id
    LEFT JOIN irrigation_strategies s ON ir.strategy_id = s.id
    ${where ? where.replace("WHERE", "AND") : ""}
    AND ir.is_after_rain = true 
    AND ir.rain_amount_24h > 10 
    AND ir.water_volume > f.area * 2
    
    UNION ALL
    
    SELECT 
      ir.id,
      f.name as field_name,
      c.name as crop_name,
      ps.name as pump_name,
      s.name as strategy_name,
      ir.start_time,
      ir.water_volume,
      ir.is_after_rain,
      ir.rain_amount_24h,
      ir.flow_rate,
      ps.rated_flow,
      f.area,
      c.water_requirement,
      'low_efficiency' as anomaly_type,
      '中' as severity
    FROM irrigation_records ir
    JOIN fields f ON ir.field_id = f.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    LEFT JOIN crops c ON fcr.crop_id = c.id
    JOIN pump_stations ps ON ir.pump_station_id = ps.id
    LEFT JOIN irrigation_strategies s ON ir.strategy_id = s.id
    ${where ? where.replace("WHERE", "AND") : ""}
    AND ps.rated_flow > 0
    AND ir.flow_rate < ps.rated_flow * 0.7
    
    ORDER BY start_time DESC
    LIMIT 50
    `,
    [...params, ...params, ...params]
  );

  const data = result.rows.map((row) => ({
    id: row.id,
    fieldName: row.field_name,
    cropName: row.crop_name,
    pumpName: row.pump_name,
    strategyName: row.strategy_name,
    startTime: row.start_time,
    waterVolume: parseFloat(row.water_volume) || 0,
    isAfterRain: row.is_after_rain,
    rainAmount24h: parseFloat(row.rain_amount_24h) || 0,
    flowRate: parseFloat(row.flow_rate) || 0,
    ratedFlow: parseFloat(row.rated_flow) || 0,
    area: parseFloat(row.area) || 0,
    anomalyType: row.anomaly_type,
    severity: row.severity,
    description: getAnomalyDescription(row),
    suggestion: getAnomalySuggestion(row),
  }));

  await setCache(cacheKey, data, config.cache.defaultTTL);
  return data;
}

function getAnomalyDescription(row) {
  switch (row.anomaly_type) {
    case "excessive":
      return `灌溉水量 ${row.water_volume.toFixed(1)} m³ 超过作物需求1.5倍`;
    case "post_rain":
      return `降雨 ${row.rain_amount_24h.toFixed(1)}mm 后仍灌溉 ${row.water_volume.toFixed(1)} m³`;
    case "low_efficiency":
      return `泵站效率仅 ${((row.flow_rate / row.rated_flow) * 100).toFixed(1)}%`;
    default:
      return "未知异常";
  }
}

function getAnomalySuggestion(row) {
  switch (row.anomaly_type) {
    case "excessive":
      return "检查土壤湿度传感器，考虑缩短灌溉时长";
    case "post_rain":
      return "启用降雨联动控制，雨后自动减少灌溉量";
    case "low_efficiency":
      return "检查水泵叶轮、管道是否堵塞，检查供电电压";
    default:
      return "建议人工核查";
  }
}

export async function getSummaryStats(filters) {
  const cacheKey = generateCacheKey("summary", filters);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const { where, params } = buildWhereClause(filters);

  const result = await query(
    `
    SELECT 
      COUNT(DISTINCT ir.id) as total_irrigations,
      SUM(ir.water_volume) as total_water,
      SUM(ir.electricity_cost) as total_cost,
      SUM(CASE WHEN ir.is_after_rain THEN ir.water_volume ELSE 0 END) as post_rain_water,
      COUNT(DISTINCT ir.field_id) as active_fields,
      AVG(ir.flow_rate / ps.rated_flow) * 100 as avg_pump_efficiency
    FROM irrigation_records ir
    JOIN pump_stations ps ON ir.pump_station_id = ps.id
    LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
    ${where}
    `,
    params
  );

  const anomalyCount = await query(
    `
    SELECT COUNT(*) as count FROM (
      SELECT ir.id
      FROM irrigation_records ir
      JOIN fields f ON ir.field_id = f.id
      LEFT JOIN field_crop_relations fcr ON ir.field_id = fcr.field_id AND fcr.is_active = true
      LEFT JOIN crops c ON fcr.crop_id = c.id
      ${where}
      AND ir.water_volume > f.area * COALESCE(c.water_requirement, 5) * 1.5
      UNION
      SELECT ir.id
      FROM irrigation_records ir
      JOIN fields f ON ir.field_id = f.id
      ${where ? where.replace("WHERE", "WHERE") : "WHERE 1=1"}
      AND ir.is_after_rain = true 
      AND ir.rain_amount_24h > 10 
      AND ir.water_volume > f.area * 2
    ) anomalies
    `,
    params
  );

  const row = result.rows[0];
  const data = {
    totalIrrigations: parseInt(row.total_irrigations) || 0,
    totalWater: parseFloat(row.total_water) || 0,
    totalCost: parseFloat(row.total_cost) || 0,
    postRainWater: parseFloat(row.post_rain_water) || 0,
    activeFields: parseInt(row.active_fields) || 0,
    avgPumpEfficiency: parseFloat(row.avg_pump_efficiency) || 0,
    anomalyCount: parseInt(anomalyCount.rows[0]?.count) || 0,
    postRainRate:
      parseFloat(row.total_water) > 0
        ? (parseFloat(row.post_rain_water) / parseFloat(row.total_water)) * 100
        : 0,
  };

  await setCache(cacheKey, data, config.cache.defaultTTL);
  return data;
}

export async function getFilterOptions() {
  const cacheKey = "filter_options";
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const [fields, crops, pumps, strategies] = await Promise.all([
    query("SELECT id, name, area FROM fields ORDER BY name"),
    query("SELECT id, name, water_requirement FROM crops ORDER BY name"),
    query("SELECT id, name, rated_flow FROM pump_stations ORDER BY name"),
    query("SELECT id, name, strategy_type FROM irrigation_strategies ORDER BY name"),
  ]);

  const data = {
    fields: fields.rows.map((r) => ({ id: r.id, name: r.name, area: r.area })),
    crops: crops.rows.map((r) => ({
      id: r.id,
      name: r.name,
      waterRequirement: r.water_requirement,
    })),
    pumps: pumps.rows.map((r) => ({
      id: r.id,
      name: r.name,
      ratedFlow: r.rated_flow,
    })),
    strategies: strategies.rows.map((r) => ({
      id: r.id,
      name: r.name,
      strategyType: r.strategy_type,
    })),
  };

  await setCache(cacheKey, data, config.cache.reportTTL);
  return data;
}
