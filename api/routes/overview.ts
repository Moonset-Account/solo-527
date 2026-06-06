import { Router, Request, Response } from 'express';
import type { ApiResponse, KPIData, Station, Alert, HourlyData } from '@shared/types';
import { mockStations, mockTrips, mockAlerts } from '../data/mockData';
import { getLastUpdateTime, getDataVersion, getEtlWarnings, calculateAvailableInventory, getDataStore } from '../data/etl';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const store = getDataStore();
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    let todayTrips = 0;
    let activeBikeIds = new Set<string>();
    const hourlyCounts = new Array(24).fill(0);
    
    for (let i = 0; i < store.tripIds.length; i++) {
      const startTime = store.trips.startTime[i];
      if (startTime >= todayStart.getTime()) {
        todayTrips++;
        activeBikeIds.add(store.trips.bikeId[i]);
        const hour = new Date(startTime).getHours();
        hourlyCounts[hour]++;
      }
    }

    const availableBikes = calculateAvailableInventory();
    const totalCapacity = mockStations.reduce((sum, s) => sum + s.capacity, 0);
    const totalMaintenance = mockStations.reduce((sum, s) => sum + s.maintenanceBikes, 0);
    
    const kpi: KPIData = {
      todayTrips,
      activeBikes: activeBikeIds.size,
      availableBikes,
      maintenanceBikes: totalMaintenance,
      dispatchCount: 23,
      alertCount: mockAlerts.length,
      tripGrowth: 12.5,
      availabilityRate: Math.round((availableBikes / (availableBikes + totalMaintenance)) * 100),
    };

    const hourlyData: HourlyData[] = hourlyCounts.map((trips, hour) => ({
      hour,
      trips,
    }));

    const stations: Station[] = mockStations.map(s => ({ ...s }));
    const alerts: Alert[] = [...mockAlerts].sort((a, b) => b.createTime - a.createTime).slice(0, 10);

    const response: ApiResponse<any> = {
      code: 0,
      message: 'success',
      data: {
        kpi,
        stations,
        alerts,
        hourlyData,
      },
      etlInfo: {
        updateTime: getLastUpdateTime(),
        dataVersion: getDataVersion(),
        warnings: getEtlWarnings(),
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: (error as Error).message,
      data: null,
    });
  }
});

export default router;
