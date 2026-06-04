import { createServer } from 'http';
import app from '../api/app.js';

let server: any;
let baseUrl: string;

export async function setupTestServer(): Promise<{ server: any; baseUrl: string }> {
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address() as { port: number };
  baseUrl = `http://localhost:${addr.port}`;
  return { server, baseUrl };
}

export function teardownTestServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

export async function login(baseUrl: string, username: string, password: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  return data.data.token;
}

export async function resetDatabase(): Promise<void> {
  const { getDb, runMigrations } = await import('../api/db/database.js');
  const db = getDb();

  db.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM audit_logs;
    DELETE FROM session_deductions;
    DELETE FROM email_logs;
    DELETE FROM renewal_tracking;
    DELETE FROM messages;
    DELETE FROM schedules;
    DELETE FROM appointments;
    DELETE FROM freezes;
    DELETE FROM body_tests;
    DELETE FROM member_packages;
    DELETE FROM group_classes;
    DELETE FROM package_types;
    DELETE FROM users;
    DELETE FROM members;
    DELETE FROM coaches;
    DELETE FROM sqlite_sequence;
    PRAGMA foreign_keys = ON;
  `);

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash('password123', 10);

  const insertCoach = db.prepare(`
    INSERT INTO coaches (name, phone, email, specialties, certifications, bio, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const coach1 = insertCoach.run('张教练', '13800000001', 'zhang@gyms.com', '力量训练,增肌', 'NSCA-CPT', '10年力量训练经验', 'active');
  const coach2 = insertCoach.run('李教练', '13800000002', 'li@gyms.com', '瑜伽,普拉提', 'ACE-CPT', '8年瑜伽教学经验', 'active');

  const insertMember = db.prepare(`
    INSERT INTO members (name, phone, email, gender, birthday, emergency_contact, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const member1 = insertMember.run('赵明', '13900000001', 'zhao@member.com', '男', '1990-05-15', '赵红 13900000002', '希望增肌', 'active');
  const member2 = insertMember.run('钱丽', '13900000002', 'qian@member.com', '女', '1995-08-20', '钱伟 13900000003', '希望减脂', 'active');
  const member3 = insertMember.run('孙强', '13900000003', 'sun@member.com', '男', '1988-03-10', '孙梅 13900000004', '康复训练', 'active');
  const member4 = insertMember.run('周芳', '13900000004', 'zhou@member.com', '女', '1992-11-25', '周杰 13900000005', '已暂停训练', 'frozen');

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role, name, phone, email, coach_id, member_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', passwordHash, 'admin', '系统管理员', '13700000000', 'admin@gyms.com', null, null);
  insertUser.run('coach1', passwordHash, 'coach', '张教练', '13800000001', 'zhang@gyms.com', coach1.lastInsertRowid, null);
  insertUser.run('coach2', passwordHash, 'coach', '李教练', '13800000002', 'li@gyms.com', coach2.lastInsertRowid, null);
  insertUser.run('receptionist1', passwordHash, 'receptionist', '前台小刘', '13600000001', 'liu@gyms.com', null, null);
  insertUser.run('member1', passwordHash, 'member', '赵明', '13900000001', 'zhao@member.com', null, member1.lastInsertRowid);

  const insertPackageType = db.prepare(`
    INSERT INTO package_types (name, total_sessions, valid_days, price, description, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const pt1 = insertPackageType.run('私教10次卡', 10, 90, 3000, '10次私教课程', 1);
  const pt2 = insertPackageType.run('私教20次卡', 20, 180, 5000, '20次私教课程', 1);

  const insertMemberPackage = db.prepare(`
    INSERT INTO member_packages (member_id, package_type_id, remaining_sessions, total_sessions, start_date, expiry_date, paid_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const mp1 = insertMemberPackage.run(member1.lastInsertRowid, pt1.lastInsertRowid, 7, 10, fmt(now), fmt(new Date(now.getTime() + 90 * 86400000)), 3000, 'active');
  const mp2 = insertMemberPackage.run(member2.lastInsertRowid, pt2.lastInsertRowid, 15, 20, fmt(now), fmt(new Date(now.getTime() + 180 * 86400000)), 5000, 'active');
  const mp3 = insertMemberPackage.run(member4.lastInsertRowid, pt1.lastInsertRowid, 5, 10, fmt(new Date(now.getTime() - 30 * 86400000)), fmt(new Date(now.getTime() + 60 * 86400000)), 3000, 'frozen');
  const mp4 = insertMemberPackage.run(member3.lastInsertRowid, pt1.lastInsertRowid, 0, 10, fmt(now), fmt(new Date(now.getTime() + 90 * 86400000)), 3000, 'active');

  const today = now.toISOString().slice(0, 10);
  const tomorrow = fmt(new Date(now.getTime() + 86400000));

  const insertAppointment = db.prepare(`
    INSERT INTO appointments (member_id, coach_id, member_package_id, start_time, end_time, type, group_class_id, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAppointment.run(member1.lastInsertRowid, coach1.lastInsertRowid, mp1.lastInsertRowid, today + ' 10:00:00', today + ' 11:00:00', 'private', null, 'booked', '增肌训练');
  insertAppointment.run(member2.lastInsertRowid, coach2.lastInsertRowid, mp2.lastInsertRowid, today + ' 14:00:00', today + ' 15:00:00', 'private', null, 'booked', '瑜伽私教');
}
