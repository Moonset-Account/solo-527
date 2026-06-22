import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import pluginRoutes from './routes/plugin.routes.js';
import applicationRoutes from './routes/application.routes.js';
import licenseRoutes from './routes/license.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import reportRoutes from './routes/report.routes.js';
import settlementRoutes from './routes/settlement.routes.js';
import trialRoutes from './routes/trial.routes.js';
import userRoutes from './routes/user.routes.js';
import { error } from './utils/response.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'running' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settlement', settlementRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json(error('接口不存在', 404));
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json(error('服务器内部错误', 500));
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});

export default app;
