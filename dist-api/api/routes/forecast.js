import { Router } from 'express';
import { getLastUpdateTime, getDataVersion, getEtlWarnings } from '../data/etl';
const router = Router();
router.get('/peak', (req, res) => {
    try {
        const { hours = 48 } = req.query;
        const now = Date.now();
        const points = [];
        const totalHours = Number(hours);
        for (let i = -24; i < totalHours; i++) {
            const time = now + i * 3600 * 1000;
            const hourOfDay = new Date(time).getHours();
            let baseValue = 100;
            if (hourOfDay >= 7 && hourOfDay <= 9)
                baseValue = 400;
            else if (hourOfDay >= 17 && hourOfDay <= 19)
                baseValue = 450;
            else if (hourOfDay >= 12 && hourOfDay <= 14)
                baseValue = 250;
            else if (hourOfDay >= 0 && hourOfDay <= 5)
                baseValue = 30;
            const noise = (Math.random() - 0.5) * 50;
            const value = Math.max(0, Math.round(baseValue + noise));
            const isActual = i <= 0;
            let anomaly;
            if (i === 12 && hourOfDay === 15) {
                anomaly = '预计有中雨，骑行量下降';
            }
            points.push({
                time,
                value: isActual ? value : Math.round(value * (1 + (Math.random() - 0.5) * 0.3)),
                lower: Math.round(value * 0.7),
                upper: Math.round(value * 1.3),
                isActual,
                anomaly,
            });
        }
        const response = {
            code: 0,
            message: 'success',
            data: points,
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
router.get('/weather', (req, res) => {
    try {
        const weatherImpacts = [
            { type: '晴', avgTrips: 320, impactFactor: 1.0 },
            { type: '多云', avgTrips: 280, impactFactor: 0.88 },
            { type: '阴', avgTrips: 240, impactFactor: 0.75 },
            { type: '小雨', avgTrips: 150, impactFactor: 0.47 },
            { type: '中雨', avgTrips: 80, impactFactor: 0.25 },
            { type: '大雪', avgTrips: 30, impactFactor: 0.09 },
        ];
        const response = {
            code: 0,
            message: 'success',
            data: weatherImpacts,
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
