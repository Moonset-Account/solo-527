import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getClient } from './connection.js';

async function seed() {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    console.log('Seeding regions...');
    const regionIds = {};
    const regions = [
      { name: '华东区' },
      { name: '华北区' },
      { name: '华南区' }
    ];
    
    for (const region of regions) {
      const result = await client.query(
        'INSERT INTO regions (id, name) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [uuidv4(), region.name]
      );
      regionIds[region.name] = result.rows[0].id;
    }
    
    console.log('Seeding stores...');
    const storeIds = {};
    const stores = [
      { name: '上海浦东店', store_code: 'SH001', address: '上海市浦东新区世纪大道100号', region: '华东区' },
      { name: '上海静安店', store_code: 'SH002', address: '上海市静安区南京西路200号', region: '华东区' },
      { name: '北京朝阳店', store_code: 'BJ001', address: '北京市朝阳区建国路88号', region: '华北区' },
      { name: '北京海淀店', store_code: 'BJ002', address: '北京市海淀区中关村大街1号', region: '华北区' },
      { name: '广州天河店', store_code: 'GZ001', address: '广州市天河区天河路385号', region: '华南区' },
      { name: '深圳南山店', store_code: 'SZ001', address: '深圳市南山区科技园路1号', region: '华南区' }
    ];
    
    for (const store of stores) {
      const result = await client.query(
        `INSERT INTO stores (id, name, store_code, address, region_id) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (store_code) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [uuidv4(), store.name, store.store_code, store.address, regionIds[store.region]]
      );
      storeIds[store.store_code] = result.rows[0].id;
    }
    
    console.log('Seeding users...');
    const passwordHash = await bcrypt.hash('123456', 10);
    const userIds = {};
    
    const users = [
      { username: 'supervisor1', full_name: '张督导', role: 'supervisor', phone: '13800138001', region: '华东区' },
      { username: 'supervisor2', full_name: '李督导', role: 'supervisor', phone: '13800138002', region: '华北区' },
      { username: 'manager_sh001', full_name: '王店长', role: 'store_manager', phone: '13900139001', store_code: 'SH001' },
      { username: 'manager_sh002', full_name: '赵店长', role: 'store_manager', phone: '13900139002', store_code: 'SH002' },
      { username: 'manager_bj001', full_name: '刘店长', role: 'store_manager', phone: '13900139003', store_code: 'BJ001' },
      { username: 'manager_bj002', full_name: '陈店长', role: 'store_manager', phone: '13900139004', store_code: 'BJ002' },
      { username: 'manager_gz001', full_name: '周店长', role: 'store_manager', phone: '13900139005', store_code: 'GZ001' },
      { username: 'manager_sz001', full_name: '吴店长', role: 'store_manager', phone: '13900139006', store_code: 'SZ001' },
      { username: 'regional_east', full_name: '钱区域', role: 'regional_manager', phone: '13700137001', region: '华东区' },
      { username: 'regional_north', full_name: '孙区域', role: 'regional_manager', phone: '13700137002', region: '华北区' },
      { username: 'regional_south', full_name: '郑区域', role: 'regional_manager', phone: '13700137003', region: '华南区' }
    ];
    
    for (const user of users) {
      const result = await client.query(
        `INSERT INTO users (id, username, password_hash, full_name, role, store_id, region_id, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [
          uuidv4(), user.username, passwordHash, user.full_name, user.role,
          user.store_code ? storeIds[user.store_code] : null,
          user.region ? regionIds[user.region] : null,
          user.phone
        ]
      );
      userIds[user.username] = result.rows[0].id;
    }
    
    console.log('Seeding issues with various statuses (including false positives, overdue, and review failures)...');
    
    const issueTemplates = [
      { category: 'shelf', title: '货架商品陈列不整齐', description: '零食区第三层货架商品摆放混乱，需要整理' },
      { category: 'shelf', title: '货架商品缺货', description: '饮料区货架大面积缺货，请及时补货' },
      { category: 'price_tag', title: '价签缺失', description: '部分商品缺少价格标签，顾客无法了解价格' },
      { category: 'price_tag', title: '价签与商品不对应', description: '部分价签摆放位置错误，与商品不匹配' },
      { category: 'fire_exit', title: '消防通道堵塞', description: '消防通道被货物和推车堵塞，存在安全隐患' },
      { category: 'fire_exit', title: '消防器材过期', description: '灭火器已过有效期，请及时更换' },
      { category: 'freezer_temp', title: '冷柜温度过高', description: '冷冻柜温度显示为-10°C，要求温度应低于-18°C', freezer_temperature: -10.0 },
      { category: 'freezer_temp', title: '冷藏柜温度异常', description: '冷藏柜温度显示为10°C，要求温度应在0-4°C之间', freezer_temperature: 10.0 },
      { category: 'cleanliness', title: '地面清洁不及时', description: '收银台附近地面有污渍，需要及时清理' },
      { category: 'cleanliness', title: '卫生间卫生较差', description: '卫生间地面湿滑，异味较重，需要加强清洁' },
      { category: 'other', title: '收银设备故障', description: '二号收银机扫描枪反应迟钝，影响收银效率' }
    ];
    
    const now = new Date();
    const issuesData = [];
    
    for (let i = 0; i < 30; i++) {
      const template = issueTemplates[i % issueTemplates.length];
      const storeCode = Object.keys(storeIds)[i % Object.keys(storeIds).length];
      const supervisorKey = i % 2 === 0 ? 'supervisor1' : 'supervisor2';
      
      let status, isOverdue = false, dueDate;
      
      if (i < 3) {
        status = 'false_positive';
      } else if (i < 8) {
        status = 'pending_rectify';
        if (i < 5) {
          isOverdue = true;
          dueDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        } else {
          dueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        }
      } else if (i < 12) {
        status = 'pending_confirm';
        dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      } else if (i < 15) {
        status = 'reviewed';
      } else {
        status = 'closed';
      }
      
      const issueId = uuidv4();
      const createdAt = new Date(now.getTime() - (i * 6) * 60 * 60 * 1000);
      
      const storeManagerKey = `manager_${storeCode.toLowerCase()}`;
      
      issuesData.push({
        id: issueId,
        index: i,
        store_id: storeIds[storeCode],
        category: template.category,
        title: template.title,
        description: template.description,
        status,
        created_by: userIds[supervisorKey],
        assigned_to: (status === 'pending_rectify' || status === 'reviewed' || status === 'closed') 
          ? userIds[storeManagerKey] 
          : null,
        due_date: dueDate,
        freezer_temperature: template.freezer_temperature || null,
        location: ['食品区', '日用品区', '收银区', '入口处', '仓库区'][i % 5],
        is_overdue: isOverdue,
        created_at: createdAt,
        updated_at: createdAt
      });
    }
    
    for (const issue of issuesData) {
      await client.query(
        `INSERT INTO issues (id, store_id, category, title, description, status, 
                            created_by, assigned_to, due_date, freezer_temperature, 
                            location, is_overdue, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          issue.id, issue.store_id, issue.category, issue.title, issue.description,
          issue.status, issue.created_by, issue.assigned_to, issue.due_date,
          issue.freezer_temperature, issue.location, issue.is_overdue,
          issue.created_at, issue.updated_at
        ]
      );
      
      if (issue.status === 'false_positive') {
        await client.query(
          `INSERT INTO issue_logs (id, issue_id, action, from_status, to_status, comment, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [uuidv4(), issue.id, 'status_change', 'pending_confirm', 'false_positive', 
           '经核实为误报，问题不存在', issue.created_by]
        );
      } else if (issue.status === 'reviewed') {
        await client.query(
          `INSERT INTO issue_logs (id, issue_id, action, from_status, to_status, comment, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [uuidv4(), issue.id, 'status_change', 'pending_rectify', 'reviewed', 
           '已完成整改，申请复查', issue.assigned_to]
        );
      } else if (issue.status === 'closed') {
        if (issue.index % 3 === 0) {
          await client.query(
            `INSERT INTO issue_logs (id, issue_id, action, from_status, to_status, review_failure_reason, comment, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [uuidv4(), issue.id, 'status_change', 'reviewed', 'pending_rectify', 
             '整改不彻底，商品仍摆放不整齐', '复查不通过，需重新整改', issue.created_by]
          );
          await client.query(
            `INSERT INTO issue_logs (id, issue_id, action, from_status, to_status, comment, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [uuidv4(), issue.id, 'status_change', 'pending_rectify', 'reviewed', 
             '已重新整改完成', issue.assigned_to]
          );
        }
        await client.query(
          `INSERT INTO issue_logs (id, issue_id, action, from_status, to_status, comment, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [uuidv4(), issue.id, 'status_change', 'reviewed', 'closed', 
           '复查通过，问题已解决', issue.created_by]
        );
      }
    }
    
    console.log('Seeding photos...');
    for (let i = 0; i < 40; i++) {
      const issue = issuesData[i % issuesData.length];
      const photoType = i < 25 ? 'original' : 'rectification';
      
      await client.query(
        `INSERT INTO photos (id, issue_id, file_path, file_name, file_size, mime_type, photo_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(), issue.id,
          `/uploads/placeholder_${i + 1}.jpg`,
          `photo_${i + 1}.jpg`,
          102400 + Math.floor(Math.random() * 500000),
          'image/jpeg',
          photoType,
          photoType === 'rectification' ? issue.assigned_to : issue.created_by
        ]
      );
    }
    
    await client.query('COMMIT');
    
    const falsePositives = issuesData.filter(i => i.status === 'false_positive').length;
    const overdue = issuesData.filter(i => i.is_overdue).length;
    const reviewFailures = issuesData.filter(i => i.status === 'closed' && i.index % 3 === 0).length;
    
    console.log('Seed data completed successfully!');
    console.log(`  - 问题总数: ${issuesData.length}`);
    console.log(`  - 误报问题: ${falsePositives} 条`);
    console.log(`  - 逾期问题: ${overdue} 条`);
    console.log(`  - 复查失败问题: ${reviewFailures} 条`);
    console.log('\nDemo accounts:');
    console.log('  督导: supervisor1 / 123456');
    console.log('  店长: manager_sh001 / 123456');
    console.log('  区域经理: regional_east / 123456');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

seed().then(() => process.exit(0)).catch(() => process.exit(1));
