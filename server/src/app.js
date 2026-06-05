require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const { initCronJobs } = require('./jobs/cronJobs');

const authRoutes = require('./routes/authRoutes');
const toolRoutes = require('./routes/toolRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/maintenances', maintenanceRoutes);
app.use('/api', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ alter: false });
    console.log('数据库模型同步完成');

    if (process.env.NODE_ENV !== 'test') {
      initCronJobs();
    }

    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
