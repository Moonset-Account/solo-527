import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'nestjs_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

async function runSeed() {
  console.log('开始执行数据库初始化...');

  try {
    await AppDataSource.initialize();
    console.log('数据库连接成功');

    const sqlPath = path.join(__dirname, 'init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('执行 SQL 脚本...');
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      await queryRunner.query(sqlContent);
      console.log('SQL 脚本执行成功');
      console.log('数据库初始化完成！');
    } catch (error) {
      console.error('执行 SQL 脚本时出错:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }

    console.log('数据统计:');
    const userCount = await AppDataSource.query('SELECT COUNT(*) FROM users');
    const propertyCount = await AppDataSource.query('SELECT COUNT(*) FROM properties');
    const leaseCount = await AppDataSource.query('SELECT COUNT(*) FROM leases');
    const billCount = await AppDataSource.query('SELECT COUNT(*) FROM bills');
    const depositCount = await AppDataSource.query('SELECT COUNT(*) FROM deposits');
    const pricingCount = await AppDataSource.query('SELECT COUNT(*) FROM pricing');
    const ticketCount = await AppDataSource.query('SELECT COUNT(*) FROM tickets');

    console.log(`- 用户: ${userCount[0].count} 条`);
    console.log(`- 房源: ${propertyCount[0].count} 条`);
    console.log(`- 租约: ${leaseCount[0].count} 条`);
    console.log(`- 账单: ${billCount[0].count} 条`);
    console.log(`- 押金: ${depositCount[0].count} 条`);
    console.log(`- 价格方案: ${pricingCount[0].count} 条`);
    console.log(`- 工单: ${ticketCount[0].count} 条`);

    console.log('\n测试账户:');
    console.log('- admin / 123456');
    console.log('- finance / 123456');
    console.log('- auditor / 123456');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

runSeed();
