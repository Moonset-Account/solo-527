import app from './app.js';
import { initDatabase } from './db/index.js';

const PORT = process.env.PORT || 3001;

async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log(`🚀 河流水质监测系统 API 服务器启动成功`);
    console.log(`📊 API 地址: http://localhost:${PORT}/api`);
    console.log(`💾 数据库: ${process.env.USE_POSTGRES === 'true' ? 'PostgreSQL/PostGIS' : '内存数据库'}`);
    console.log('');
    console.log('测试账号（密码均为 password123）:');
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  admin        - 管理员 (查看全部数据 + 数据管理)        │');
    console.log('  │  researcher1  - 研究员 (市环境监测中心站)               │');
    console.log('  │  researcher2  - 研究员 (水文水资源勘测局)               │');
    console.log('  │  researcher3  - 研究员 (流域生态环境站)                 │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('启用 PostgreSQL/PostGIS:');
    console.log('  USE_POSTGRES=true DATABASE_URL=postgresql://user:pass@localhost:5432/water_quality npm run server:dev');
    console.log('');
  });
}

start().catch(console.error);
