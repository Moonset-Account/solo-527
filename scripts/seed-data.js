import { query, getClient } from "../server/db/index.js";
import { createTables } from "../server/db/schema.js";

const sampleFields = [
  { name: "东一号田", area: 120, soil_type: "壤土", location: "东区" },
  { name: "东二号田", area: 95, soil_type: "砂壤土", location: "东区" },
  { name: "西一号田", area: 150, soil_type: "黏土", location: "西区" },
  { name: "西二号田", area: 110, soil_type: "壤土", location: "西区" },
  { name: "南一号田", area: 80, soil_type: "砂壤土", location: "南区" },
  { name: "北一号田", area: 130, soil_type: "壤土", location: "北区" },
];

const sampleCrops = [
  { name: "冬小麦", variety: "济麦22", growth_stage: "灌浆期", water_requirement: 4.5 },
  { name: "夏玉米", variety: "郑单958", growth_stage: "拔节期", water_requirement: 5.2 },
  { name: "大豆", variety: "徐豆18", growth_stage: "开花期", water_requirement: 3.8 },
  { name: "棉花", variety: "鲁棉研28", growth_stage: "蕾期", water_requirement: 3.2 },
];

const samplePumps = [
  { name: "1号泵站", model: "IS150-125-250", rated_flow: 200, power_rating: 55, efficiency: 78 },
  { name: "2号泵站", model: "IS125-100-200", rated_flow: 160, power_rating: 37, efficiency: 76 },
  { name: "3号泵站", model: "IS100-80-160", rated_flow: 100, power_rating: 22, efficiency: 75 },
];

