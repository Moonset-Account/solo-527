import fs from 'fs';
import path from 'path';
import pool from './index';

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('正在执行数据库迁移...');
    await pool.query(schema);
    console.log('数据库迁移完成！');
    
    process.exit(0);
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();
