import app from './app.js';
import { initDatabase } from './db/index.js';

const PORT = process.env.PORT || 3001;

initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 API base: http://localhost:${PORT}/api`);
  console.log('');
  console.log('测试账号:');
  console.log('  管理员: admin / password123');
  console.log('  研究员1: researcher1 / password123 (机构: 市环境监测中心站)');
  console.log('  研究员2: researcher2 / password123 (机构: 水文水资源勘测局)');
  console.log('  研究员3: researcher3 / password123 (机构: 流域生态环境站)');
});
