import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectMongoDB } from './config/mongodb.js';
import { getRedisClient, NOTIFICATION_CHANNELS } from './config/redis.js';

import { attachmentRouter } from './routes/attachments.js';
import { purchaseRequestRouter } from './routes/purchaseRequests.js';
import { quoteRouter } from './routes/quotes.js';
import { supplierRouter } from './routes/suppliers.js';
import { agreementRouter } from './routes/agreements.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      version: '1.0.0'
    }
  });
});

app.get('/api/dashboard/summary', async (req: Request, res: Response) => {
  try {
    const { PurchaseRequestModel } = await import('./models/PurchaseRequest.js');
    const { QuoteModel } = await import('./models/Quote.js');
    const { SupplierModel } = await import('./models/Supplier.js');
    const { QualificationAlertModel } = await import('./models/QualificationAlert.js');

    const [prCount, quoteCount, supplierCount, pendingAlerts] = await Promise.all([
      PurchaseRequestModel.countDocuments(),
      QuoteModel.countDocuments(),
      SupplierModel.countDocuments(),
      QualificationAlertModel.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        purchaseRequests: prCount,
        quotes: quoteCount,
        suppliers: supplierCount,
        pendingAlerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    });
  }
});

app.use('/api/attachments', attachmentRouter);
app.use('/api/purchase-requests', purchaseRequestRouter);
app.use('/api/quotes', quoteRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/agreements', agreementRouter);

import mongoose from 'mongoose';

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('❌ Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
});

async function startServer() {
  try {
    console.log('\n🚀 Starting Procurement Platform API Server...\n');

    await connectMongoDB();

    try {
      const redis = getRedisClient();
      await redis.ping();
      console.log('✅ Redis connection verified');
    } catch (redisErr) {
      console.warn('⚠️  Redis not available, caching disabled');
    }

    app.listen(PORT, () => {
      console.log(`\n✅ API Server running at: http://localhost:${PORT}`);
      console.log(`   Health check:  http://localhost:${PORT}/api/health\n`);
      console.log('📋 Available routes:');
      console.log('   POST   /api/attachments/upload');
      console.log('   CRUD   /api/purchase-requests');
      console.log('   CRUD   /api/quotes (+ /compare/:prId, /fluctuations)');
      console.log('   CRUD   /api/suppliers (+ qualifications, approval-board)');
      console.log('   CRUD   /api/agreements (+ /diff/:entityType/:entityId)');
      console.log('   GET    /api/dashboard/summary\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
