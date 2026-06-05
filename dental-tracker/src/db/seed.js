const bcrypt = require('bcryptjs');
const { pool } = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      INSERT INTO roles (name, description) VALUES
        ('admin', '系统管理员'),
        ('infection_control', '院感负责人'),
        ('sterilization_nurse', '消毒护士'),
        ('department_nurse', '科室护士')
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO permissions (code, description) VALUES
        ('pack:create', '新建器械包'),
        ('pack:scan', '扫码回收'),
        ('pack:clean', '清洗登记'),
        ('pack:sterilize', '灭菌放行'),
        ('pack:dispatch', '科室领用'),
        ('pack:view', '查看器械包'),
        ('batch:create', '创建灭菌批次'),
        ('batch:view', '查看批次'),
        ('batch:recall', '异常召回'),
        ('batch:confirm', '确认批次'),
        ('autoclave:manage', '管理消毒锅'),
        ('department:manage', '管理科室'),
        ('operator:manage', '管理人员'),
        ('report:view', '查看报表'),
        ('notification:send', '发送通知'),
        ('recall:execute', '执行召回')
      ON CONFLICT (code) DO NOTHING
    `);

    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'admin'
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'infection_control'
        AND p.code IN ('pack:view','batch:view','batch:recall','batch:confirm','report:view','notification:send','recall:execute')
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'sterilization_nurse'
        AND p.code IN ('pack:create','pack:scan','pack:clean','pack:sterilize','pack:view','batch:create','batch:view','batch:confirm')
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'department_nurse'
        AND p.code IN ('pack:view','pack:dispatch','batch:view')
      ON CONFLICT DO NOTHING
    `);

    const adminHash = await bcrypt.hash('admin123', 10);
    const icHash = await bcrypt.hash('ic123', 10);
    const snHash = await bcrypt.hash('sn123', 10);
    const dnHash = await bcrypt.hash('dn123', 10);

    await client.query(`
      INSERT INTO operators (name, username, password_hash, role_id) VALUES
        ('系统管理员', 'admin', $1, (SELECT id FROM roles WHERE name='admin')),
        ('张院感', 'zhangyg', $2, (SELECT id FROM roles WHERE name='infection_control')),
        ('李消毒', 'lixd', $3, (SELECT id FROM roles WHERE name='sterilization_nurse')),
        ('王科室', 'wangks', $4, (SELECT id FROM roles WHERE name='department_nurse'))
      ON CONFLICT (username) DO NOTHING
    `, [adminHash, icHash, snHash, dnHash]);

    await client.query(`
      INSERT INTO departments (name, code) VALUES
        ('口腔内科', 'KQNK'),
        ('口腔外科', 'KQWK'),
        ('正畸科', 'ZJK'),
        ('修复科', 'XFK'),
        ('儿童口腔科', 'ETKQK')
      ON CONFLICT (code) DO NOTHING
    `);

    await client.query(`
      INSERT INTO autoclaves (name, code, model, max_capacity) VALUES
        ('A号灭菌器', 'AC-001', 'MJQ-A200', 20),
        ('B号灭菌器', 'AC-002', 'MJQ-A200', 20)
      ON CONFLICT (code) DO NOTHING
    `);

    const packData = [
      { code: 'PK-20240101-001', name: '拔牙器械包', category: '外科' },
      { code: 'PK-20240101-002', name: '补牙器械包', category: '内科' },
      { code: 'PK-20240101-003', name: '正畸器械包', category: '正畸' },
      { code: 'PK-20240101-004', name: '修复器械包', category: '修复' },
      { code: 'PK-20240101-005', name: '儿童口腔器械包', category: '儿童' },
      { code: 'PK-20240101-006', name: '根管治疗器械包', category: '内科' },
      { code: 'PK-20240101-007', name: '种植器械包', category: '外科' },
      { code: 'PK-20240101-008', name: '洁牙器械包', category: '内科' },
    ];

    for (const pk of packData) {
      await client.query(`
        INSERT INTO instrument_packs (code, name, category, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) DO NOTHING
      `, [pk.code, pk.name, pk.category, 'new']);
    }

    await client.query('COMMIT');
    console.log('种子数据已插入');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('种子数据插入失败:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
