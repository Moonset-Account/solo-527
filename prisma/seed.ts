import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

async function main() {
  console.log('🗑️ 清空现有数据...')
  await prisma.waitlistAdjustLog.deleteMany()
  await prisma.refundRecord.deleteMany()
  await prisma.waitlistEntry.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.class.deleteMany()
  await prisma.student.deleteMany()
  await prisma.user.deleteMany()
  await prisma.course.deleteMany()
  await prisma.campus.deleteMany()

  // ─── 1. Campuses ───
  console.log('🏫 创建校区...')
  const campuses = await Promise.all([
    prisma.campus.create({ data: { name: '朝阳区校区', city: '北京' } }),
    prisma.campus.create({ data: { name: '海淀区校区', city: '北京' } }),
    prisma.campus.create({ data: { name: '西城区校区', city: '北京' } }),
  ])
  const [cp0, cp1, cp2] = campuses

  // ─── 2. Courses ───
  console.log('📚 创建课程...')
  const courses = await Promise.all([
    prisma.course.create({ data: { name: '少儿英语启蒙', ageGroup: '3-6岁', capacity: 20, campusId: cp0.id } }),
    prisma.course.create({ data: { name: '青少年编程基础', ageGroup: '10-12岁', capacity: 15, campusId: cp0.id } }),
    prisma.course.create({ data: { name: '数学思维训练', ageGroup: '7-9岁', capacity: 25, campusId: cp1.id } }),
    prisma.course.create({ data: { name: '创意美术', ageGroup: '3-6岁', capacity: 20, campusId: cp1.id } }),
    prisma.course.create({ data: { name: '钢琴入门', ageGroup: '7-9岁', capacity: 10, campusId: cp2.id } }),
    prisma.course.create({ data: { name: '机器人编程', ageGroup: '13-15岁', capacity: 18, campusId: cp2.id } }),
    prisma.course.create({ data: { name: '舞蹈启蒙', ageGroup: '3-6岁', capacity: 8, campusId: cp0.id } }),
  ])
  const [co0, co1, co2, co3, co4, co5, co6] = courses

  // ─── 3. Classes ───
  console.log('📝 创建班级...')
  const classDefs = [
    { name: '少儿英语启蒙-A班', courseId: co0.id, campusId: cp0.id, capacity: 20, enrolledCount: 18, status: 'active', startDate: d(2025, 1, 15) },
    { name: '少儿英语启蒙-B班', courseId: co0.id, campusId: cp0.id, capacity: 20, enrolledCount: 8, status: 'active', startDate: d(2025, 2, 1) },
    { name: '青少年编程基础-A班', courseId: co1.id, campusId: cp0.id, capacity: 15, enrolledCount: 13, status: 'active', startDate: d(2025, 1, 20) },
    { name: '数学思维训练-A班', courseId: co2.id, campusId: cp1.id, capacity: 25, enrolledCount: 20, status: 'active', startDate: d(2025, 2, 10) },
    { name: '数学思维训练-B班', courseId: co2.id, campusId: cp1.id, capacity: 25, enrolledCount: 15, status: 'active', startDate: d(2025, 3, 1) },
    { name: '创意美术-A班', courseId: co3.id, campusId: cp1.id, capacity: 20, enrolledCount: 19, status: 'active', startDate: d(2025, 1, 10) },
    { name: '钢琴入门-A班', courseId: co4.id, campusId: cp2.id, capacity: 10, enrolledCount: 10, status: 'active', startDate: d(2025, 2, 15) },
    { name: '机器人编程-A班', courseId: co5.id, campusId: cp2.id, capacity: 18, enrolledCount: 16, status: 'active', startDate: d(2025, 3, 5) },
    { name: '舞蹈启蒙-A班', courseId: co6.id, campusId: cp0.id, capacity: 8, enrolledCount: 8, status: 'active', startDate: d(2025, 1, 8) },
    { name: '机器人编程-B班', courseId: co5.id, campusId: cp2.id, capacity: 18, enrolledCount: 10, status: 'active', startDate: d(2025, 4, 1) },
  ]
  const cls: Awaited<ReturnType<typeof prisma.class.create>>[] = []
  for (const def of classDefs) {
    cls.push(await prisma.class.create({ data: def }))
  }

  // ─── 4. Students ───
  console.log('👩‍🎓 创建学生...')
  const studentDefs = [
    { name: '张小明', isMinor: true, ageGroup: '7-9岁', phone: '13800001001', birthDate: d(2017, 3, 15) },
    { name: '李思远', isMinor: true, ageGroup: '10-12岁', phone: '13800001002', birthDate: d(2014, 7, 22) },
    { name: '王子涵', isMinor: true, ageGroup: '3-6岁', phone: '13800001003', birthDate: d(2020, 11, 3) },
    { name: '刘雨萱', isMinor: true, ageGroup: '3-6岁', phone: '13800001004', birthDate: d(2021, 1, 18) },
    { name: '陈一诺', isMinor: true, ageGroup: '7-9岁', phone: '13800001005', birthDate: d(2017, 5, 20) },
    { name: '赵梓萱', isMinor: true, ageGroup: '10-12岁', phone: '13800001006', birthDate: d(2014, 9, 12) },
    { name: '孙浩然', isMinor: true, ageGroup: '10-12岁', phone: '13800001007', birthDate: d(2013, 12, 8) },
    { name: '周诗琪', isMinor: true, ageGroup: '7-9岁', phone: '13800001008', birthDate: d(2016, 4, 25) },
    { name: '吴宇轩', isMinor: true, ageGroup: '7-9岁', phone: '13800001009', birthDate: d(2016, 8, 14) },
    { name: '郑嘉怡', isMinor: true, ageGroup: '7-9岁', phone: '13800001010', birthDate: d(2017, 2, 6) },
    { name: '黄梦琪', isMinor: true, ageGroup: '7-9岁', phone: '13800001011', birthDate: d(2016, 11, 30) },
    { name: '杨子墨', isMinor: true, ageGroup: '7-9岁', phone: '13800001012' },
    { name: '朱雅婷', isMinor: true, ageGroup: '3-6岁', phone: '13800001013', birthDate: d(2021, 3, 22) },
    { name: '马天佑', isMinor: true, ageGroup: '3-6岁', phone: '13800001014', birthDate: d(2020, 7, 9) },
    { name: '胡欣怡', isMinor: true, ageGroup: '7-9岁', phone: '13800001015', birthDate: d(2017, 9, 5) },
    { name: '林子轩', isMinor: true, ageGroup: '13-15岁', phone: '13800001016', birthDate: d(2012, 4, 16) },
    { name: '何雨桐', isMinor: true, ageGroup: '3-6岁', phone: '13800001017', birthDate: d(2021, 5, 28) },
    { name: '高思齐', isMinor: true, ageGroup: '13-15岁', phone: '13800001018', birthDate: d(2011, 8, 3) },
    { name: '罗语嫣', isMinor: true, ageGroup: '10-12岁', phone: '13800001019', birthDate: d(2014, 1, 14) },
    { name: '谢明哲', isMinor: true, ageGroup: '10-12岁', phone: '13800001020' },
    { name: '韩雨辰', isMinor: true, ageGroup: '7-9岁', phone: '13800001021', birthDate: d(2017, 10, 11) },
    { name: '唐紫萱', isMinor: true, ageGroup: '3-6岁', phone: '13800001022', birthDate: d(2020, 12, 19) },
    { name: '冯逸飞', isMinor: true, ageGroup: '13-15岁', phone: '13800001023', birthDate: d(2011, 5, 7) },
    { name: '董晨曦', isMinor: true, ageGroup: '10-12岁', phone: '13800001024', birthDate: d(2014, 11, 23) },
    { name: '程思远', isMinor: true, ageGroup: '13-15岁', phone: '13800001025', birthDate: d(2012, 2, 14) },
    { name: '曹雨欣', isMinor: true, ageGroup: '7-9岁', phone: '13800001026', birthDate: d(2016, 6, 30) },
    { name: '袁乐天', isMinor: true, ageGroup: '10-12岁', phone: '13800001027', birthDate: d(2013, 9, 18) },
    { name: '邓子琪', isMinor: true, ageGroup: '3-6岁', phone: '13800001028', birthDate: d(2021, 8, 12) },
    { name: '王建国', isMinor: false, ageGroup: '成人', phone: '13900001001' },
    { name: '张秀英', isMinor: false, ageGroup: '成人', phone: '13900001002' },
    { name: '李明辉', isMinor: false, ageGroup: '成人', phone: '13900001003' },
    { name: '陈建华', isMinor: false, ageGroup: '成人', phone: '13900001004' },
    { name: '刘美玲', isMinor: false, ageGroup: '成人', phone: '13900001005' },
    { name: '赵志强', isMinor: false, ageGroup: '成人', phone: '13900001006' },
    { name: '孙丽华', isMinor: false, ageGroup: '成人', phone: '13900001007' },
    { name: '周伟民', isMinor: false, ageGroup: '成人', phone: '13900001008' },
    { name: '吴秀芳', isMinor: false, ageGroup: '成人', phone: '13900001009' },
    { name: '杨国庆', isMinor: false, ageGroup: '成人', phone: '13900001010' },
    { name: '黄德明', isMinor: false, ageGroup: '成人', phone: '13900001011' },
    { name: '林慧敏', isMinor: false, ageGroup: '成人', phone: '13900001012' },
  ]
  const st: Awaited<ReturnType<typeof prisma.student.create>>[] = []
  for (const def of studentDefs) {
    st.push(await prisma.student.create({ data: def }))
  }

  // ─── 5. Users ───
  console.log('👤 创建用户...')
  const users = await Promise.all([
    prisma.user.create({ data: { name: '张老师', email: 'zhang.teacher@example.com', role: 'staff', campusId: cp0.id } }),
    prisma.user.create({ data: { name: '李主任', email: 'li.director@example.com', role: 'admin', campusId: cp0.id } }),
  ])
  const [u0, u1] = users

  // ─── 6. Enrollments ───
  console.log('📋 创建报名记录...')

  const enrollDefs: { si: number; coi: number; cli: number | null; cpi: number; status: string; channel: string; time: Date; dup: boolean; convertedTime?: Date }[] = [
    // ── Enrolled (18) ──
    { si: 2, coi: 0, cli: 0, cpi: 0, status: 'enrolled', channel: '朋友推荐', time: d(2025, 1, 16), dup: false },
    { si: 3, coi: 0, cli: 0, cpi: 0, status: 'enrolled', channel: '微信公众号', time: d(2025, 1, 18), dup: false },
    { si: 13, coi: 0, cli: 1, cpi: 0, status: 'enrolled', channel: '线下推广', time: d(2025, 2, 3), dup: false },
    { si: 16, coi: 0, cli: 1, cpi: 0, status: 'enrolled', channel: '官网注册', time: d(2025, 2, 5), dup: false },
    { si: 1, coi: 1, cli: 2, cpi: 0, status: 'enrolled', channel: '朋友推荐', time: d(2025, 1, 22), dup: false, convertedTime: d(2025, 1, 25) },
    { si: 5, coi: 1, cli: 2, cpi: 0, status: 'enrolled', channel: '线上广告', time: d(2025, 1, 23), dup: false },
    { si: 0, coi: 2, cli: 3, cpi: 1, status: 'enrolled', channel: '微信公众号', time: d(2025, 2, 11), dup: false },
    { si: 4, coi: 2, cli: 3, cpi: 1, status: 'enrolled', channel: '线下推广', time: d(2025, 2, 12), dup: false },
    { si: 7, coi: 2, cli: 3, cpi: 1, status: 'enrolled', channel: '朋友推荐', time: d(2025, 2, 14), dup: false },
    { si: 8, coi: 2, cli: 4, cpi: 1, status: 'enrolled', channel: '官网注册', time: d(2025, 3, 3), dup: false },
    { si: 9, coi: 2, cli: 4, cpi: 1, status: 'enrolled', channel: '微信公众号', time: d(2025, 3, 4), dup: false },
    { si: 21, coi: 3, cli: 5, cpi: 1, status: 'enrolled', channel: '线下推广', time: d(2025, 1, 12), dup: false, convertedTime: d(2025, 1, 20) },
    { si: 27, coi: 3, cli: 5, cpi: 1, status: 'enrolled', channel: '朋友推荐', time: d(2025, 1, 15), dup: false },
    { si: 14, coi: 4, cli: 6, cpi: 2, status: 'enrolled', channel: '微信公众号', time: d(2025, 2, 16), dup: false },
    { si: 15, coi: 5, cli: 7, cpi: 2, status: 'enrolled', channel: '朋友推荐', time: d(2025, 3, 7), dup: false },
    { si: 22, coi: 5, cli: 9, cpi: 2, status: 'enrolled', channel: '线上广告', time: d(2025, 4, 3), dup: false },
    { si: 12, coi: 6, cli: 8, cpi: 0, status: 'enrolled', channel: '线下推广', time: d(2025, 1, 9), dup: false },
    { si: 28, coi: 0, cli: 1, cpi: 0, status: 'enrolled', channel: '官网注册', time: d(2025, 2, 8), dup: false },

    // ── Browse (32) ──
    { si: 10, coi: 0, cli: null, cpi: 0, status: 'browse', channel: '线下推广', time: d(2025, 2, 10), dup: false },
    { si: 11, coi: 0, cli: null, cpi: 0, status: 'browse', channel: '微信公众号', time: d(2025, 3, 5), dup: false },
    { si: 19, coi: 1, cli: null, cpi: 0, status: 'browse', channel: '线上广告', time: d(2025, 2, 15), dup: false },
    { si: 20, coi: 2, cli: null, cpi: 1, status: 'browse', channel: '朋友推荐', time: d(2025, 3, 20), dup: false },
    { si: 25, coi: 2, cli: null, cpi: 1, status: 'browse', channel: '线下推广', time: d(2025, 4, 8), dup: false },
    { si: 6, coi: 1, cli: null, cpi: 0, status: 'browse', channel: '官网注册', time: d(2025, 1, 28), dup: false },
    { si: 23, coi: 5, cli: null, cpi: 2, status: 'browse', channel: '微信公众号', time: d(2025, 3, 12), dup: false },
    { si: 24, coi: 5, cli: null, cpi: 2, status: 'browse', channel: '线上广告', time: d(2025, 4, 15), dup: false },
    { si: 29, coi: 0, cli: null, cpi: 0, status: 'browse', channel: '线下推广', time: d(2025, 1, 20), dup: false },
    { si: 30, coi: 3, cli: null, cpi: 1, status: 'browse', channel: '微信公众号', time: d(2025, 2, 22), dup: false },
    { si: 31, coi: 4, cli: null, cpi: 2, status: 'browse', channel: '朋友推荐', time: d(2025, 3, 1), dup: false },
    { si: 32, coi: 2, cli: null, cpi: 1, status: 'browse', channel: '线下推广', time: d(2025, 4, 5), dup: false },
    { si: 17, coi: 5, cli: null, cpi: 2, status: 'browse', channel: '官网注册', time: d(2025, 3, 18), dup: false },
    { si: 18, coi: 1, cli: null, cpi: 0, status: 'browse', channel: '线上广告', time: d(2025, 2, 8), dup: false },
    { si: 26, coi: 6, cli: null, cpi: 0, status: 'browse', channel: '微信公众号', time: d(2025, 5, 10), dup: false },
    { si: 33, coi: 0, cli: null, cpi: 0, status: 'browse', channel: '朋友推荐', time: d(2025, 1, 25), dup: false },
    { si: 34, coi: 3, cli: null, cpi: 1, status: 'browse', channel: '线下推广', time: d(2025, 3, 8), dup: false },
    { si: 35, coi: 5, cli: null, cpi: 2, status: 'browse', channel: '微信公众号', time: d(2025, 4, 20), dup: false },
    { si: 36, coi: 2, cli: null, cpi: 1, status: 'browse', channel: '线上广告', time: d(2025, 5, 5), dup: false },
    { si: 37, coi: 4, cli: null, cpi: 2, status: 'browse', channel: '官网注册', time: d(2025, 2, 28), dup: false },
    { si: 38, coi: 1, cli: null, cpi: 0, status: 'browse', channel: '朋友推荐', time: d(2025, 3, 25), dup: false },
    { si: 39, coi: 6, cli: null, cpi: 0, status: 'browse', channel: '线下推广', time: d(2025, 5, 15), dup: false },
    { si: 10, coi: 2, cli: null, cpi: 1, status: 'browse', channel: '微信公众号', time: d(2025, 4, 12), dup: false },
    { si: 11, coi: 3, cli: null, cpi: 1, status: 'browse', channel: '线下推广', time: d(2025, 5, 8), dup: false },
    { si: 19, coi: 5, cli: null, cpi: 2, status: 'browse', channel: '线上广告', time: d(2025, 3, 30), dup: false },
    { si: 20, coi: 4, cli: null, cpi: 2, status: 'browse', channel: '朋友推荐', time: d(2025, 4, 18), dup: false },
    { si: 25, coi: 0, cli: null, cpi: 0, status: 'browse', channel: '官网注册', time: d(2025, 5, 20), dup: false },
    { si: 6, coi: 2, cli: null, cpi: 1, status: 'browse', channel: '微信公众号', time: d(2025, 3, 15), dup: false },
    { si: 23, coi: 1, cli: null, cpi: 0, status: 'browse', channel: '线下推广', time: d(2025, 4, 25), dup: false },
    { si: 24, coi: 6, cli: null, cpi: 0, status: 'browse', channel: '朋友推荐', time: d(2025, 5, 25), dup: false },
    { si: 29, coi: 4, cli: null, cpi: 2, status: 'browse', channel: '线上广告', time: d(2025, 2, 5), dup: false },
    { si: 30, coi: 5, cli: null, cpi: 2, status: 'browse', channel: '官网注册', time: d(2025, 3, 28), dup: false },

    // ── Inquiry (22) ──
    { si: 13, coi: 6, cli: null, cpi: 0, status: 'inquiry', channel: '微信公众号', time: d(2025, 1, 15), dup: false },
    { si: 16, coi: 3, cli: null, cpi: 1, status: 'inquiry', channel: '线下推广', time: d(2025, 2, 10), dup: false },
    { si: 1, coi: 0, cli: null, cpi: 0, status: 'inquiry', channel: '朋友推荐', time: d(2025, 1, 10), dup: false },
    { si: 5, coi: 5, cli: null, cpi: 2, status: 'inquiry', channel: '线上广告', time: d(2025, 3, 8), dup: false },
    { si: 14, coi: 2, cli: null, cpi: 1, status: 'inquiry', channel: '微信公众号', time: d(2025, 2, 20), dup: false },
    { si: 15, coi: 1, cli: null, cpi: 0, status: 'inquiry', channel: '官网注册', time: d(2025, 3, 15), dup: false },
    { si: 28, coi: 4, cli: null, cpi: 2, status: 'inquiry', channel: '线下推广', time: d(2025, 2, 18), dup: false },
    { si: 31, coi: 5, cli: null, cpi: 2, status: 'inquiry', channel: '朋友推荐', time: d(2025, 4, 10), dup: false },
    { si: 33, coi: 2, cli: null, cpi: 1, status: 'inquiry', channel: '线上广告', time: d(2025, 3, 5), dup: false },
    { si: 34, coi: 6, cli: null, cpi: 0, status: 'inquiry', channel: '微信公众号', time: d(2025, 4, 15), dup: false },
    { si: 35, coi: 0, cli: null, cpi: 0, status: 'inquiry', channel: '官网注册', time: d(2025, 5, 1), dup: false },
    { si: 36, coi: 4, cli: null, cpi: 2, status: 'inquiry', channel: '线下推广', time: d(2025, 3, 22), dup: false },
    { si: 37, coi: 1, cli: null, cpi: 0, status: 'inquiry', channel: '朋友推荐', time: d(2025, 4, 5), dup: false },
    { si: 38, coi: 3, cli: null, cpi: 1, status: 'inquiry', channel: '线上广告', time: d(2025, 5, 12), dup: false },
    { si: 39, coi: 0, cli: null, cpi: 0, status: 'inquiry', channel: '微信公众号', time: d(2025, 5, 28), dup: false },
    { si: 0, coi: 0, cli: null, cpi: 0, status: 'inquiry', channel: '线下推广', time: d(2025, 1, 8), dup: false },
    { si: 7, coi: 4, cli: null, cpi: 2, status: 'inquiry', channel: '朋友推荐', time: d(2025, 3, 10), dup: false },
    { si: 8, coi: 1, cli: null, cpi: 0, status: 'inquiry', channel: '官网注册', time: d(2025, 4, 22), dup: false },
    { si: 9, coi: 0, cli: null, cpi: 0, status: 'inquiry', channel: '线上广告', time: d(2025, 5, 3), dup: false },
    { si: 21, coi: 6, cli: null, cpi: 0, status: 'inquiry', channel: '微信公众号', time: d(2025, 4, 28), dup: false },
    { si: 22, coi: 1, cli: null, cpi: 0, status: 'inquiry', channel: '线下推广', time: d(2025, 3, 25), dup: false },
    { si: 27, coi: 6, cli: null, cpi: 0, status: 'inquiry', channel: '朋友推荐', time: d(2025, 5, 18), dup: false },

    // ── Duplicate (8) ──
    { si: 2, coi: 0, cli: null, cpi: 0, status: 'browse', channel: '线下推广', time: d(2025, 1, 5), dup: true },
    { si: 3, coi: 0, cli: null, cpi: 0, status: 'browse', channel: '微信公众号', time: d(2025, 1, 8), dup: true },
    { si: 1, coi: 1, cli: null, cpi: 0, status: 'inquiry', channel: '官网注册', time: d(2025, 1, 15), dup: true },
    { si: 0, coi: 2, cli: null, cpi: 1, status: 'browse', channel: '线上广告', time: d(2025, 2, 1), dup: true },
    { si: 14, coi: 4, cli: null, cpi: 2, status: 'inquiry', channel: '朋友推荐', time: d(2025, 2, 10), dup: true },
    { si: 15, coi: 5, cli: null, cpi: 2, status: 'browse', channel: '线下推广', time: d(2025, 3, 1), dup: true },
    { si: 7, coi: 2, cli: null, cpi: 1, status: 'browse', channel: '微信公众号', time: d(2025, 2, 5), dup: true },
    { si: 21, coi: 3, cli: null, cpi: 1, status: 'inquiry', channel: '线上广告', time: d(2025, 1, 8), dup: true },
  ]

  const enrollments: Awaited<ReturnType<typeof prisma.enrollment.create>>[] = []
  for (const e of enrollDefs) {
    enrollments.push(await prisma.enrollment.create({
      data: {
        studentId: st[e.si].id,
        courseId: courses[e.coi].id,
        classId: e.cli !== null ? cls[e.cli].id : null,
        campusId: campuses[e.cpi].id,
        channel: e.channel,
        status: e.status,
        enrollTime: e.time,
        convertedTime: e.convertedTime ?? null,
        isDuplicate: e.dup,
      },
    }))
  }

  // ─── 7. Waitlist Entries ───
  console.log('⏳ 创建候补记录...')

  const waitlistDefs: { si: number; coi: number; cpi: number; pos: number; status: string; channel: string; origTime: Date; convTime?: Date }[] = [
    // course0 (少儿英语启蒙) - 4 waiting + 2 converted
    { si: 10, coi: 0, cpi: 0, pos: 1, status: 'waiting', channel: '线下推广', origTime: d(2025, 4, 5) },
    { si: 11, coi: 0, cpi: 0, pos: 2, status: 'waiting', channel: '微信公众号', origTime: d(2025, 4, 8) },
    { si: 33, coi: 0, cpi: 0, pos: 3, status: 'waiting', channel: '朋友推荐', origTime: d(2025, 4, 12) },
    { si: 34, coi: 0, cpi: 0, pos: 4, status: 'waiting', channel: '官网注册', origTime: d(2025, 5, 3) },
    { si: 29, coi: 0, cpi: 0, pos: 1, status: 'converted', channel: '线下推广', origTime: d(2025, 4, 1), convTime: d(2025, 4, 15) },
    { si: 30, coi: 0, cpi: 0, pos: 2, status: 'converted', channel: '微信公众号', origTime: d(2025, 4, 3), convTime: d(2025, 4, 18) },

    // course4 (钢琴入门) - 4 waiting + 3 converted
    { si: 31, coi: 4, cpi: 2, pos: 1, status: 'waiting', channel: '朋友推荐', origTime: d(2025, 5, 1) },
    { si: 36, coi: 4, cpi: 2, pos: 2, status: 'waiting', channel: '线上广告', origTime: d(2025, 5, 5) },
    { si: 37, coi: 4, cpi: 2, pos: 3, status: 'waiting', channel: '官网注册', origTime: d(2025, 5, 10) },
    { si: 38, coi: 4, cpi: 2, pos: 4, status: 'waiting', channel: '线下推广', origTime: d(2025, 5, 15) },
    { si: 28, coi: 4, cpi: 2, pos: 1, status: 'converted', channel: '微信公众号', origTime: d(2025, 4, 10), convTime: d(2025, 4, 22) },
    { si: 32, coi: 4, cpi: 2, pos: 2, status: 'converted', channel: '朋友推荐', origTime: d(2025, 4, 15), convTime: d(2025, 5, 2) },
    { si: 39, coi: 4, cpi: 2, pos: 3, status: 'converted', channel: '线下推广', origTime: d(2025, 4, 20), convTime: d(2025, 5, 8) },

    // course6 (舞蹈启蒙) - 3 waiting + 2 converted
    { si: 13, coi: 6, cpi: 0, pos: 1, status: 'waiting', channel: '微信公众号', origTime: d(2025, 5, 5) },
    { si: 16, coi: 6, cpi: 0, pos: 2, status: 'waiting', channel: '朋友推荐', origTime: d(2025, 5, 8) },
    { si: 26, coi: 6, cpi: 0, pos: 3, status: 'waiting', channel: '线下推广', origTime: d(2025, 5, 12) },
    { si: 12, coi: 6, cpi: 0, pos: 1, status: 'converted', channel: '官网注册', origTime: d(2025, 4, 12), convTime: d(2025, 4, 28) },
    { si: 27, coi: 6, cpi: 0, pos: 2, status: 'converted', channel: '线上广告', origTime: d(2025, 4, 18), convTime: d(2025, 5, 3) },

    // course3 (创意美术) - 2 waiting + 2 converted
    { si: 25, coi: 3, cpi: 1, pos: 1, status: 'waiting', channel: '线上广告', origTime: d(2025, 5, 18) },
    { si: 35, coi: 3, cpi: 1, pos: 2, status: 'waiting', channel: '线下推广', origTime: d(2025, 5, 22) },
    { si: 30, coi: 3, cpi: 1, pos: 1, status: 'converted', channel: '微信公众号', origTime: d(2025, 4, 25), convTime: d(2025, 5, 10) },
    { si: 34, coi: 3, cpi: 1, pos: 2, status: 'converted', channel: '朋友推荐', origTime: d(2025, 4, 28), convTime: d(2025, 5, 14) },

    // course1 (青少年编程基础) - 2 waiting + 1 converted
    { si: 18, coi: 1, cpi: 0, pos: 1, status: 'waiting', channel: '官网注册', origTime: d(2025, 5, 20) },
    { si: 19, coi: 1, cpi: 0, pos: 2, status: 'waiting', channel: '线上广告', origTime: d(2025, 5, 25) },
    { si: 6, coi: 1, cpi: 0, pos: 1, status: 'converted', channel: '线下推广', origTime: d(2025, 4, 5), convTime: d(2025, 4, 20) },
  ]

  const wle: Awaited<ReturnType<typeof prisma.waitlistEntry.create>>[] = []
  for (const w of waitlistDefs) {
    const waitDays = w.convTime ? daysBetween(w.origTime, w.convTime) : null
    wle.push(await prisma.waitlistEntry.create({
      data: {
        studentId: st[w.si].id,
        courseId: courses[w.coi].id,
        campusId: campuses[w.cpi].id,
        position: w.pos,
        status: w.status,
        channel: w.channel,
        originalEnrollTime: w.origTime,
        convertedTime: w.convTime ?? null,
        waitDays,
      },
    }))
  }

  // ─── 8. Waitlist Adjust Logs ───
  console.log('🔄 创建候补调整日志...')

  const adjustDefs: { wlei: number; opi: number; old: number; newPos: number; reason: string }[] = [
    { wlei: 0, opi: 0, old: 3, newPos: 1, reason: 'VIP客户优先安排' },
    { wlei: 2, opi: 1, old: 4, newPos: 2, reason: '家长强烈诉求' },
    { wlei: 7, opi: 1, old: 3, newPos: 1, reason: '转校生优先' },
    { wlei: 14, opi: 0, old: 2, newPos: 1, reason: '学生时间调整' },
    { wlei: 4, opi: 1, old: 2, newPos: 1, reason: '家长强烈诉求' },
    { wlei: 10, opi: 0, old: 4, newPos: 2, reason: 'VIP客户优先安排' },
    { wlei: 21, opi: 1, old: 2, newPos: 1, reason: '转校生优先' },
  ]
  for (const a of adjustDefs) {
    await prisma.waitlistAdjustLog.create({
      data: {
        entryId: wle[a.wlei].id,
        operatorId: users[a.opi].id,
        oldPosition: a.old,
        newPosition: a.newPos,
        reason: a.reason,
      },
    })
  }

  // ─── 9. Refund Records ───
  console.log('💰 创建退费记录...')

  const refundDefs: { ei: number; si: number; coi: number; reason: string; category: string; amount: number; time: Date }[] = [
    { ei: 0, si: 2, coi: 0, reason: '时间冲突', category: '时间', amount: 1500, time: d(2025, 3, 10) },
    { ei: 2, si: 13, coi: 0, reason: '课程不满意', category: '质量', amount: 2000, time: d(2025, 4, 5) },
    { ei: 5, si: 5, coi: 1, reason: '转学', category: '个人', amount: 3000, time: d(2025, 5, 1) },
    { ei: 7, si: 0, coi: 2, reason: '经济原因', category: '经济', amount: 800, time: d(2025, 5, 15) },
    { ei: 13, si: 14, coi: 4, reason: '健康原因', category: '健康', amount: 500, time: d(2025, 6, 1) },
  ]
  for (const r of refundDefs) {
    await prisma.refundRecord.create({
      data: {
        enrollmentId: enrollments[r.ei].id,
        studentId: st[r.si].id,
        courseId: courses[r.coi].id,
        reason: r.reason,
        category: r.category,
        amount: r.amount,
        refundTime: r.time,
      },
    })
  }

  // ─── Summary ───
  console.log('\n✅ 种子数据创建完成！各表记录数：')
  const counts = {
    campuses: await prisma.campus.count(),
    courses: await prisma.course.count(),
    classes: await prisma.class.count(),
    students: await prisma.student.count(),
    users: await prisma.user.count(),
    enrollments: await prisma.enrollment.count(),
    waitlistEntries: await prisma.waitlistEntry.count(),
    waitlistAdjustLogs: await prisma.waitlistAdjustLog.count(),
    refundRecords: await prisma.refundRecord.count(),
  }
  console.table(counts)

  const enrolledCount = await prisma.enrollment.count({ where: { status: 'enrolled' } })
  const browseCount = await prisma.enrollment.count({ where: { status: 'browse' } })
  const inquiryCount = await prisma.enrollment.count({ where: { status: 'inquiry' } })
  const dupCount = await prisma.enrollment.count({ where: { isDuplicate: true } })
  const waitingCount = await prisma.waitlistEntry.count({ where: { status: 'waiting' } })
  const convertedCount = await prisma.waitlistEntry.count({ where: { status: 'converted' } })
  const minorCount = await prisma.student.count({ where: { isMinor: true } })

  console.log('\n📊 数据分布：')
  console.log(`  报名状态: enrolled=${enrolledCount}, inquiry=${inquiryCount}, browse=${browseCount}, duplicate=${dupCount}`)
  console.log(`  候补状态: waiting=${waitingCount}, converted=${convertedCount}`)
  console.log(`  学生类型: 未成年人=${minorCount}, 成人=${counts.students - minorCount}`)
}

main()
  .catch((e) => {
    console.error('❌ 种子脚本执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