const sampleStrategies = [
  { name: "传统漫灌", description: "传统地面灌溉方式", strategy_type: "traditional", parameters: { method: "flood" } },
  { name: "喷灌", description: "移动式喷灌系统", strategy_type: "sprinkler", parameters: { method: "sprinkler", intensity: 10 } },
  { name: "滴灌", description: "地表滴灌系统", strategy_type: "drip", parameters: { method: "drip", emitter_rate: 2 } },
  { name: "智能灌溉", description: "基于土壤湿度的智能控制", strategy_type: "smart", parameters: { method: "smart", target_moisture: 70 } },
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export async function seedDatabase() {
  console.log("开始初始化数据库...");
  await createTables();

  const client = await getClient();
  try {
    await client.query("BEGIN");

    console.log("插入基础数据...");

    for (const field of sampleFields) {
      await client.query(
        "INSERT INTO fields (name, area, soil_type, location) VALUES ($1, $2, $3, $4)",
        [field.name, field.area, field.soil_type, field.location]
      );
    }

    for (const crop of sampleCrops) {
      await client.query(
        "INSERT INTO crops (name, variety, growth_stage, water_requirement) VALUES ($1, $2, $3, $4)",
        [crop.name, crop.variety, crop.growth_stage, crop.water_requirement]
      );
    }

    for (const pump of samplePumps) {
      await client.query(
        "INSERT INTO pump_stations (name, model, rated_flow, power_rating, efficiency) VALUES ($1, $2, $3, $4, $5)",
        [pump.name, pump.model, pump.rated_flow, pump.power_rating, pump.efficiency]
      );
    }

    for (const strategy of sampleStrategies) {
      await client.query(
        "INSERT INTO irrigation_strategies (name, description, strategy_type, parameters) VALUES ($1, $2, $3, $4)",
        [strategy.name, strategy.description, strategy.strategy_type, strategy.parameters]
      );
    }

    const fieldCropRelations = [
      { fieldId: 1, cropId: 1 },
      { fieldId: 2, cropId: 2 },
      { fieldId: 3, cropId: 1 },
      { fieldId: 4, cropId: 3 },
      { fieldId: 5, cropId: 4 },
      { fieldId: 6, cropId: 2 },
    ];

    for (const rel of fieldCropRelations) {
      await client.query(
        "INSERT INTO field_crop_relations (field_id, crop_id, planting_date, is_active) VALUES ($1, $2, $3, true)",
        [rel.fieldId, rel.cropId, "2024-10-01"]
      );
    }

    await client.query(
      "INSERT INTO electricity_rates (effective_date, rate_per_kwh, peak_rate, off_peak_rate) VALUES ($1, $2, $3, $4)",
      ["2024-01-01", 0.65, 0.95, 0.35]
    );

    console.log("生成天气数据...");
    const startDate = new Date("2025-04-01");
    const endDate = new Date("2025-06-07");
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const rainfall = Math.random() > 0.8 ? randomBetween(5, 40) : 0;
      const tempAvg = randomBetween(15, 30);
      await client.query(
        `INSERT INTO weather_records (record_date, rainfall, temperature_avg, temperature_max, temperature_min, humidity_avg, wind_speed, solar_radiation, et0) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (record_date) DO NOTHING`,
        [
          currentDate.toISOString().split("T")[0],
          rainfall.toFixed(1),
          tempAvg.toFixed(1),
          (tempAvg + randomBetween(3, 8)).toFixed(1),
          (tempAvg - randomBetween(5, 10)).toFixed(1),
          randomBetween(40, 80).toFixed(1),
          randomBetween(1, 6).toFixed(1),
          randomBetween(10, 25).toFixed(1),
          (rainfall > 0 ? randomBetween(1, 3) : randomBetween(3, 6)).toFixed(1),
        ]
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("生成灌溉记录...");
    for (let i = 0; i < 200; i++) {
      const fieldId = Math.floor(Math.random() * 6) + 1;
      const pumpId = Math.floor(Math.random() * 3) + 1;
      const strategyId = Math.floor(Math.random() * 4) + 1;
      const irrigDate = randomDate(startDate, endDate);
      const duration = randomBetween(1, 6);
      const startTime = new Date(irrigDate);
      startTime.setHours(Math.floor(randomBetween(6, 20)), 0, 0, 0);
      const endTime = new Date(startTime.getTime() + duration * 3600000);

      const pump = samplePumps[pumpId - 1];
      const flowRate = pump.rated_flow * randomBetween(0.6, 1.0);
      const waterVolume = flowRate * duration;
      const electricity = (pump.power_rating * duration) * randomBetween(0.9, 1.1);
      const cost = electricity * 0.65;

      const weatherCheck = await client.query(
        "SELECT rainfall FROM weather_records WHERE record_date = $1",
        [startTime.toISOString().split("T")[0]]
      );
      const rainfall = parseFloat(weatherCheck.rows[0]?.rainfall || 0);
      const isAfterRain = rainfall > 5;

      await client.query(
        `INSERT INTO irrigation_records 
         (field_id, pump_station_id, strategy_id, start_time, end_time, water_volume, 
          electricity_consumed, electricity_cost, flow_rate, pressure, is_after_rain, rain_amount_24h)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          fieldId,
          pumpId,
          strategyId,
          startTime,
          endTime,
          waterVolume.toFixed(2),
          electricity.toFixed(2),
          cost.toFixed(2),
          flowRate.toFixed(2),
          randomBetween(0.2, 0.5).toFixed(2),
          isAfterRain,
          rainfall.toFixed(1),
        ]
      );
    }

    console.log("生成土壤湿度数据...");
    for (let fieldId = 1; fieldId <= 6; fieldId++) {
      let moistureDate = new Date(startDate);
      while (moistureDate <= endDate) {
        for (let hour = 6; hour <= 20; hour += 4) {
          const readingTime = new Date(moistureDate);
          readingTime.setHours(hour, 0, 0, 0);

          const baseMoisture = randomBetween(55, 80);

          await client.query(
            `INSERT INTO soil_moisture_readings (field_id, reading_time, moisture_level, sensor_depth, temperature)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              fieldId,
              readingTime,
              baseMoisture.toFixed(1),
              20,
              randomBetween(18, 28).toFixed(1),
            ]
          );
        }
        moistureDate.setDate(moistureDate.getDate() + 1);
      }
    }

    await client.query("COMMIT");
    console.log("✅ 数据种子生成完成！");

    const counts = await Promise.all([
      client.query("SELECT COUNT(*) FROM fields"),
      client.query("SELECT COUNT(*) FROM irrigation_records"),
      client.query("SELECT COUNT(*) FROM soil_moisture_readings"),
      client.query("SELECT COUNT(*) FROM weather_records"),
    ]);

    console.log("\n数据统计:");
    console.log(`  地块: ${counts[0].rows[0].count}`);
    console.log(`  灌溉记录: ${counts[1].rows[0].count}`);
    console.log(`  湿度读数: ${counts[2].rows[0].count}`);
    console.log(`  天气记录: ${counts[3].rows[0].count}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ 数据种子生成失败:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await seedDatabase();
    process.exit(0);
  })();
}
