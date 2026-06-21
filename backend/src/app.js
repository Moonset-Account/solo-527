require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const treatmentRoutes = require('./routes/treatments');
const memberTreatmentRoutes = require('./routes/memberTreatments');
const appointmentRoutes = require('./routes/appointments');
const operationLogRoutes = require('./routes/operationLogs');
const batchImportRoutes = require('./routes/batchImports');
const portfolioRoutes = require('./routes/portfolio');
const reminderRuleRoutes = require('./routes/reminderRules');
const reminderRoutes = require('./routes/reminders');
const consultantRoutes = require('./routes/consultants');
const commissionRoutes = require('./routes/commissions');
const productRoutes = require('./routes/products');
const stockLogRoutes = require('./routes/stockLogs');
const damageReportRoutes = require('./routes/damageReports');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/member-treatments', memberTreatmentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reminder-rules', reminderRuleRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/consultants', consultantRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-logs', stockLogRoutes);
app.use('/api/damage-reports', damageReportRoutes);
app.use('/api/operation-logs', operationLogRoutes);
app.use('/api/batch-imports', batchImportRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
