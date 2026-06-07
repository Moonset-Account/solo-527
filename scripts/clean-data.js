import { query, getClient } from "../server/db/index.js";

export async function cleanIrrigationData() {
  console.log("开始清洗灌溉数据...");

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const deletedDuplicates = await client.query(`
      DELETE FROM irrigation_records 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY field_id, pump_station_id, start_time 
            ORDER BY created_at DESC
          ) as rn
          FROM irrigation_records
        ) t WHERE t.rn > 1
      )
    `);
    console.log(`删除重复记录: ${deletedDuplicates.rowCount} 条`);

    const fixedFlowRate = await client.query(`
      UPDATE irrigation_records 
      SET flow_rate = water_volume / (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
      WHERE (flow_rate IS NULL OR flow_rate <= 0)
        AND end_time > start_time
        AND water_volume > 0
    `);
    console.log(`修复流量数据: ${fixedFlowRate.rowCount} 条`);

    const fixedElectricity = await client.query(`
      UPDATE irrigation_records 
      SET electricity_consumed = (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) * ps.power_rating,
          electricity_cost = ((EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) * ps.power_rating) * er.rate_per_kwh
      FROM pump_stations ps, electricity_rates er
      WHERE irrigation_records.pump_station_id = ps.id
        AND er.effective_date = (
          SELECT MAX(effective_date) FROM electricity_rates 
          WHERE effective_date <= DATE(irrigation_records.start_time)
        )
        AND (irrigation_records.electricity_consumed IS NULL OR irrigation_records.electricity_consumed <= 0)
        AND irrigation_records.end_time > irrigation_records.start_time
    `);
    console.log(`修复电量/电费数据: ${fixedElectricity.rowCount} 条`);

    const markedPostRain = await client.query(`
      UPDATE irrigation_records ir
      SET is_after_rain = true,
          rain_amount_24h = COALESCE(w.rainfall, 0)
      FROM weather_records w
      WHERE DATE(ir.start_time) = w.record_date
        AND w.rainfall > 5
        AND ir.is_after_rain = false
    `);
    console.log(`标记雨后灌溉: ${markedPostRain.rowCount} 条`);

    const deletedAbnormal = await client.query(`
      DELETE FROM irrigation_records
      WHERE water_volume <= 0 
         OR end_time <= start_time
         OR flow_rate > 1000
    `);
    console.log(`删除异常数据: ${deletedAbnormal.rowCount} 条`);

    const fixedMoisture = await client.query(`
      UPDATE soil_moisture_readings
      SET moisture_level = CASE 
        WHEN moisture_level > 100 THEN 100
        WHEN moisture_level < 0 THEN 0
        ELSE moisture_level
      END
      WHERE moisture_level > 100 OR moisture_level < 0
    `);
    console.log(`修正湿度范围: ${fixedMoisture.rowCount} 条`);

    await client.query("COMMIT");
    console.log("✅ 数据清洗完成");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ 数据清洗失败:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function validateDataQuality() {
  console.log("\n开始数据质量检查...");

  const checks = [
    {
      name: "灌溉记录总数",
      query: "SELECT COUNT(*) as count FROM irrigation_records",
      field: "count",
    },
    {
      name: "缺失流量数据",
      query: "SELECT COUNT(*) as count FROM irrigation_records WHERE flow_rate IS NULL OR flow_rate <= 0",
      field: "count",
    },
    {
      name: "缺失电量数据",
      query: "SELECT COUNT(*) as count FROM irrigation_records WHERE electricity_consumed IS NULL",
      field: "count",
    },
    {
      name: "土壤湿度异常值",
      query: "SELECT COUNT(*) as count FROM soil_moisture_readings WHERE moisture_level > 100 OR moisture_level < 0",
      field: "count",
    },
    {
      name: "时间异常记录",
      query: "SELECT COUNT(*) as count FROM irrigation_records WHERE end_time <= start_time",
      field: "count",
    },
  ];

  for (const check of checks) {
    const result = await query(check.query);
    console.log(`${check.name}: ${result.rows[0][check.field]}`);
  }

  console.log("✅ 数据质量检查完成");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await cleanIrrigationData();
    await validateDataQuality();
    process.exit(0);
  })();
}
