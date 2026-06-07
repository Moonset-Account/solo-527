import { getDb, runExec, runQuery } from './db.js';

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS car_models (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  brand VARCHAR NOT NULL,
  category VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  city VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS salespeople (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  store_id VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  phone_hash VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  model_id VARCHAR NOT NULL,
  original_model_id VARCHAR NOT NULL,
  sales_id VARCHAR NOT NULL,
  store_id VARCHAR NOT NULL,
  source VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  appointment_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  is_visited BOOLEAN DEFAULT FALSE,
  cancellation_reason VARCHAR,
  no_show_reason VARCHAR,
  conversion_type VARCHAR,
  is_vehicle_swapped BOOLEAN DEFAULT FALSE,
  is_duplicate_customer BOOLEAN DEFAULT FALSE,
  remark VARCHAR DEFAULT ''
);

DELETE FROM appointments;
DELETE FROM customers;
DELETE FROM salespeople;
DELETE FROM stores;
DELETE FROM car_models;
`;

const SEED_MODELS = `
INSERT INTO car_models VALUES ('M001', 'Model 3', 'Tesla', '轿车');
INSERT INTO car_models VALUES ('M002', 'Model Y', 'Tesla', 'SUV');
INSERT INTO car_models VALUES ('M003', '汉EV', '比亚迪', '轿车');
INSERT INTO car_models VALUES ('M004', '海豹', '比亚迪', '轿车');
INSERT INTO car_models VALUES ('M005', '宋PLUS EV', '比亚迪', 'SUV');
INSERT INTO car_models VALUES ('M006', 'ES6', '蔚来', 'SUV');
INSERT INTO car_models VALUES ('M007', 'ET5', '蔚来', '轿车');
INSERT INTO car_models VALUES ('M008', 'P7', '小鹏', '轿车');
INSERT INTO car_models VALUES ('M009', 'G6', '小鹏', 'SUV');
INSERT INTO car_models VALUES ('M010', '极氪001', '极氪', '轿车');
INSERT INTO car_models VALUES ('M011', '极氪007', '极氪', '轿车');
INSERT INTO car_models VALUES ('M012', '问界M5', 'AITO', 'SUV');
`;

const SEED_STORES = `
INSERT INTO stores VALUES ('S001', '朝阳体验中心', '北京');
INSERT INTO stores VALUES ('S002', '海淀展厅', '北京');
INSERT INTO stores VALUES ('S003', '浦东旗舰店', '上海');
INSERT INTO stores VALUES ('S004', '闵行交付中心', '上海');
INSERT INTO stores VALUES ('S005', '天河体验店', '广州');
INSERT INTO stores VALUES ('S006', '南山科技园店', '深圳');
`;

const SEED_SALES = `
INSERT INTO salespeople VALUES ('SA001', '张伟', 'S001');
INSERT INTO salespeople VALUES ('SA002', '李娜', 'S001');
INSERT INTO salespeople VALUES ('SA003', '王磊', 'S002');
INSERT INTO salespeople VALUES ('SA004', '刘洋', 'S002');
INSERT INTO salespeople VALUES ('SA005', '陈静', 'S003');
INSERT INTO salespeople VALUES ('SA006', '赵强', 'S003');
INSERT INTO salespeople VALUES ('SA007', '孙丽', 'S004');
INSERT INTO salespeople VALUES ('SA008', '周军', 'S005');
INSERT INTO salespeople VALUES ('SA009', '吴敏', 'S006');
INSERT INTO salespeople VALUES ('SA010', '郑涛', 'S006');
`;

const SEED_CUSTOMERS = `
INSERT INTO customers VALUES ('C001', '张三', '13800001111', 'hash_13800001111');
INSERT INTO customers VALUES ('C002', '李四', '13800002222', 'hash_13800002222');
INSERT INTO customers VALUES ('C003', '王五', '13800003333', 'hash_13800003333');
INSERT INTO customers VALUES ('C004', '赵六', '13800004444', 'hash_13800004444');
INSERT INTO customers VALUES ('C005', '钱七', '13800005555', 'hash_13800005555');
INSERT INTO customers VALUES ('C006', '孙八', '13800006666', 'hash_13800006666');
INSERT INTO customers VALUES ('C007', '周九', '13800007777', 'hash_13800007777');
INSERT INTO customers VALUES ('C008', '吴十', '13800008888', 'hash_13800008888');
INSERT INTO customers VALUES ('C009', '郑十一', '13800009999', 'hash_13800009999');
INSERT INTO customers VALUES ('C010', '冯十二', '13800010000', 'hash_13800010000');
INSERT INTO customers VALUES ('C011', '陈十三', '13800011111', 'hash_13800011111');
INSERT INTO customers VALUES ('C012', '褚十四', '13800012222', 'hash_13800012222');
INSERT INTO customers VALUES ('C013', '卫十五', '13800013333', 'hash_13800013333');
INSERT INTO customers VALUES ('C014', '蒋十六', '13800014444', 'hash_13800014444');
INSERT INTO customers VALUES ('C015', '沈十七', '13800015555', 'hash_13800015555');
INSERT INTO customers VALUES ('C016', '韩十八', '13800016666', 'hash_13800016666');
INSERT INTO customers VALUES ('C017', '杨十九', '13800017777', 'hash_13800017777');
INSERT INTO customers VALUES ('C018', '朱二十', '13800018888', 'hash_13800018888');
INSERT INTO customers VALUES ('C019', '秦二一', '13800019999', 'hash_13800019999');
INSERT INTO customers VALUES ('C020', '尤二二', '13800020000', 'hash_13800020000');
INSERT INTO customers VALUES ('C021', '许二三', '13800021111', 'hash_13800021111');
INSERT INTO customers VALUES ('C022', '何二四', '13800022222', 'hash_13800022222');
INSERT INTO customers VALUES ('C023', '吕二五', '13800023333', 'hash_13800023333');
INSERT INTO customers VALUES ('C024', '施二六', '13800024444', 'hash_13800024444');
INSERT INTO customers VALUES ('C025', '张三丰', '13800001111', 'hash_13800001111');
INSERT INTO customers VALUES ('C026', '李四光', '13800002222', 'hash_13800002222');
`;

const APPOINTMENT_DATA: (string | null)[][] = [
  ['A001','C001','M001','M001','SA001','S001','线上官网','已完成','2025-06-01 10:00:00','2025-05-28 09:00:00','true',null,null,'到店成交','false','false',''],
  ['A002','C002','M002','M002','SA001','S001','APP','已完成','2025-06-01 14:00:00','2025-05-29 11:00:00','true',null,null,'后续成交','false','false',''],
  ['A003','C003','M003','M003','SA002','S001','小程序','已取消','2025-06-02 10:00:00','2025-05-30 08:00:00','false','车型缺货',null,null,'false','false','门店调车导致取消'],
  ['A004','C004','M006','M006','SA003','S002','到店咨询','已完成','2025-06-02 11:00:00','2025-05-30 10:00:00','true',null,null,'到店成交','false','false',''],
  ['A005','C005','M005','M005','SA003','S002','电话预约','爽约','2025-06-02 15:00:00','2025-05-30 14:00:00','false',null,'忘记预约',null,'false','false',''],
  ['A006','C006','M001','M001','SA004','S002','老客推荐','已确认','2025-06-03 10:00:00','2025-05-31 09:00:00','false',null,null,null,'false','false',''],
  ['A007','C007','M010','M010','SA005','S003','线上官网','已完成','2025-06-03 14:00:00','2025-05-31 10:00:00','true',null,null,'后续成交','false','false',''],
  ['A008','C008','M012','M012','SA005','S003','APP','已取消','2025-06-04 10:00:00','2025-06-01 08:00:00','false','竞品选择',null,null,'false','false',''],
  ['A009','C009','M004','M004','SA006','S003','小程序','已完成','2025-06-04 14:00:00','2025-06-01 11:00:00','true',null,null,'到店成交','false','false',''],
  ['A010','C010','M008','M008','SA006','S003','到店咨询','爽约','2025-06-04 16:00:00','2025-06-01 14:00:00','false',null,'临时有事',null,'false','false',''],
  ['A011','C011','M002','M002','SA007','S004','电话预约','已完成','2025-06-05 10:00:00','2025-06-02 09:00:00','true',null,null,'到店成交','false','false',''],
  ['A012','C012','M007','M007','SA007','S004','老客推荐','已取消','2025-06-05 14:00:00','2025-06-02 10:00:00','false','客户主动取消',null,null,'false','false',''],
  ['A013','C013','M003','M003','SA008','S005','线上官网','已完成','2025-06-05 11:00:00','2025-06-02 15:00:00','true',null,null,'后续成交','false','false',''],
  ['A014','C014','M011','M011','SA009','S006','APP','爽约','2025-06-06 10:00:00','2025-06-03 08:00:00','false',null,'竞品选择',null,'false','false',''],
  ['A015','C015','M009','M009','SA009','S006','小程序','已完成','2025-06-06 14:00:00','2025-06-03 10:00:00','true',null,null,'到店成交','false','false',''],
  ['A016','C016','M001','M001','SA010','S006','到店咨询','已确认','2025-06-07 10:00:00','2025-06-04 09:00:00','false',null,null,null,'false','false',''],
  ['A017','C017','M006','M006','SA001','S001','电话预约','已完成','2025-06-07 14:00:00','2025-06-04 11:00:00','true',null,null,'后续成交','false','false',''],
  ['A018','C018','M003','M003','SA002','S001','线上官网','已取消','2025-06-08 10:00:00','2025-06-05 08:00:00','false','车型缺货',null,null,'false','false','门店调车，Model3缺货'],
  ['A019','C019','M010','M010','SA003','S002','APP','已完成','2025-06-08 11:00:00','2025-06-05 09:00:00','true',null,null,'到店成交','false','false',''],
  ['A020','C020','M002','M002','SA004','S002','老客推荐','爽约','2025-06-08 15:00:00','2025-06-05 14:00:00','false',null,'交通不便',null,'false','false',''],
  ['A021','C025','M001','M001','SA001','S001','APP','已确认','2025-06-09 10:00:00','2025-06-06 08:00:00','false',null,null,null,'false','true','重复预约客户C001'],
  ['A022','C026','M002','M002','SA001','S001','小程序','待确认','2025-06-09 14:00:00','2025-06-06 10:00:00','false',null,null,null,'false','true','重复预约客户C002'],
  ['A023','C021','M005','M005','SA005','S003','线上官网','已完成','2025-06-09 11:00:00','2025-06-06 09:00:00','true',null,null,'到店成交','false','false',''],
  ['A024','C022','M012','M012','SA006','S003','电话预约','已取消','2025-06-10 10:00:00','2025-06-07 08:00:00','false','价格不满意',null,null,'false','false',''],
  ['A025','C023','M001','M002','SA001','S001','到店咨询','已完成','2025-06-10 14:00:00','2025-06-07 10:00:00','true',null,null,'到店成交','true','false','门店调车：原约Model3，改ModelY'],
  ['A026','C024','M003','M005','SA003','S002','APP','已完成','2025-06-10 16:00:00','2025-06-07 14:00:00','true',null,null,'后续成交','true','false','门店调车：原约汉EV，改宋PLUS EV'],
  ['A027','C001','M002','M002','SA001','S001','线上官网','已确认','2025-06-11 10:00:00','2025-06-08 08:00:00','false',null,null,null,'false','false','老客户再次预约'],
  ['A028','C002','M001','M001','SA002','S001','老客推荐','已完成','2025-06-11 14:00:00','2025-06-08 09:00:00','true',null,null,'到店成交','false','false',''],
  ['A029','C005','M010','M010','SA004','S002','小程序','已完成','2025-06-11 15:00:00','2025-06-08 10:00:00','true',null,null,'后续成交','false','false','爽约后重新预约'],
  ['A030','C010','M008','M008','SA006','S003','电话预约','已完成','2025-06-12 10:00:00','2025-06-09 08:00:00','true',null,null,'到店成交','false','false','爽约后重新预约'],
  ['A031','C014','M011','M011','SA009','S006','APP','爽约','2025-06-12 14:00:00','2025-06-09 10:00:00','false',null,'其他',null,'false','false',''],
  ['A032','C018','M005','M005','SA008','S005','线上官网','已完成','2025-06-12 16:00:00','2025-06-09 14:00:00','true',null,null,'到店成交','false','false','取消后重新预约'],
  ['A033','C004','M006','M006','SA005','S003','到店咨询','已确认','2025-06-13 10:00:00','2025-06-10 08:00:00','false',null,null,null,'false','false',''],
  ['A034','C006','M001','M001','SA001','S001','APP','待确认','2025-06-13 11:00:00','2025-06-10 09:00:00','false',null,null,null,'false','false',''],
  ['A035','C007','M009','M009','SA010','S006','小程序','已完成','2025-06-13 14:00:00','2025-06-10 10:00:00','true',null,null,'后续成交','false','false',''],
  ['A036','C015','M002','M001','SA001','S001','线上官网','已完成','2025-06-13 15:00:00','2025-06-10 11:00:00','true',null,null,'到店成交','true','false','门店调车：原约ModelY，缺货改Model3'],
  ['A037','C008','M012','M012','SA005','S003','电话预约','已取消','2025-06-14 10:00:00','2025-06-11 08:00:00','false','时间冲突',null,null,'false','false',''],
  ['A038','C009','M004','M004','SA006','S003','老客推荐','已完成','2025-06-14 14:00:00','2025-06-11 10:00:00','true',null,null,'到店成交','false','false',''],
  ['A039','C011','M002','M002','SA007','S004','APP','爽约','2025-06-14 16:00:00','2025-06-11 14:00:00','false',null,'忘记预约',null,'false','false',''],
  ['A040','C016','M003','M003','SA008','S005','线上官网','已完成','2025-06-15 10:00:00','2025-06-12 08:00:00','true',null,null,'后续成交','false','false',''],
  ['A041','C001','M006','M006','SA002','S001','小程序','待确认','2025-06-15 14:00:00','2025-06-12 10:00:00','false',null,null,null,'false','false',''],
  ['A042','C002','M010','M010','SA003','S002','到店咨询','已完成','2025-06-15 15:00:00','2025-06-12 11:00:00','true',null,null,'到店成交','false','false',''],
  ['A043','C003','M005','M003','SA003','S002','电话预约','已完成','2025-06-15 16:00:00','2025-06-12 14:00:00','true',null,null,'后续成交','true','false','门店调车：原约汉EV缺货，改宋PLUS EV'],
  ['A044','C012','M007','M007','SA007','S004','APP','已确认','2025-06-16 10:00:00','2025-06-13 08:00:00','false',null,null,null,'false','false',''],
  ['A045','C013','M011','M011','SA008','S005','线上官网','已完成','2025-06-16 14:00:00','2025-06-13 09:00:00','true',null,null,'到店成交','false','false',''],
  ['A046','C019','M009','M009','SA010','S006','小程序','已取消','2025-06-16 15:00:00','2025-06-13 14:00:00','false','天气原因',null,null,'false','false',''],
  ['A047','C020','M001','M001','SA010','S006','老客推荐','爽约','2025-06-17 10:00:00','2025-06-14 08:00:00','false',null,'临时有事',null,'false','false',''],
  ['A048','C023','M004','M004','SA002','S001','APP','已完成','2025-06-17 11:00:00','2025-06-14 09:00:00','true',null,null,'到店成交','false','false',''],
  ['A049','C024','M008','M008','SA004','S002','线上官网','已完成','2025-06-17 14:00:00','2025-06-14 10:00:00','true',null,null,'后续成交','false','false',''],
  ['A050','C021','M012','M012','SA009','S006','电话预约','待确认','2025-06-17 15:00:00','2025-06-14 14:00:00','false',null,null,null,'false','false',''],
];

function buildInsertSQL(): string {
  const values = APPOINTMENT_DATA.map(row => {
    const escaped = row.map(v => {
      if (v === null || v === 'null') return 'NULL';
      if (v === 'true') return 'TRUE';
      if (v === 'false') return 'FALSE';
      return `'${v}'`;
    });
    return `(${escaped.join(',')})`;
  });
  return `INSERT INTO appointments VALUES ${values.join(';\nINSERT INTO appointments VALUES ')};`;
}

export async function seedDatabase(): Promise<void> {
  const db = await getDb();

  await runExec(db, CREATE_TABLES_SQL);
  await runExec(db, SEED_MODELS);
  await runExec(db, SEED_STORES);
  await runExec(db, SEED_SALES);
  await runExec(db, SEED_CUSTOMERS);
  await runExec(db, buildInsertSQL());

  const count = await runQuery(db, 'SELECT COUNT(*) as cnt FROM appointments');
  console.log(`Database seeded with ${(count[0] as Record<string, unknown>).cnt} appointments`);
}
