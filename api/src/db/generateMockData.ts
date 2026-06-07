import db from './init.js';
import { randomUUID } from 'crypto';

const generateId = () => randomUUID();

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const vehiclesData = [
  { plateNumber: '沪A12345', driverName: '张师傅', status: 'running' as const },
  { plateNumber: '沪B67890', driverName: '李师傅', status: 'running' as const },
  { plateNumber: '沪C11111', driverName: '王师傅', status: 'idle' as const },
  { plateNumber: '沪D22222', driverName: '赵师傅', status: 'running' as const },
  { plateNumber: '沪E33333', driverName: '刘师傅', status: 'maintenance' as const },
];

const routesData = [
  { name: '上海-北京线', origin: '上海', destination: '北京', distanceKm: 1200 },
  { name: '上海-广州线', origin: '上海', destination: '广州', distanceKm: 1500 },
  { name: '上海-深圳线', origin: '上海', destination: '深圳', distanceKm: 1450 },
  { name: '上海-杭州线', origin: '上海', destination: '杭州', distanceKm: 180 },
  { name: '上海-南京线', origin: '上海', destination: '南京', distanceKm: 300 },
];

const customersData = [
  { name: '北京生鲜超市', address: '北京市朝阳区建国路88号', contact: '陈经理 13800138001' },
  { name: '广州冷链物流中心', address: '广州市天河区珠江新城', contact: '林总 13900139002' },
  { name: '深圳食品有限公司', address: '深圳市南山区科技园', contact: '黄经理 13700137003' },
  { name: '杭州农产品市场', address: '杭州市余杭区农副产品中心', contact: '吴总 13600136004' },
  { name: '南京餐饮配送公司', address: '南京市鼓楼区汉中门大街', contact: '周经理 13500135005' },
];

