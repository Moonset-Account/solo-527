import { getDbClient, testDbConnection, isPostgisAvailable } from './client'
import {
  stations,
  vehicles,
  loadingTeams,
  weatherRecords,
  waybills,
  scanRecords,
  delayRecords,
  exceptions,
} from '../data/mockData'
import { readFileSync } from 'fs'
import { join } from 'path'

async function initSchema() {
  const sql = getDbClient()
  const schemaPath = join(process.cwd(), 'lib', 'db', 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  
  console.log('📋 Initializing database schema...')
  
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt)
    } catch (e) {
      console.warn(`  ⚠️  Skipping statement: ${(e as Error).message.substring(0, 80)}`)
    }
  }
  
  console.log('✅ Schema initialized')
}

async function seedStations() {
  const sql = getDbClient()
  console.log('📍 Seeding stations...')
  
  for (const stn of stations) {
    await sql`
      INSERT INTO transfer_stations (id, name, code, province, city, level, location)
      VALUES (
        ${stn.id}, 
        ${stn.name}, 
        ${stn.code}, 
        ${stn.province}, 
        ${stn.city}, 
        ${stn.level},
        ST_SetSRID(ST_MakePoint(${stn.location.lng}, ${stn.location.lat}), 4326)::geography
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        location = EXCLUDED.location
    `
  }
  console.log(`  ✅ Inserted ${stations.length} stations`)
}

async function seedVehicles() {
  const sql = getDbClient()
  console.log('🚚 Seeding vehicles...')
  
  for (const v of vehicles) {
    await sql`
      INSERT INTO vehicles (id, plate_number, type, capacity, status, team_id)
      VALUES (${v.id}, ${v.plateNumber}, ${v.type}, ${v.capacity}, ${v.status}, ${v.teamId})
      ON CONFLICT (id) DO UPDATE SET
        plate_number = EXCLUDED.plate_number,
        status = EXCLUDED.status
    `
  }
  console.log(`  ✅ Inserted ${vehicles.length} vehicles`)
}

async function seedLoadingTeams() {
  const sql = getDbClient()
  console.log('👥 Seeding loading teams...')
  
  for (const team of loadingTeams) {
    await sql`
      INSERT INTO loading_teams (id, name, station_id, shift, size)
      VALUES (${team.id}, ${team.name}, ${team.stationId}, ${team.shift}, ${team.size})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        shift = EXCLUDED.shift
    `
  }
  console.log(`  ✅ Inserted ${loadingTeams.length} loading teams`)
}

async function seedWeather() {
  const sql = getDbClient()
  console.log('🌤️  Seeding weather records...')
  
  let count = 0
  for (const wr of weatherRecords) {
    await sql`
      INSERT INTO weather_records (id, station_id, timestamp, condition, temperature, wind_speed, visibility)
      VALUES (${wr.id}, ${wr.stationId}, ${wr.timestamp}, ${wr.condition}, ${wr.temperature}, ${wr.windSpeed}, ${wr.visibility})
      ON CONFLICT (id) DO NOTHING
    `
    count++
  }
  
  console.log(`  ✅ Inserted ${count} weather records`)
}

async function seedWaybills() {
  const sql = getDbClient()
  console.log('📦 Seeding waybills...')
  
  let count = 0
  for (const wb of waybills) {
    await sql`
      INSERT INTO waybills (id, waybill_number, origin_station_id, dest_station_id, vehicle_id, created_time, estimated_arrival, actual_arrival, status, priority)
      VALUES (
        ${wb.id}, ${wb.waybillNumber}, ${wb.originStationId}, ${wb.destStationId}, ${wb.vehicleId},
        ${wb.createdTime}, ${wb.estimatedArrival}, ${wb.actualArrival}, ${wb.status}, ${wb.priority}
      )
      ON CONFLICT (id) DO NOTHING
    `
    count++
  }
  
  console.log(`  ✅ Inserted ${count} waybills`)
}

async function seedScanRecords() {
  const sql = getDbClient()
  console.log('🔍 Seeding scan records...')
  
  let count = 0
  for (const scan of scanRecords) {
    await sql`
      INSERT INTO scan_records (id, waybill_id, vehicle_id, station_id, scan_type, timestamp, operator_id, location)
      VALUES (
        ${scan.id},
        ${scan.waybillId},
        ${scan.vehicleId},
        ${scan.stationId},
        ${scan.scanType},
        ${scan.timestamp},
        ${scan.operatorId},
        ST_SetSRID(ST_MakePoint(${scan.location.lng}, ${scan.location.lat}), 4326)::geography
      )
      ON CONFLICT (id) DO NOTHING
    `
    count++
  }
  
  console.log(`  ✅ Inserted ${count} scan records`)
}

async function seedDelayRecords() {
  const sql = getDbClient()
  console.log('⏱️  Seeding delay records...')
  
  let count = 0
  for (const dr of delayRecords) {
    await sql`
      INSERT INTO delay_records (
        id, waybill_id, station_id, vehicle_id, arrival_scan_id, departure_scan_id,
        arrival_time, departure_time, business_day, duration_minutes, is_overnight,
        is_delayed, delay_category, loading_team_id, attributed_to_team
      )
      VALUES (
        ${dr.id}, ${dr.waybillId}, ${dr.stationId}, ${dr.vehicleId}, ${dr.arrivalScanId}, ${dr.departureScanId},
        ${dr.arrivalTime}, ${dr.departureTime}, ${dr.businessDay}, ${dr.durationMinutes}, ${dr.isOvernight},
        ${dr.isDelayed}, ${dr.delayCategory}, ${dr.loadingTeamId}, ${dr.attributedToTeam}
      )
      ON CONFLICT (id) DO NOTHING
    `
    count++
  }
  
  console.log(`  ✅ Inserted ${count} delay records`)
}

async function seedExceptions() {
  const sql = getDbClient()
  console.log('⚠️  Seeding exception records...')
  
  let count = 0
  for (const exc of exceptions) {
    await sql`
      INSERT INTO exception_records (
        id, waybill_id, station_id, timestamp, type, severity,
        description, handling_status, handler_id
      )
      VALUES (
        ${exc.id}, ${exc.waybillId}, ${exc.stationId}, ${exc.timestamp}, ${exc.type}, ${exc.severity},
        ${exc.description}, ${exc.handlingStatus}, ${exc.handlerId}
      )
      ON CONFLICT (id) DO NOTHING
    `
    count++
  }
  
  console.log(`  ✅ Inserted ${count} exception records`)
}

async function main() {
  console.log('🚀 Starting database seed...\n')
  
  const connected = await testDbConnection()
  if (!connected) {
    console.error('❌ Could not connect to database')
    console.log('💡 Make sure PostgreSQL + PostGIS is running and DATABASE_URL is set')
    console.log('💡 The app will still work with mock data')
    process.exit(0)
  }

  const postgisOk = await isPostgisAvailable()
  if (!postgisOk) {
    console.error('❌ PostGIS is not available')
    process.exit(1)
  }
  console.log('✅ PostGIS is available\n')

  await initSchema()
  console.log()

  await seedStations()
  await seedVehicles()
  await seedLoadingTeams()
  await seedWeather()
  await seedWaybills()
  await seedScanRecords()
  await seedDelayRecords()
  await seedExceptions()

  console.log('\n🎉 Seed complete!')
  process.exit(0)
}

main().catch(e => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
