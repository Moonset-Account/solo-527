import app from './app';
import { config } from './config';
import prisma from './lib/prisma';

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('数据库连接成功');

    const server = app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║  亲子训练营社群打卡台 - 后端服务启动成功                ║
╠═══════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${config.port}                        ║
║  API 前缀: http://localhost:${config.port}/api                    ║
║  环境:     ${config.nodeEnv}                                ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('服务已关闭');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('强制关闭超时，退出进程');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err);
    });
    process.on('unhandledRejection', (reason) => {
      console.error('未处理的Promise拒绝:', reason);
    });
  } catch (err) {
    console.error('服务启动失败:', err);
    process.exit(1);
  }
}

bootstrap();
