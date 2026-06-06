import { Router, Request, Response } from 'express';
import type { ApiResponse, Station, StationTrend } from '@shared/types';
import { mockStations, generateStationTrend } from '../data/mockData';
import { getLastUpdateTime, getDataVersion, getEtlWarnings, getDataStore } from '../data/etl';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { area, status, minAvailable, maxAvailable } = req.query;
    
    let stations = [...mockStations];
    
    if (area) {
      const areas = (area as string).split(',');
      stations = stations.filter(s => areas.includes(s.area));
    }
    
    if (status) {
      const statuses = (status as string).split(',') as Station['status'][];
      stations = stations.filter(s => statuses.includes(s.status));
    }
    
    if (minAvailable !== undefined) {
      stations = stations.filter(s => s.availableBikes >= Number(minAvailable));
    }
    
    if (maxAvailable !== undefined) {
      stations = stations.filter(s => s.availableBikes <= Number(maxAvailable));
    }

    const response: ApiResponse<Station[]> = {
      code: 0,
      message: 'success',
      data: stations,
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

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const station = mockStations.find(s => s.id === id);
    
    if (!station) {
      return res.status(404).json({
        code: 404,
        message: '站点不存在',
        data: null,
      });
    }

    const trend: StationTrend[] = generateStationTrend(id);

    const response: ApiResponse<any> = {
      code: 0,
      message: 'success',
      data: {
        station,
        trend,
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
