import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './config/redis.js';
import { connectDB } from './config/mongodb.js';

import materialRoutes from './routes/materials.js';
import scheduleRoutes from './routes/schedules.js';
import articleRoutes from './routes/articles.js';
import exceptionRoutes from './routes/exceptions.js';
import auditRoutes from './routes/audit.js';
import dictionaryRoutes from './routes/dictionaries.js';
import authRoutes from './routes/auth.js';
import statsRoutes from './routes/stats.js';

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8002'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

await redisClient.connect().catch(console.error);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dictionaries', dictionaryRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '选题协作台 API 服务正常' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  });
});
