import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { config } from './config';
import { initDatabase } from './database/db';
import { routes } from './routes';
import { ReservationService } from './services/reservation.service';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const fastify = Fastify({
  logger: true,
  bodyLimit: 10 * 1024 * 1024
});

fastify.register(cors, {
  origin: true,
  credentials: true
});

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

fastify.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
});

fastify.register(routes);

async function start() {
  try {
    await initDatabase();
    
    await fastify.listen({
      port: config.port,
      host: '0.0.0.0'
    });

    console.log(`🚀 服务器启动成功: http://localhost:${config.port}`);

    cron.schedule('0 * * * *', async () => {
      console.log('⏰ 执行定时任务：检查雨天预约');
      try {
        const reservationService = new ReservationService();
        await reservationService.checkRainAndCancel();
      } catch (err) {
        console.error('定时任务执行失败:', err);
      }
    });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
