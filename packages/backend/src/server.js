require('dotenv').config();
const express = require('express');
const cors = require('cors');

const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI;

let initMemoryDB, connectDB, connectRedis;

if (USE_MEMORY_DB) {
  ({ initMemoryDB } = require('./utils/memoryDB'));
} else {
  connectDB = require('./config/database');
  ({ connectRedis } = require('./config/redis'));
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '宠物寄养后台系统运行正常' });
});

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const visitRoutes = require('./routes/visitRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const statsRoutes = require('./routes/statsRoutes');
const exportRoutes = require('./routes/exportRoutes');
const flowRecordRoutes = require('./routes/flowRecordRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/flow-records', flowRecordRoutes);

app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    if (USE_MEMORY_DB) {
      console.log('Running in memory mode (no MongoDB required)');
      await initMemoryDB();
    } else {
      await connectDB();
      await connectRedis();
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API base: http://localhost:${PORT}/api`);
      if (USE_MEMORY_DB) {
        console.log('Memory mode: data will not persist between restarts');
        console.log('Test accounts: admin/123456, trainer1/123456, trainer2/123456, reviewer/123456');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