function generateMockData() {
  const insertVehicle = db.prepare(
    'INSERT INTO vehicles (id, plate_number, driver_name, status) VALUES (?, ?, ?, ?)'
  );
  const vehicles: { id: string; plateNumber: string }[] = [];
  for (const v of vehiclesData) {
    const id = generateId();
    insertVehicle.run(id, v.plateNumber, v.driverName, v.status);
    vehicles.push({ id, plateNumber: v.plateNumber });
  }

  const insertRoute = db.prepare(
    'INSERT INTO routes (id, name, origin, destination, distance_km) VALUES (?, ?, ?, ?, ?)'
  );
  const routes: { id: string; name: string; distanceKm: number }[] = [];
  for (const r of routesData) {
    const id = generateId();
    insertRoute.run(id, r.name, r.origin, r.destination, r.distanceKm);
    routes.push({ id, name: r.name, distanceKm: r.distanceKm });
  }

  const insertCustomer = db.prepare(
    'INSERT INTO customers (id, name, address, contact) VALUES (?, ?, ?, ?)'
  );
  const customers: { id: string; name: string }[] = [];
  for (const c of customersData) {
    const id = generateId();
    insertCustomer.run(id, c.name, c.address, c.contact);
    customers.push({ id, name: c.name });
  }

  const insertProbe = db.prepare(
    'INSERT INTO temperature_probes (id, vehicle_id, box_id, last_calibration_date, next_calibration_date, calibration_status) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const probes: { id: string; vehicleId: string }[] = [];
  for (const v of vehicles) {
    for (let i = 1; i <= 2; i++) {
      const id = generateId();
      const lastCal = now - 30 * DAY_MS * Math.random();
      const nextCal = lastCal + 180 * DAY_MS;
      const daysUntilNext = (nextCal - now) / DAY_MS;
      let status: 'valid' | 'expiring' | 'expired' = 'valid';
      if (daysUntilNext < 0) status = 'expired';
      else if (daysUntilNext < 30) status = 'expiring';
      
      insertProbe.run(
        id, v.id, `BOX-${i}`,
        new Date(lastCal).toISOString().split('T')[0],
        new Date(nextCal).toISOString().split('T')[0],
        status
      );
      probes.push({ id, vehicleId: v.id });
    }
  }

  const insertBatch = db.prepare(
    'INSERT INTO delivery_batches (id, vehicle_id, route_id, customer_id, start_time, estimated_arrival, actual_arrival, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertTempRecord = db.prepare(
    'INSERT INTO temperature_records (id, vehicle_id, batch_id, probe_id, timestamp, temperature, is_normal) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertPosRecord = db.prepare(
    'INSERT INTO position_records (id, vehicle_id, timestamp, lat, lng, speed) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertDoorRecord = db.prepare(
    'INSERT INTO door_records (id, vehicle_id, batch_id, open_time, close_time, duration_seconds, operator) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertAnomaly = db.prepare(
    'INSERT INTO anomaly_events (id, batch_id, vehicle_id, type, start_time, end_time, duration_seconds, severity, responsible, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const batches: { id: string; vehicleId: string; startTime: number }[] = [];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const dayStart = new Date(now - dayOffset * DAY_MS);
    dayStart.setHours(6, 0, 0, 0);

    for (let vIdx = 0; vIdx < vehicles.length; vIdx++) {
      const vehicle = vehicles[vIdx];
      if (vehiclesData[vIdx].status === 'maintenance') continue;
      
      const route = routes[Math.floor(Math.random() * routes.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      
      const startTime = dayStart.getTime() + vIdx * 2 * HOUR_MS;
      const duration = Math.floor((route.distanceKm / 60) * HOUR_MS);
      const estimatedArrival = startTime + duration;
      const delay = Math.random() > 0.7 ? Math.floor(Math.random() * 2 * HOUR_MS) : 0;
      const actualArrival = estimatedArrival + delay;
      const status = delay > HOUR_MS ? 'exception' : 'delivered';
      
      const batchId = generateId();
      insertBatch.run(
        batchId, vehicle.id, route.id, customer.id,
        new Date(startTime).toISOString(),
        new Date(estimatedArrival).toISOString(),
        new Date(actualArrival).toISOString(),
        status
      );
      batches.push({ id: batchId, vehicleId: vehicle.id, startTime });

      const vehicleProbes = probes.filter(p => p.vehicleId === vehicle.id);
      
      const anomalyStart = startTime + Math.floor(Math.random() * duration * 0.6);
      const anomalyDuration = Math.floor(Math.random() * 30 * 60 * 1000);
      const hasAnomaly = Math.random() > 0.5;
      
      for (let t = startTime; t < actualArrival; t += 5 * 60 * 1000) {
        for (const probe of vehicleProbes) {
          let temp = 2 + Math.random() * 4;
          const inAnomaly = hasAnomaly && t >= anomalyStart && t <= anomalyStart + anomalyDuration;
          if (inAnomaly) {
            temp = 8 + Math.random() * 5;
          }
          const isNormal = temp >= 0 && temp <= 8;
          
          insertTempRecord.run(
            generateId(), vehicle.id, batchId, probe.id,
            new Date(t).toISOString(), temp, isNormal ? 1 : 0
          );
        }

        const progress = (t - startTime) / duration;
        const baseLat = 31.2304 + (40.7128 - 31.2304) * progress;
        const baseLng = 121.4737 + (116.4074 - 121.4737) * progress;
        const lat = baseLat + (Math.random() - 0.5) * 0.1;
        const lng = baseLng + (Math.random() - 0.5) * 0.1;
        
        insertPosRecord.run(
          generateId(), vehicle.id, new Date(t).toISOString(),
          lat, lng, 50 + Math.random() * 30
        );
      }

      if (hasAnomaly) {
        const anomalyType = Math.random() > 0.5 ? 'temp_high' : 'door_open';
        const severity = Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low';
        insertAnomaly.run(
          generateId(), batchId, vehicle.id, anomalyType,
          new Date(anomalyStart).toISOString(),
          new Date(anomalyStart + anomalyDuration).toISOString(),
          Math.floor(anomalyDuration / 1000),
          severity, vehiclesData[vIdx].driverName,
          anomalyType === 'temp_high' ? '运输途中温度异常升高' : '车门非正常开启',
          severity === 'high' ? 'pending' : 'processing'
        );

        if (anomalyType === 'door_open') {
          insertDoorRecord.run(
            generateId(), vehicle.id, batchId,
            new Date(anomalyStart).toISOString(),
            new Date(anomalyStart + anomalyDuration).toISOString(),
            Math.floor(anomalyDuration / 1000),
            vehiclesData[vIdx].driverName
          );
        }
      }

      const unloadingTime = actualArrival;
      insertDoorRecord.run(
        generateId(), vehicle.id, batchId,
        new Date(unloadingTime).toISOString(),
        new Date(unloadingTime + 15 * 60 * 1000).toISOString(),
        15 * 60, '卸货员'
      );
    }
  }

  const today = new Date(now).toISOString().split('T')[0];
  const insertQualityLog = db.prepare(
    'INSERT INTO data_quality_logs (id, data_date, update_time, completeness, missing_fields_json, anomaly_points, is_update_failed, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  
  const missingFields = [
    { field: 'temperature', missingCount: 12 },
    { field: 'position', missingCount: 5 },
    { field: 'door_records', missingCount: 3 },
  ];
  
  insertQualityLog.run(
    generateId(), today, new Date(now).toISOString(),
    97.8, JSON.stringify(missingFields),
    23, 0, null
  );

  console.log('Mock data generated successfully!');
  console.log(`Vehicles: ${vehicles.length}`);
  console.log(`Routes: ${routes.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Batches: ${batches.length}`);
}

try {
  generateMockData();
} catch (error) {
  console.error('Error generating mock data:', error);
}

export default generateMockData;
