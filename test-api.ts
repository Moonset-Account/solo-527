import { getKPIData, getVehicles, getRoutes, getTemperatureTrend } from './api/src/services/dataService.js';

console.log('Testing API services...\n');

try {
  console.log('1. Testing getVehicles...');
  const vehicles = getVehicles();
  console.log(`   Found ${vehicles.length} vehicles`);
  console.log(`   First: ${vehicles[0]?.plateNumber}\n`);

  console.log('2. Testing getRoutes...');
  const routes = getRoutes();
  console.log(`   Found ${routes.length} routes\n`);

  console.log('3. Testing getKPIData...');
  const kpi = getKPIData();
  console.log(`   Active vehicles: ${kpi.activeVehicles}`);
  console.log(`   Anomaly rate: ${kpi.temperatureAnomalyRate}%`);
  console.log(`   On-time rate: ${kpi.onTimeRate}%\n`);

  console.log('4. Testing getTemperatureTrend...');
  const temps = getTemperatureTrend();
  console.log(`   Found ${temps.length} temperature records\n`);

  console.log('✅ All tests passed!');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
