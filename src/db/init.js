const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'postgres',
});

async function initDatabase() {
  try {
    console.log('正在创建数据库...');
    
    await pool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${process.env.DB_NAME}'
      AND pid <> pg_backend_pid();
    `);
    
    await pool.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    
    console.log(`数据库 ${process.env.DB_NAME} 创建成功`);
    await pool.end();

    const appPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('正在执行 schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    await appPool.query(schemaSQL);
    
    console.log('数据库表结构创建完成');
    await appPool.end();
    
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

if (require.main === module) {
  initDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = initDatabase;
