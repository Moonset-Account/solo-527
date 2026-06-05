import bcrypt from 'bcryptjs';

function getNextId(map: Map<number, any>): number {
  if (map.size === 0) return 1;
  return Math.max(...Array.from(map.keys())) + 1;
}

const users = new Map<number, any>();
const schools = new Map<number, any>();
const courses = new Map<number, any>();
const sessions = new Map<number, any>();
const bookings = new Map<number, any>();
const participants = new Map<number, any>();
const guides = new Map<number, any>();
const scheduleAssignments = new Map<number, any>();
const teachingAids = new Map<number, any>();
const courseTeachingAids = new Map<number, any>();
const sessionTeachingAids = new Map<number, any>();
const feedbacks = new Map<number, any>();
const notifications = new Map<number, any>();
const auditLogs = new Map<number, any>();

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

users.set(1, {
  id: 1,
  username: 'admin',
  email: 'admin@museum.cn',
  password_hash: bcrypt.hashSync('admin123', 10),
  role: 'admin',
  name: '系统管理员',
  phone: '13800000001',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(2, {
  id: 2,
  username: 'manager1',
  email: 'manager1@museum.cn',
  password_hash: bcrypt.hashSync('manager123', 10),
  role: 'manager',
  name: '王经理',
  phone: '13800000002',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(3, {
  id: 3,
  username: 'manager2',
  email: 'manager2@museum.cn',
  password_hash: bcrypt.hashSync('manager123', 10),
  role: 'manager',
  name: '李经理',
  phone: '13800000003',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(4, {
  id: 4,
  username: 'guide1',
  email: 'guide1@museum.cn',
  password_hash: bcrypt.hashSync('guide123', 10),
  role: 'guide',
  name: '张讲解员',
  phone: '13800000004',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(5, {
  id: 5,
  username: 'guide2',
  email: 'guide2@museum.cn',
  password_hash: bcrypt.hashSync('guide123', 10),
  role: 'guide',
  name: '刘讲解员',
  phone: '13800000005',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(6, {
  id: 6,
  username: 'guide3',
  email: 'guide3@museum.cn',
  password_hash: bcrypt.hashSync('guide123', 10),
  role: 'guide',
  name: '陈讲解员',
  phone: '13800000006',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(7, {
  id: 7,
  username: 'school1',
  email: 'school1@school.cn',
  password_hash: bcrypt.hashSync('school123', 10),
  role: 'school_contact',
  name: '赵老师',
  phone: '13800000007',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(8, {
  id: 8,
  username: 'school2',
  email: 'school2@school.cn',
  password_hash: bcrypt.hashSync('school123', 10),
  role: 'school_contact',
  name: '孙老师',
  phone: '13800000008',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(9, {
  id: 9,
  username: 'parent1',
  email: 'parent1@email.cn',
  password_hash: bcrypt.hashSync('parent123', 10),
  role: 'parent',
  name: '周家长',
  phone: '13800000009',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

users.set(10, {
  id: 10,
  username: 'parent2',
  email: 'parent2@email.cn',
  password_hash: bcrypt.hashSync('parent123', 10),
  role: 'parent',
  name: '吴家长',
  phone: '13800000010',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

schools.set(1, {
  id: 1,
  name: '北京市第一实验小学',
  contact_person: '赵老师',
  phone: '010-12345678',
  address: '北京市西城区前门大街1号',
  created_at: now.toISOString(),
});

schools.set(2, {
  id: 2,
  name: '上海市民办平和学校',
  contact_person: '孙老师',
  phone: '021-87654321',
  address: '上海市浦东新区黄杨路2号',
  created_at: now.toISOString(),
});

courses.set(1, {
  id: 1,
  name: '古生物探秘之旅',
  description: '探索远古生物的奥秘，了解化石的形成过程，亲手触摸真实的化石标本。',
  min_age: 6,
  max_age: 12,
  capacity: 30,
  duration_minutes: 90,
  status: 'active',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

courses.set(2, {
  id: 2,
  name: '陶瓷艺术体验',
  description: '了解中国传统陶瓷工艺，亲手体验拉坯、上釉等制作环节。',
  min_age: 8,
  max_age: 15,
  capacity: 25,
  duration_minutes: 120,
  status: 'active',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

courses.set(3, {
  id: 3,
  name: '青铜器鉴赏',
  description: '鉴赏商周时期青铜器的造型与纹饰，了解古代铸造工艺。',
  min_age: 10,
  max_age: 16,
  capacity: 20,
  duration_minutes: 60,
  status: 'active',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

courses.set(4, {
  id: 4,
  name: '自然科学探索',
  description: '通过显微镜观察微观世界，探索自然科学的基本原理。',
  min_age: 7,
  max_age: 14,
  capacity: 35,
  duration_minutes: 90,
  status: 'active',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.set(1, {
  id: 1,
  course_id: 1,
  date: formatDate(addDays(today, 3)),
  start_time: '09:00',
  end_time: '10:30',
  capacity: 30,
  booked_count: 0,
  status: 'scheduled',
  guide_id: null,
  location: '古生物展厅A区',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.set(2, {
  id: 2,
  course_id: 1,
  date: formatDate(addDays(today, 5)),
  start_time: '14:00',
  end_time: '15:30',
  capacity: 30,
  booked_count: 0,
  status: 'scheduled',
  guide_id: null,
  location: '古生物展厅A区',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.set(3, {
  id: 3,
  course_id: 2,
  date: formatDate(addDays(today, 2)),
  start_time: '10:00',
  end_time: '12:00',
  capacity: 25,
  booked_count: 0,
  status: 'scheduled',
  guide_id: null,
  location: '陶艺工坊B区',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.set(4, {
  id: 4,
  course_id: 2,
  date: formatDate(addDays(today, 7)),
  start_time: '09:30',
  end_time: '11:30',
  capacity: 25,
  booked_count: 0,
  status: 'scheduled',
  guide_id: null,
  location: '陶艺工坊B区',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.set(5, {
  id: 5,
  course_id: 3,
  date: formatDate(addDays(today, 4)),
  start_time: '13:00',
  end_time: '14:00',
  capacity: 20,
  booked_count: 0,
  status: 'scheduled',
  guide_id: null,
  location: '青铜器展厅C区',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.set(6, {
  id: 6,
  course_id: 3,
  date: formatDate(addDays(today, 10)),
  start_time: '10:00',
  end_time: '11:00',
  capacity: 20,
  booked_count: 0,
  status: 'scheduled',
  guide_id: null,
  location: '青铜器展厅C区',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.set(7, {
  id: 7,
  course_id: 4,
  date: formatDate(addDays(today, 6)),
  start_time: '09:00',
  end_time: '10:30',
  capacity: 35,
  booked_count: 0,
  status: 'scheduled',
  guide_id: null,
  location: '科学实验室D区',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.set(8, {
  id: 8,
  course_id: 4,
  date: formatDate(addDays(today, 12)),
  start_time: '14:00',
  end_time: '15:30',
  capacity: 35,
  booked_count: 0,
  status: 'scheduled',
  guide_id: null,
  location: '科学实验室D区',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

bookings.set(1, {
  id: 1,
  type: 'group',
  session_id: 1,
  user_id: 7,
  school_id: 1,
  total_count: 20,
  status: 'pending',
  review_note: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

bookings.set(2, {
  id: 2,
  type: 'group',
  session_id: 3,
  user_id: 8,
  school_id: 2,
  total_count: 18,
  status: 'pending',
  review_note: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

bookings.set(3, {
  id: 3,
  type: 'group',
  session_id: 5,
  user_id: 7,
  school_id: 1,
  total_count: 15,
  status: 'pending',
  review_note: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

bookings.set(4, {
  id: 4,
  type: 'individual',
  session_id: 1,
  user_id: 9,
  school_id: null,
  total_count: 1,
  status: 'pending',
  review_note: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

bookings.set(5, {
  id: 5,
  type: 'individual',
  session_id: 7,
  user_id: 10,
  school_id: null,
  total_count: 1,
  status: 'pending',
  review_note: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

bookings.set(6, {
  id: 6,
  type: 'group',
  session_id: 2,
  user_id: 7,
  school_id: 1,
  total_count: 25,
  status: 'approved',
  review_note: '审核通过',
  reviewed_by: 2,
  reviewed_at: now.toISOString(),
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

bookings.set(7, {
  id: 7,
  type: 'individual',
  session_id: 3,
  user_id: 9,
  school_id: null,
  total_count: 1,
  status: 'approved',
  review_note: '审核通过',
  reviewed_by: 2,
  reviewed_at: now.toISOString(),
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
});

sessions.get(2)!.booked_count = 25;
sessions.get(3)!.booked_count = 1;

let pId = 1;
for (let i = 0; i < 20; i++) {
  participants.set(pId, {
    id: pId,
    booking_id: 1,
    name: `学生${i + 1}`,
    age: 6 + Math.floor(Math.random() * 7),
    checked_in: false,
    checked_in_at: null,
  });
  pId++;
}

for (let i = 0; i < 18; i++) {
  participants.set(pId, {
    id: pId,
    booking_id: 2,
    name: `同学${i + 1}`,
    age: 8 + Math.floor(Math.random() * 8),
    checked_in: false,
    checked_in_at: null,
  });
  pId++;
}

for (let i = 0; i < 15; i++) {
  participants.set(pId, {
    id: pId,
    booking_id: 3,
    name: `学员${i + 1}`,
    age: 10 + Math.floor(Math.random() * 7),
    checked_in: false,
    checked_in_at: null,
  });
  pId++;
}

participants.set(pId, {
  id: pId,
  booking_id: 4,
  name: '周小朋友',
  age: 9,
  checked_in: false,
  checked_in_at: null,
});
pId++;

participants.set(pId, {
  id: pId,
  booking_id: 5,
  name: '吴小朋友',
  age: 11,
  checked_in: false,
  checked_in_at: null,
});
pId++;

for (let i = 0; i < 25; i++) {
  participants.set(pId, {
    id: pId,
    booking_id: 6,
    name: `组员${i + 1}`,
    age: 6 + Math.floor(Math.random() * 7),
    checked_in: false,
    checked_in_at: null,
  });
  pId++;
}

participants.set(pId, {
  id: pId,
  booking_id: 7,
  name: '周小朋友',
  age: 10,
  checked_in: false,
  checked_in_at: null,
});
pId++;

guides.set(1, {
  id: 1,
  user_id: 4,
  specialties: '古生物,自然历史',
  status: 'active',
});

guides.set(2, {
  id: 2,
  user_id: 5,
  specialties: '陶瓷,传统工艺',
  status: 'active',
});

guides.set(3, {
  id: 3,
  user_id: 6,
  specialties: '青铜器,古代文明',
  status: 'active',
});

scheduleAssignments.set(1, {
  id: 1,
  session_id: 1,
  guide_id: 1,
  assigned_at: now.toISOString(),
});

scheduleAssignments.set(2, {
  id: 2,
  session_id: 3,
  guide_id: 2,
  assigned_at: now.toISOString(),
});

scheduleAssignments.set(3, {
  id: 3,
  session_id: 5,
  guide_id: 3,
  assigned_at: now.toISOString(),
});

sessions.get(1)!.guide_id = 1;
sessions.get(3)!.guide_id = 2;
sessions.get(5)!.guide_id = 3;

teachingAids.set(1, {
  id: 1,
  name: '化石标本套装',
  total_quantity: 10,
  available_quantity: 10,
  status: 'available',
});

teachingAids.set(2, {
  id: 2,
  name: '陶艺工具套装',
  total_quantity: 15,
  available_quantity: 15,
  status: 'available',
});

teachingAids.set(3, {
  id: 3,
  name: '青铜器复制品',
  total_quantity: 8,
  available_quantity: 8,
  status: 'available',
});

teachingAids.set(4, {
  id: 4,
  name: '显微镜套装',
  total_quantity: 12,
  available_quantity: 12,
  status: 'available',
});

teachingAids.set(5, {
  id: 5,
  name: '绘画工具套装',
  total_quantity: 20,
  available_quantity: 20,
  status: 'available',
});

courseTeachingAids.set(1, { id: 1, course_id: 1, teaching_aid_id: 1, quantity_needed: 5 });
courseTeachingAids.set(2, { id: 2, course_id: 2, teaching_aid_id: 2, quantity_needed: 10 });
courseTeachingAids.set(3, { id: 3, course_id: 2, teaching_aid_id: 5, quantity_needed: 8 });
courseTeachingAids.set(4, { id: 4, course_id: 3, teaching_aid_id: 3, quantity_needed: 4 });
courseTeachingAids.set(5, { id: 5, course_id: 4, teaching_aid_id: 4, quantity_needed: 6 });
courseTeachingAids.set(6, { id: 6, course_id: 4, teaching_aid_id: 1, quantity_needed: 3 });

notifications.set(1, {
  id: 1,
  user_id: 7,
  type: 'booking',
  title: '预约已提交',
  content: '您的团体预约已提交，等待审核。',
  read: false,
  created_at: now.toISOString(),
});

notifications.set(2, {
  id: 2,
  user_id: 2,
  type: 'review',
  title: '新预约待审核',
  content: '有一个新的团体预约需要审核。',
  read: false,
  created_at: now.toISOString(),
});

notifications.set(3, {
  id: 3,
  user_id: 9,
  type: 'booking',
  title: '预约已通过',
  content: '您的个人预约已审核通过。',
  read: true,
  created_at: now.toISOString(),
});

auditLogs.set(1, {
  id: 1,
  user_id: 1,
  action: 'create',
  entity_type: 'course',
  entity_id: 1,
  old_value: null,
  new_value: JSON.stringify({ name: '古生物探秘之旅' }),
  ip_address: '127.0.0.1',
  created_at: now.toISOString(),
});

auditLogs.set(2, {
  id: 2,
  user_id: 2,
  action: 'approve',
  entity_type: 'booking',
  entity_id: 6,
  old_value: JSON.stringify({ status: 'pending' }),
  new_value: JSON.stringify({ status: 'approved' }),
  ip_address: '127.0.0.1',
  created_at: now.toISOString(),
});

export const db = {
  users,
  schools,
  courses,
  sessions,
  bookings,
  participants,
  guides,
  scheduleAssignments,
  teachingAids,
  courseTeachingAids,
  sessionTeachingAids,
  feedbacks,
  notifications,
  auditLogs,
  getNextId,
};
