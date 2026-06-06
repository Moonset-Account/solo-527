import { Router, Request, Response } from 'express';
import type { ApiResponse, ODRoute } from '@shared/types';
import { mockTrips, mockStations } from '../data/mockData';
import { getLastUpdateTime, getDataVersion, getEtlWarnings } from '../data/etl';

const router = Router();

router.get('/od', (req: Request, res: Response) => {
  try {
    const odMap = new Map<string, { count: number; totalDuration: number }>();
    
    const stationAreaMap = new Map(mockStations.map(s => [s.id, s.area]));
    
    for (const trip of mockTrips) {
      const startArea = stationAreaMap.get(trip.startStationId) || '未知';
      const endArea = stationAreaMap.get(trip.endStationId) || '未知';
      const key = `${startArea}->${endArea}`;
      
      const existing = odMap.get(key);
      if (existing) {
        existing.count++;
        existing.totalDuration += trip.duration;
      } else {
        odMap.set(key, { count: 1, totalDuration: trip.duration });
      }
    }

    const odRoutes: ODRoute[] = Array.from(odMap.entries()).map(([key, value]) => {
      const [startArea, endArea] = key.split('->');
      return {
        startArea,
        endArea,
        count: value.count,
        avgDuration: Math.round(value.totalDuration / value.count),
      };
    }).sort((a, b) => b.count - a.count);

    const response: ApiResponse<ODRoute[]> = {
      code: 0,
      message: 'success',
      data: odRoutes.slice(0, 50),
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

router.get('/top', (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;
    const stationNameMap = new Map(mockStations.map(s => [s.id, s.name]));
    
    const routeMap = new Map<string, { count: number; startStation: string; endStation: string }>();
    
    for (const trip of mockTrips) {
      const key = `${trip.startStationId}->${trip.endStationId}`;
      const existing = routeMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        routeMap.set(key, {
          count: 1,
          startStation: stationNameMap.get(trip.startStationId) || trip.startStationId,
          endStation: stationNameMap.get(trip.endStationId) || trip.endStationId,
        });
      }
    }

    const topRoutes = Array.from(routeMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, Number(limit));

    const response: ApiResponse<any[]> = {
      code: 0,
      message: 'success',
      data: topRoutes,
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
