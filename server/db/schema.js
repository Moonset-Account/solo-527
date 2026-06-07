import { query } from "../db/index.js";

export async function createTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS fields (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      area NUMERIC(10,2) NOT NULL,
      soil_type VARCHAR(50),
      location VARCHAR(200),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crops (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      variety VARCHAR(100),
      growth_stage VARCHAR(50),
      water_requirement NUMERIC(8,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pump_stations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      model VARCHAR(100),
      rated_flow NUMERIC(10,2),
      power_rating NUMERIC(8,2),
      efficiency NUMERIC(5,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS irrigation_strategies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      strategy_type VARCHAR(50),
      parameters JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS field_crop_relations (
      id SERIAL PRIMARY KEY,
      field_id INTEGER REFERENCES fields(id),
      crop_id INTEGER REFERENCES crops(id),
      planting_date DATE,
      harvest_date DATE,
      is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS irrigation_records (
      id SERIAL PRIMARY KEY,
      field_id INTEGER REFERENCES fields(id),
      pump_station_id INTEGER REFERENCES pump_stations(id),
      strategy_id INTEGER REFERENCES irrigation_strategies(id),
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      water_volume NUMERIC(12,2) NOT NULL,
      electricity_consumed NUMERIC(10,2),
      electricity_cost NUMERIC(10,2),
      flow_rate NUMERIC(8,2),
      pressure NUMERIC(8,2),
      is_after_rain BOOLEAN DEFAULT false,
      rain_amount_24h NUMERIC(8,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS soil_moisture_readings (
      id SERIAL PRIMARY KEY,
      field_id INTEGER REFERENCES fields(id),
      reading_time TIMESTAMP NOT NULL,
      moisture_level NUMERIC(5,2) NOT NULL,
      sensor_depth NUMERIC(6,2),
      temperature NUMERIC(5,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weather_records (
      id SERIAL PRIMARY KEY,
      record_date DATE NOT NULL,
      rainfall NUMERIC(8,2) DEFAULT 0,
      temperature_avg NUMERIC(5,2),
      temperature_max NUMERIC(5,2),
      temperature_min NUMERIC(5,2),
      humidity_avg NUMERIC(5,2),
      wind_speed NUMERIC(6,2),
      solar_radiation NUMERIC(8,2),
      et0 NUMERIC(8,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(record_date)
    );

    CREATE TABLE IF NOT EXISTS electricity_rates (
      id SERIAL PRIMARY KEY,
      effective_date DATE NOT NULL,
      rate_per_kwh NUMERIC(8,4) NOT NULL,
      peak_rate NUMERIC(8,4),
      off_peak_rate NUMERIC(8,4),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_irrigation_records_field_time 
      ON irrigation_records(field_id, start_time DESC);
    CREATE INDEX IF NOT EXISTS idx_irrigation_records_pump 
      ON irrigation_records(pump_station_id, start_time DESC);
    CREATE INDEX IF NOT EXISTS idx_soil_moisture_field_time 
      ON soil_moisture_readings(field_id, reading_time DESC);
    CREATE INDEX IF NOT EXISTS idx_weather_date 
      ON weather_records(record_date DESC);
  `);

  console.log("✅ 数据库表创建完成");
}

export async function dropTables() {
  await query(`
    DROP TABLE IF EXISTS irrigation_records CASCADE;
    DROP TABLE IF EXISTS soil_moisture_readings CASCADE;
    DROP TABLE IF EXISTS weather_records CASCADE;
    DROP TABLE IF EXISTS field_crop_relations CASCADE;
    DROP TABLE IF EXISTS electricity_rates CASCADE;
    DROP TABLE IF EXISTS fields CASCADE;
    DROP TABLE IF EXISTS crops CASCADE;
    DROP TABLE IF EXISTS pump_stations CASCADE;
    DROP TABLE IF EXISTS irrigation_strategies CASCADE;
  `);
  console.log("✅ 数据库表已删除");
}
