import bcrypt from 'bcryptjs';
import { getDb, runMigrations } from './database.js';

async function seed() {
  runMigrations();
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (count.cnt > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  const insertCoach = db.prepare(`
    INSERT INTO coaches (name, phone, email, specialties, certifications, bio, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const coach1 = insertCoach.run('张教练', '13800000001', 'zhang@gyms.com', '力量训练,增肌', 'NSCA-CPT', '10年力量训练经验', 'active');
  const coach2 = insertCoach.run('李教练', '13800000002', 'li@gyms.com', '瑜伽,普拉提', 'ACE-CPT', '8年瑜伽教学经验', 'active');
  const coach3 = insertCoach.run('王教练', '13800000003', 'wang@gyms.com', '有氧,减脂', 'NASM-CPT', '5年有氧训练经验', 'inactive');

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

  const pt1 = insertPackageType.run('私教10次卡', 10, 90, 3000, '10次私教课程,有效期90天', 1);
  const pt2 = insertPackageType.run('私教20次卡', 20, 180, 5000, '20次私教课程,有效期180天', 1);
  const pt3 = insertPackageType.run('私教50次卡', 50, 365, 10000, '50次私教课程,有效期365天', 1);
  insertPackageType.run('体验卡', 1, 30, 299, '单次体验课程,有效期30天', 1);

  const insertMemberPackage = db.prepare(`
    INSERT INTO member_packages (member_id, package_type_id, remaining_sessions, total_sessions, start_date, expiry_date, paid_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  const mp1 = insertMemberPackage.run(member1.lastInsertRowid, pt1.lastInsertRowid, 7, 10, formatDate(now), formatDate(new Date(now.getTime() + 90 * 86400000)), 3000, 'active');
  const mp2 = insertMemberPackage.run(member2.lastInsertRowid, pt2.lastInsertRowid, 15, 20, formatDate(now), formatDate(new Date(now.getTime() + 180 * 86400000)), 5000, 'active');
  const mp3 = insertMemberPackage.run(member4.lastInsertRowid, pt1.lastInsertRowid, 5, 10, formatDate(new Date(now.getTime() - 30 * 86400000)), formatDate(new Date(now.getTime() + 60 * 86400000)), 3000, 'frozen');

  const insertGroupClass = db.prepare(`
    INSERT INTO group_classes (name, coach_id, start_time, end_time, max_capacity, current_bookings, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const gc1 = insertGroupClass.run(
    '晨间瑜伽',
    coach2.lastInsertRowid,
    new Date(now.getTime() + 86400000).toISOString().slice(0, 10) + ' 07:00:00',
    new Date(now.getTime() + 86400000).toISOString().slice(0, 10) + ' 08:00:00',
    15, 8, 'scheduled'
  );
  const gc2 = insertGroupClass.run(
    '有氧燃脂',
    coach1.lastInsertRowid,
    new Date(now.getTime() + 86400000).toISOString().slice(0, 10) + ' 18:00:00',
    new Date(now.getTime() + 86400000).toISOString().slice(0, 10) + ' 19:00:00',
    20, 12, 'scheduled'
  );

  const insertAppointment = db.prepare(`
    INSERT INTO appointments (member_id, coach_id, member_package_id, start_time, end_time, type, group_class_id, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

  insertAppointment.run(member1.lastInsertRowid, coach1.lastInsertRowid, mp1.lastInsertRowid, today + ' 10:00:00', today + ' 11:00:00', 'private', null, 'booked', '增肌训练');
  insertAppointment.run(member2.lastInsertRowid, coach2.lastInsertRowid, mp2.lastInsertRowid, today + ' 14:00:00', today + ' 15:00:00', 'private', null, 'booked', '瑜伽私教');
  insertAppointment.run(member3.lastInsertRowid, coach1.lastInsertRowid, null, tomorrow + ' 10:00:00', tomorrow + ' 11:00:00', 'private', null, 'booked', '康复训练');
  insertAppointment.run(member1.lastInsertRowid, coach2.lastInsertRowid, null, tomorrow + ' 07:00:00', tomorrow + ' 08:00:00', 'group', gc1.lastInsertRowid, 'booked', null);
  insertAppointment.run(member2.lastInsertRowid, coach1.lastInsertRowid, null, tomorrow + ' 18:00:00', tomorrow + ' 19:00:00', 'group', gc2.lastInsertRowid, 'booked', null);

  const insertFreeze = db.prepare(`
    INSERT INTO freezes (member_id, member_package_id, start_date, end_date, reason, status, approved_by, approved_at, extra_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminUser = db.prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: number };
  insertFreeze.run(
    member4.lastInsertRowid,
    mp3.lastInsertRowid,
    formatDate(new Date(now.getTime() - 10 * 86400000)),
    formatDate(new Date(now.getTime() + 20 * 86400000)),
    '出差暂停训练',
    'approved',
    adminUser.id,
    new Date(now.getTime() - 10 * 86400000).toISOString(),
    30
  );

  const insertBodyTest = db.prepare(`
    INSERT INTO body_tests (member_id, coach_id, height, weight, body_fat, muscle_mass, waist, chest, hips, notes, test_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBodyTest.run(member1.lastInsertRowid, coach1.lastInsertRowid, 175, 72, 18.5, 35, 80, 95, 95, '初始体测', formatDate(new Date(now.getTime() - 30 * 86400000)));
  insertBodyTest.run(member1.lastInsertRowid, coach1.lastInsertRowid, 175, 74, 16.2, 37, 78, 97, 95, '一个月后体测,肌肉增长', formatDate(now));
  insertBodyTest.run(member2.lastInsertRowid, coach2.lastInsertRowid, 165, 58, 24.0, 25, 68, 85, 92, '初始体测', formatDate(new Date(now.getTime() - 15 * 86400000)));

  const insertMessage = db.prepare(`
    INSERT INTO messages (user_id, title, content, type, read, related_entity_type, related_entity_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const member1User = db.prepare('SELECT id FROM users WHERE member_id = ?').get(member1.lastInsertRowid) as { id: number };
  const coach1User = db.prepare('SELECT id FROM users WHERE coach_id = ?').get(coach1.lastInsertRowid) as { id: number };

  insertMessage.run(member1User.id, '预约确认', '您已成功预约明天10:00的私教课程', 'reminder', 0, 'appointment', 1);
  insertMessage.run(coach1User.id, '新预约', '赵明预约了明天10:00的私教课程', 'notification', 0, 'appointment', 1);
  insertMessage.run(member1User.id, '套餐即将到期', '您的私教10次卡将在30天后到期,请及时续费', 'reminder', 0, 'member_package', mp1.lastInsertRowid);
  insertMessage.run(adminUser.id, '冻绷新申请', '周芳申请冻结套餐,请审核', 'approval', 0, 'freeze', 1);

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (coach_id, date, start_time, end_time, type, status, approved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertSchedule.run(coach1.lastInsertRowid, tomorrow, '09:00', '12:00', 'private', 'approved', adminUser.id);
  insertSchedule.run(coach1.lastInsertRowid, tomorrow, '14:00', '17:00', 'private', 'approved', adminUser.id);
  insertSchedule.run(coach2.lastInsertRowid, tomorrow, '07:00', '09:00', 'group', 'approved', adminUser.id);
  insertSchedule.run(coach2.lastInsertRowid, new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10), '09:00', '18:00', 'leave', 'pending', null);

  console.log('Seed data inserted successfully!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
