import { Router } from 'express';
import { getEtlStatuses, getMetricConfig, updateMetricConfig, runETL, getEtlWarnings, getLastUpdateTime, getDataVersion } from '../data/etl';
import { mockStations, mockTrips } from '../data/mockData';
import ExcelJS from 'exceljs';
const router = Router();
router.get('/status', async (req, res) => {
    try {
        const statuses = getEtlStatuses();
        const response = {
            code: 0,
            message: 'success',
            data: statuses,
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
router.post('/run', async (req, res) => {
    try {
        const statuses = await runETL();
        const response = {
            code: 0,
            message: 'ETL执行成功',
            data: statuses,
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
router.get('/metrics', (req, res) => {
    try {
        const config = getMetricConfig();
        const response = {
            code: 0,
            message: 'success',
            data: config,
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
router.put('/metrics', (req, res) => {
    try {
        const config = updateMetricConfig(req.body);
        const response = {
            code: 0,
            message: '配置更新成功',
            data: config,
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
let savedFilters = [
    {
        id: 'f1',
        name: '早高峰默认视图',
        timeRange: [Date.now() - 7 * 24 * 3600 * 1000, Date.now()],
        areas: ['朝阳区', '海淀区'],
        stationIds: [],
        bikeStatus: ['available'],
        weatherTypes: ['晴', '多云'],
    },
];
router.get('/filters', (req, res) => {
    const response = {
        code: 0,
        message: 'success',
        data: savedFilters,
    };
    res.json(response);
});
router.post('/filters', (req, res) => {
    const filter = {
        ...req.body,
        id: 'f' + Date.now(),
    };
    savedFilters.push(filter);
    const response = {
        code: 0,
        message: '筛选组合已保存',
        data: filter,
    };
    res.json(response);
});
let exportTasks = [];
router.get('/export/tasks', (req, res) => {
    const response = {
        code: 0,
        message: 'success',
        data: exportTasks.sort((a, b) => b.createdAt - a.createdAt),
    };
    res.json(response);
});
router.post('/export/tasks', async (req, res) => {
    const { name, type = 'trips' } = req.body;
    const taskId = 'exp' + Date.now();
    const task = {
        id: taskId,
        name: name || `${type}_导出_${new Date().toLocaleDateString()}`,
        status: 'processing',
        progress: 0,
        createdAt: Date.now(),
    };
    exportTasks.push(task);
    setTimeout(async () => {
        const taskIndex = exportTasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
            try {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('数据导出');
                if (type === 'trips') {
                    worksheet.columns = [
                        { header: '行程ID', key: 'id', width: 15 },
                        { header: '开始时间', key: 'startTime', width: 20 },
                        { header: '起点站', key: 'startStationId', width: 15 },
                        { header: '终点站', key: 'endStationId', width: 15 },
                        { header: '车辆ID', key: 'bikeId', width: 15 },
                        { header: '时长(秒)', key: 'duration', width: 12 },
                        { header: '天气', key: 'weather', width: 10 },
                    ];
                    mockTrips.slice(0, 1000).forEach(trip => {
                        worksheet.addRow({
                            ...trip,
                            startTime: new Date(trip.startTime).toLocaleString(),
                        });
                    });
                }
                else {
                    worksheet.columns = [
                        { header: '站点ID', key: 'id', width: 15 },
                        { header: '站点名称', key: 'name', width: 25 },
                        { header: '区域', key: 'area', width: 12 },
                        { header: '容量', key: 'capacity', width: 10 },
                        { header: '可用车辆', key: 'availableBikes', width: 12 },
                        { header: '维修中', key: 'maintenanceBikes', width: 12 },
                        { header: '状态', key: 'status', width: 12 },
                    ];
                    mockStations.forEach(station => {
                        worksheet.addRow(station);
                    });
                }
                const buffer = await workbook.xlsx.writeBuffer();
                exportTasks[taskIndex] = {
                    ...task,
                    status: 'completed',
                    progress: 100,
                    downloadUrl: `/api/export/download/${taskId}`,
                };
            }
            catch (e) {
                exportTasks[taskIndex] = {
                    ...task,
                    status: 'failed',
                    progress: 100,
                };
            }
        }
    }, 2000);
    const response = {
        code: 0,
        message: '导出任务已创建',
        data: task,
    };
    res.json(response);
});
export default router;
