import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import propertyRoutes from './routes/properties.js';
import tenantRoutes from './routes/tenants.js';
import consultantRoutes from './routes/consultants.js';
import viewingRoutes from './routes/viewings.js';
import contractRoutes from './routes/contracts.js';
import billRoutes from './routes/bills.js';
import todoRoutes from './routes/todos.js';
import changeLogRoutes from './routes/changeLogs.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3099;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/consultants', consultantRoutes);
app.use('/api/viewings', viewingRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/change-logs', changeLogRoutes);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
