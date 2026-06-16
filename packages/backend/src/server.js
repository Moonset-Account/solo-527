require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');

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

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '宠物寄养后台系统运行正常' });
});

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
    await connectDB();
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
