import { Router } from 'express';
import { mockDispatches, mockStations } from '../data/mockData';
import { getLastUpdateTime, getDataVersion, getEtlWarnings } from '../data/etl';
const router = Router();
router.get('/records', (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        let records = [...mockDispatches];
        if (status) {
            const statuses = status.split(',');
            records = records.filter(r => statuses.includes(r.status));
        }
        records.sort((a, b) => b.createTime - a.createTime);
        const paginated = records.slice(Number(offset), Number(offset) + Number(limit));
        const stationNameMap = new Map(mockStations.map(s => [s.id, s.name]));
        const enriched = paginated.map(r => ({
            ...r,
            fromStationName: stationNameMap.get(r.fromStationId) || r.fromStationId,
            toStationName: stationNameMap.get(r.toStationId) || r.toStationId,
        }));
        const response = {
            code: 0,
            message: 'success',
            data: {
                records: enriched,
                total: records.length,
            },
            etlInfo: {
                updateTime: getLastUpdateTime(),
                dataVersion: getDataVersion(),
                warnings: getEtlWarnings(),
            },
        };
        res.json(response);
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message,
            data: null,
        });
    }
});
router.get('/effect', (req, res) => {
    try {
        const completedDispatches = mockDispatches.filter(d => d.status === 'completed');
        const effectData = completedDispatches.map(d => ({
            dispatchId: d.id,
            bikeCount: d.bikeCount,
            effectScore: d.effectScore || 0,
            executeTime: d.executeTime,
            beforeGap: Math.floor(Math.random() * 20) - 10,
            afterGap: Math.floor(Math.random() * 10),
            roi: Math.round((Math.random() * 2 + 0.5) * 100) / 100,
        })).sort((a, b) => b.executeTime - a.executeTime);
        const response = {
            code: 0,
            message: 'success',
            data: effectData,
            etlInfo: {
                updateTime: getLastUpdateTime(),
                dataVersion: getDataVersion(),
                warnings: getEtlWarnings(),
            },
        };
        res.json(response);
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message,
            data: null,
        });
    }
});
export default router;
