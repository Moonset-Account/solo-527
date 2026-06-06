const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function seedData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('开始插入种子数据...');

    const passwordHash = await bcrypt.hash('123456', 10);

    await client.query(`
      INSERT INTO users (username, password_hash, real_name, role, department, phone, email, status) VALUES
      ('admin', $1, '系统管理员', 'admin', '信息科', '13800000000', 'admin@hospital.com', 'active'),
      ('headnurse', $1, '王护士长', 'head_nurse', '手术室', '13800000001', 'headnurse@hospital.com', 'active'),
      ('nurse1', $1, '李护士', 'nurse', '手术室', '13800000002', 'nurse1@hospital.com', 'active'),
      ('nurse2', $1, '张护士', 'nurse', '手术室', '13800000003', 'nurse2@hospital.com', 'active'),
      ('nurse3', $1, '刘护士', 'nurse', '手术室', '13800000004', 'nurse3@hospital.com', 'active'),
      ('equipment1', $1, '陈设备', 'equipment', '设备科', '13800000005', 'equipment@hospital.com', 'active')
    `, [passwordHash]);
    console.log('✅ 用户数据插入完成');

    await client.query(`
      INSERT INTO operating_rooms (room_code, room_name, floor, room_type, status, equipment) VALUES
      ('OR-001', '第一手术室', '3F', 'general', 'available', ARRAY['手术床', '无影灯', '麻醉机']),
      ('OR-002', '第二手术室', '3F', 'orthopedic', 'available', ARRAY['骨科手术床', 'C臂机', '无影灯']),
      ('OR-003', '第三手术室', '3F', 'cardiac', 'available', ARRAY['体外循环机', '心脏监护仪', '无影灯']),
      ('OR-004', '第四手术室', '3F', 'neuro', 'available', ARRAY['神经导航', '显微镜', '无影灯']),
      ('OR-005', '第五手术室', '3F', 'obstetric', 'available', ARRAY['产科手术床', '新生儿抢救台', '无影灯']),
      ('OR-006', '急诊手术室', '1F', 'emergency', 'available', ARRAY['急诊手术床', '快速消毒设备', '无影灯'])
    `);
    console.log('✅ 手术间数据插入完成');

    await client.query(`
      INSERT INTO supply_items (item_code, item_name, specification, unit, category, is_high_value, manufacturer, supplier, price, safety_stock, shelf_life_days, requires_scan) VALUES
      ('SUT-001', '可吸收缝合线', '4-0 12根/盒', '盒', 'suture', false, '某医用材料公司', '某医疗供应商', 156.00, 50, 1095, false),
      ('SUT-002', '不可吸收丝线', '3-0 12根/盒', '盒', 'suture', false, '某医用材料公司', '某医疗供应商', 89.00, 50, 1825, false),
      ('DRS-001', '无菌手术衣', '标准号 20件/箱', '件', 'dressing', false, '某医疗器械公司', '某医疗供应商', 35.00, 200, 730, false),
      ('DRS-002', '无菌手套', '7.5号 50副/盒', '副', 'dressing', false, '某医疗器械公司', '某医疗供应商', 12.50, 500, 1095, false),
      ('DRS-003', '手术洞巾', '标准尺寸 20片/包', '片', 'dressing', false, '某医疗器械公司', '某医疗供应商', 28.00, 100, 730, false),
      ('INS-001', '骨科钢板', '胫骨近端 L型', '块', 'implant', true, '某骨科器械公司', '某医疗供应商', 8500.00, 10, 1825, true),
      ('INS-002', '骨科螺钉', '直径4.5mm 长度60mm', '枚', 'implant', true, '某骨科器械公司', '某医疗供应商', 680.00, 50, 1825, true),
      ('INS-003', '人工髋关节', '标准型', '套', 'implant', true, '某骨科器械公司', '某医疗供应商', 28000.00, 5, 1825, true),
      ('DIS-001', '一次性注射器', '5ml 100支/盒', '支', 'disposable', false, '某医疗器械公司', '某医疗供应商', 2.50, 1000, 1095, false),
      ('DIS-002', '一次性输液器', '标准型 50套/盒', '套', 'disposable', false, '某医疗器械公司', '某医疗供应商', 8.00, 500, 1095, false),
      ('INS-004', '心脏支架', '药物洗脱支架 3.0*18mm', '个', 'implant', true, '某医疗器械公司', '某医疗供应商', 15600.00, 8, 1095, true),
      ('MED-001', '碘伏消毒液', '500ml/瓶', '瓶', 'medication', false, '某制药公司', '某医疗供应商', 25.00, 100, 730, false)
    `);
    console.log('✅ 耗材目录数据插入完成');

    await client.query(`
      INSERT INTO surgery_types (code, name, department, estimated_duration, is_high_risk, description) VALUES
      ('APP-001', '阑尾切除术', '普外科', 60, false, '急性阑尾炎常规手术'),
      ('CHO-001', '胆囊切除术', '普外科', 90, false, '腹腔镜胆囊切除'),
      ('ORT-001', '骨折切开复位内固定术', '骨科', 120, false, '四肢骨折内固定'),
      ('ORT-002', '人工髋关节置换术', '骨科', 180, true, '全髋关节置换手术'),
      ('CAR-001', '冠状动脉搭桥术', '心外科', 300, true, '心脏冠脉搭桥'),
      ('CAR-002', '心脏支架植入术', '心内科', 90, true, '经皮冠状动脉介入'),
      ('NEU-001', '颅内血肿清除术', '神经外科', 150, true, '高血压脑出血手术'),
      ('OBS-001', '剖宫产术', '妇产科', 60, false, '子宫下段剖宫产'),
      ('EMG-001', '急诊剖腹探查术', '普外科', 120, true, '急腹症探查手术')
    `);
    console.log('✅ 术式数据插入完成');

    const surgeryTypesResult = await client.query('SELECT id, code FROM surgery_types');
    const surgeryTypes = surgeryTypesResult.rows.reduce((acc, row) => {
      acc[row.code] = row.id;
      return acc;
    }, {});

    await client.query(`
      INSERT INTO package_templates (template_code, template_name, surgery_type_id, description, created_by, is_active)
      SELECT 'PKG-APP-001', '阑尾切除术标准包', $1, '阑尾切除术常规耗材包', id, true
      FROM users WHERE username = 'headnurse'
    `, [surgeryTypes['APP-001']]);

    await client.query(`
      INSERT INTO package_templates (template_code, template_name, surgery_type_id, description, created_by, is_active)
      SELECT 'PKG-ORT-001', '骨折内固定标准包', $1, '骨折切开复位内固定术耗材包', id, true
      FROM users WHERE username = 'headnurse'
    `, [surgeryTypes['ORT-001']]);

    await client.query(`
      INSERT INTO package_templates (template_code, template_name, surgery_type_id, description, created_by, is_active)
      SELECT 'PKG-ORT-002', '髋关节置换标准包', $1, '人工髋关节置换术耗材包', id, true
      FROM users WHERE username = 'headnurse'
    `, [surgeryTypes['ORT-002']]);

    await client.query(`
      INSERT INTO package_templates (template_code, template_name, surgery_type_id, description, created_by, is_active)
      SELECT 'PKG-CAR-002', '心脏支架手术包', $1, '心脏支架植入术专用耗材包', id, true
      FROM users WHERE username = 'headnurse'
    `, [surgeryTypes['CAR-002']]);

    console.log('✅ 耗材包模板数据插入完成');

    const templatesResult = await client.query('SELECT id, template_code FROM package_templates');
    const templates = templatesResult.rows.reduce((acc, row) => {
      acc[row.template_code] = row.id;
      return acc;
    }, {});

    const suppliesResult = await client.query('SELECT id, item_code FROM supply_items');
    const supplies = suppliesResult.rows.reduce((acc, row) => {
      acc[row.item_code] = row.id;
      return acc;
    }, {});

    await client.query(`
      INSERT INTO package_template_items (template_id, supply_item_id, quantity, is_required, sort_order) VALUES
      ($1, $2, 2, true, 1),
      ($1, $3, 10, true, 2),
      ($1, $4, 2, true, 3),
      ($1, $5, 1, true, 4),
      ($1, $6, 3, true, 5),
      ($1, $7, 2, true, 6)
    `, [templates['PKG-APP-001'], supplies['SUT-001'], supplies['DRS-001'], supplies['DRS-002'], supplies['DRS-003'], supplies['DIS-001'], supplies['MED-001']]);

    await client.query(`
      INSERT INTO package_template_items (template_id, supply_item_id, quantity, is_required, sort_order) VALUES
      ($1, $2, 3, true, 1),
      ($1, $3, 1, true, 2),
      ($1, $4, 10, true, 3),
      ($1, $5, 2, true, 4),
      ($1, $6, 1, true, 5),
      ($1, $7, 2, true, 6)
    `, [templates['PKG-ORT-001'], supplies['SUT-001'], supplies['INS-001'], supplies['DRS-001'], supplies['DRS-002'], supplies['INS-002'], supplies['MED-001']]);

    await client.query(`
      INSERT INTO package_template_items (template_id, supply_item_id, quantity, is_required, sort_order) VALUES
      ($1, $2, 1, true, 1),
      ($1, $3, 15, true, 2),
      ($1, $4, 2, true, 3),
      ($1, $5, 1, true, 4),
      ($1, $6, 2, true, 5)
    `, [templates['PKG-ORT-002'], supplies['INS-003'], supplies['DRS-001'], supplies['DRS-002'], supplies['SUT-001'], supplies['MED-001']]);

    await client.query(`
      INSERT INTO package_template_items (template_id, supply_item_id, quantity, is_required, sort_order) VALUES
      ($1, $2, 1, true, 1),
      ($1, $3, 10, true, 2),
      ($1, $4, 2, true, 3),
      ($1, $5, 2, true, 4),
      ($1, $6, 1, true, 5)
    `, [templates['PKG-CAR-002'], supplies['INS-004'], supplies['DRS-001'], supplies['DRS-002'], supplies['DIS-002'], supplies['MED-001']]);

    console.log('✅ 耗材包模板明细插入完成');

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const nearExpiry = new Date(today);
    nearExpiry.setMonth(nearExpiry.getMonth() + 1);

    await client.query(`
      INSERT INTO supply_batches (batch_no, supply_item_id, quantity, unit_price, manufacture_date, expiry_date, received_date, supplier, certificate_no, location, status) VALUES
      ('B20240001', $1, 80, 156.00, '2024-01-15', $2, '2024-02-01', '某医疗供应商', 'CER-2024-001', 'A区-01-01', 'normal'),
      ('B20240002', $3, 120, 89.00, '2024-01-20', $2, '2024-02-05', '某医疗供应商', 'CER-2024-002', 'A区-01-02', 'normal'),
      ('B20240003', $4, 300, 35.00, '2024-02-01', $2, '2024-02-15', '某医疗供应商', 'CER-2024-003', 'B区-01-01', 'normal'),
      ('B20240004', $5, 800, 12.50, '2024-02-05', $2, '2024-02-20', '某医疗供应商', 'CER-2024-004', 'B区-01-02', 'normal'),
      ('B20240005', $6, 150, 28.00, '2024-02-10', $2, '2024-02-25', '某医疗供应商', 'CER-2024-005', 'B区-01-03', 'normal'),
      ('B20240006', $7, 20, 8500.00, '2023-12-01', $2, '2024-01-10', '某医疗供应商', 'CER-2024-006', 'C区-高值-01', 'normal'),
      ('B20240007', $8, 80, 680.00, '2023-12-15', $2, '2024-01-15', '某医疗供应商', 'CER-2024-007', 'C区-高值-02', 'normal'),
      ('B20240008', $9, 8, 28000.00, '2023-11-01', $2, '2023-12-01', '某医疗供应商', 'CER-2024-008', 'C区-高值-03', 'normal'),
      ('B20240009', $10, 1500, 2.50, '2024-01-01', $2, '2024-01-20', '某医疗供应商', 'CER-2024-009', 'D区-01-01', 'normal'),
      ('B2024010', $11, 600, 8.00, '2024-01-10', $2, '2024-02-01', '某医疗供应商', 'CER-2024-010', 'D区-01-02', 'normal'),
      ('B2024011', $12, 15, 15600.00, '2023-10-01', $2, '2023-11-15', '某医疗供应商', 'CER-2024-011', 'C区-高值-04', 'normal'),
      ('B2024012', $13, 120, 25.00, '2024-02-01', $2, '2024-02-20', '某医疗供应商', 'CER-2024-012', 'E区-01-01', 'normal'),
      ('B2023099', $4, 20, 35.00, '2022-12-01', $14, '2023-01-15', '某医疗供应商', 'CER-2023-099', 'B区-01-01', 'expired')
    `, [
      supplies['SUT-001'], futureDate.toISOString().split('T')[0],
      supplies['SUT-002'], futureDate.toISOString().split('T')[0],
      supplies['DRS-001'], futureDate.toISOString().split('T')[0],
      supplies['DRS-002'], futureDate.toISOString().split('T')[0],
      supplies['DRS-003'], futureDate.toISOString().split('T')[0],
      supplies['INS-001'], futureDate.toISOString().split('T')[0],
      supplies['INS-002'], futureDate.toISOString().split('T')[0],
      supplies['INS-003'], futureDate.toISOString().split('T')[0],
      supplies['DIS-001'], futureDate.toISOString().split('T')[0],
      supplies['DIS-002'], futureDate.toISOString().split('T')[0],
      supplies['INS-004'], futureDate.toISOString().split('T')[0],
      supplies['MED-001'], futureDate.toISOString().split('T')[0],
      supplies['DRS-001'], nearExpiry.toISOString().split('T')[0]
    ]);

    console.log('✅ 批次数据插入完成');

    await client.query('COMMIT');
    console.log('🎉 所有种子数据插入完成');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 种子数据插入失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedData().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedData;
