const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/stores', require('./routes/stores'));
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/safety-stock', require('./routes/safetyStock'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/loss-reasons', require('./routes/lossReasons'));
app.use('/api/loss-reports', require('./routes/lossReports'));
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/cashflow', require('./routes/cashFlow'));
app.use('/api/export', require('./routes/export'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '烘焙门店库存损耗管理系统 API 运行正常' });
});

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const { storeId } = req.query;
    const where = storeId ? { storeId: parseInt(storeId) } : {};

    const [totalBatches, totalLossReports, pendingApprovals, lowStockCount, totalStores] = await Promise.all([
      prisma.bakingBatch.count({ where }),
      prisma.lossReport.count({ where }),
      prisma.lossReport.count({ where: { ...where, approvalStatus: 'PENDING' } }),
      prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM Inventory i 
        JOIN SafetyStock s ON i.storeId = s.storeId AND i.ingredientId = s.ingredientId
        WHERE i.quantity < s.minQuantity
      `,
      prisma.store.count(),
    ]);

    res.json({
      totalBatches,
      totalLossReports,
      pendingApprovals,
      lowStockCount: lowStockCount[0]?.count || 0,
      totalStores,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取仪表盘数据失败' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = { prisma, app };
