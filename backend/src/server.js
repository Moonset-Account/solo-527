const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3080;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 运动训练负荷可视化系统后端服务运行中`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`💡 API 文档: http://localhost:${PORT}/api`);
});
