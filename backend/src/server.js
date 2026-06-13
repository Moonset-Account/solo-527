import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import billRoutes from './routes/bills.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';
import transactionRoutes from './routes/transactions.js';
import collectionRoutes from './routes/collections.js';
import refundRoutes from './routes/refunds.js';
import writeOffRoutes from './routes/writeoffs.js';
import statisticsRoutes from './routes/statistics.js';
import customerRoutes from './routes/customers.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '账单对账中心 API 运行正常' });
});

app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/writeoffs', writeOffRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/customers', customerRoutes);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app;
