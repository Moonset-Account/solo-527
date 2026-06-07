import { PrismaClient } from '@prisma/client';
import { EtlPipeline } from './api/lib/etl';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('测试数据质量接口...');
    const status = await EtlPipeline.getDataQualityStatus();
    console.log('✅ 成功!');
    console.log(JSON.stringify(status, null, 2));
  } catch (e) {
    console.error('❌ 失败:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
