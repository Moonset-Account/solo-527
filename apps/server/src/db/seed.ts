import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from './index';

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const adminId = uuidv4();
    const warehouseId = uuidv4();
    const volunteerId = uuidv4();
    
    await client.query(
      `INSERT INTO users (id, username, password_hash, real_name, phone, email, role)
       VALUES ($1, 'admin', $2, '系统管理员', '13800138000', 'admin@example.com', 'admin')`,
      [adminId, hashedPassword]
    );
    
    await client.query(
      `INSERT INTO users (id, username, password_hash, real_name, phone, email, role)
       VALUES ($1, 'warehouse', $2, '仓管小王', '13800138001', 'warehouse@example.com', 'warehouse_manager')`,
      [warehouseId, hashedPassword]
    );
    
    await client.query(
      `INSERT INTO users (id, username, password_hash, real_name, phone, email, role)
       VALUES ($1, 'volunteer', $2, '志愿者小李', '13800138002', 'volunteer@example.com', 'volunteer_leader')`,
      [volunteerId, hashedPassword]
    );
    
    const tableCategoryId = uuidv4();
    const tentCategoryId = uuidv4();
    const audioCategoryId = uuidv4();
    const boardCategoryId = uuidv4();
    
    await client.query(
      `INSERT INTO material_categories (id, name, description)
       VALUES 
        ($1, '桌椅', '活动用桌椅板凳'),
        ($2, '帐篷', '遮阳挡雨帐篷'),
        ($3, '音响', '音响设备'),
        ($4, '宣传板', '宣传展示板')`,
      [tableCategoryId, tentCategoryId, audioCategoryId, boardCategoryId]
    );
    
    const materials = [
      { categoryId: tableCategoryId, name: '折叠桌-A01', qrCode: 'TABLE-001', price: 200 },
      { categoryId: tableCategoryId, name: '折叠桌-A02', qrCode: 'TABLE-002', price: 200 },
      { categoryId: tableCategoryId, name: '折叠椅-B01', qrCode: 'CHAIR-001', price: 80 },
      { categoryId: tableCategoryId, name: '折叠椅-B02', qrCode: 'CHAIR-002', price: 80 },
      { categoryId: tableCategoryId, name: '折叠椅-B03', qrCode: 'CHAIR-003', price: 80 },
      { categoryId: tentCategoryId, name: '3x3帐篷-T01', qrCode: 'TENT-001', price: 500 },
      { categoryId: tentCategoryId, name: '3x3帐篷-T02', qrCode: 'TENT-002', price: 500 },
      { categoryId: audioCategoryId, name: '便携音箱-S01', qrCode: 'AUDIO-001', price: 800 },
      { categoryId: audioCategoryId, name: '无线麦克风-M01', qrCode: 'MIC-001', price: 300 },
      { categoryId: boardCategoryId, name: '宣传展架-P01', qrCode: 'BOARD-001', price: 150 },
      { categoryId: boardCategoryId, name: '宣传展架-P02', qrCode: 'BOARD-002', price: 150 },
    ];
    
    for (const mat of materials) {
      await client.query(
        `INSERT INTO materials (id, category_id, name, qr_code, condition, purchase_price, location)
         VALUES ($1, $2, $3, $4, 'good', $5, 'A区仓库')`,
        [uuidv4(), mat.categoryId, mat.name, mat.qrCode, mat.price]
      );
    }
    
    const activityId = uuidv4();
    const today = new Date();
    const activityDate = new Date(today);
    activityDate.setDate(today.getDate() + 7);
    
    await client.query(
      `INSERT INTO activities (id, title, description, activity_date, start_time, end_time, location, leader_id, status)
       VALUES ($1, '社区环保宣传活动', '向社区居民宣传环保知识，发放宣传资料', $2, '09:00', '17:00', '社区广场', $3, 'approved')`,
      [activityId, activityDate.toISOString().split('T')[0], volunteerId]
    );
    
    await client.query('COMMIT');
    
    console.log('种子数据创建成功！');
    console.log('默认账户:');
    console.log('  管理员: admin / password123');
    console.log('  仓管:   warehouse / password123');
    console.log('  志愿者: volunteer / password123');
    
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('种子数据创建失败:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
