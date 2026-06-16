const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_COUNSELORS = [
  {
    name: '张医生',
    title: '主任医师',
    specialty: '焦虑抑郁、情绪管理',
    avatar: null,
  },
  {
    name: '李医生',
    title: '副主任医师',
    specialty: '青少年心理、亲子关系',
    avatar: null,
  },
  {
    name: '王医生',
    title: '心理咨询师',
    specialty: '婚姻家庭、职场压力',
    avatar: null,
  },
  {
    name: '赵医生',
    title: '心理治疗师',
    specialty: '睡眠障碍、创伤修复',
    avatar: null,
  },
  {
    name: '陈医生',
    title: '高级心理咨询师',
    specialty: '个人成长、自我探索',
    avatar: null,
  },
];

async function main() {
  console.log('开始初始化咨询师数据...');

  const existing = await prisma.counselor.count();
  if (existing > 0) {
    console.log(`数据库中已存在 ${existing} 位咨询师，跳过初始化。`);
    return;
  }

  for (const c of DEFAULT_COUNSELORS) {
    const created = await prisma.counselor.create({ data: c });
    console.log(`  ✓ 已创建：${created.name}（${created.title}）`);
  }

  console.log(`\n初始化完成，共创建 ${DEFAULT_COUNSELORS.length} 位咨询师。`);
  console.log('\n提示：前往 /admin/timeslots 为每位咨询师创建可约时段。');
}

main()
  .catch((e) => {
    console.error('初始化失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
