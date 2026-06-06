import express from 'express';
import cors from 'cors';
import overviewRouter from './routes/overview';
import stationsRouter from './routes/stations';
import routesRouter from './routes/routes';
import dispatchRouter from './routes/dispatch';
import forecastRouter from './routes/forecast';
import etlRouter from './routes/etl';
const app = express();
const PORT = 3003;
app.use(cors());
app.use(express.json());
app.use('/api/overview', overviewRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/dispatch', dispatchRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/etl', etlRouter);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Bike Dispatch Dashboard API server running on port ${PORT}`);
});
