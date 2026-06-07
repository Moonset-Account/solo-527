import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SPORTS = ['篮球', '足球', '田径', '游泳', '网球'];
const POSITIONS = ['前锋', '中场', '后卫', '守门员', '短跑', '中长跑', '自由泳', '蛙泳', '单打', '双打'];
const SESSION_TYPES = ['力量训练', '有氧训练', '技术训练', '比赛', '恢复训练', '速度训练'];
const EXERCISES = ['深蹲', '卧推', '硬拉', '引体向上', '俯卧撑', '箭步蹲', '平板支撑', '跳绳'];
const INJURY_TYPES = ['肌肉拉伤', '韧带扭伤', '骨折', '挫伤', '腱鞘炎', '疲劳性损伤'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, places: number = 1): number {
  const factor = Math.pow(10, places);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date;
}

function pickRandom<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

async function main() {
  console.log('🌱 开始生成种子数据...');

  await prisma.etlLog.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.injuryRecord.deleteMany();
  await prisma.strengthData.deleteMany();
  await prisma.recoveryData.deleteMany();
  await prisma.trainingData.deleteMany();
  await prisma.user.deleteMany();
  await prisma.athlete.deleteMany();

  console.log('🗑️  已清空旧数据');

  const coachPasswordHash = await bcrypt.hash('demo123', 10);

  const coach = await prisma.user.create({
    data: {
      email: 'coach@demo.com',
      passwordHash: coachPasswordHash,
      role: 'coach',
      name: '李教练',
    },
  });
  console.log('✅ 已创建教练账号');

  const athleteNames = [
    { name: '张伟', sport: '篮球', position: '前锋' },
    { name: '李娜', sport: '篮球', position: '后卫' },
    { name: '王强', sport: '足球', position: '中场' },
    { name: '刘洋', sport: '足球', position: '前锋' },
    { name: '陈静', sport: '田径', position: '短跑' },
    { name: '赵磊', sport: '游泳', position: '自由泳' },
    { name: '孙悦', sport: '网球', position: '单打' },
    { name: '周明', sport: '田径', position: '中长跑' },
  ];

  const athletes: { id: string; name: string; sport: string }[] = [];

  for (const aData of athleteNames) {
    const athlete = await prisma.athlete.create({
      data: {
        name: aData.name,
        sport: aData.sport,
        position: aData.position,
        team: '一队',
        birthDate: new Date(1995 + randomInt(0, 8), randomInt(0, 11), randomInt(1, 28)),
      },
    });
    athletes.push(athlete);
  }
  console.log(`✅ 已创建 ${athletes.length} 名队员`);

  const athletePasswordHash = await bcrypt.hash('demo123', 10);
  for (let i = 0; i < 2; i++) {
    await prisma.user.create({
      data: {
        email: `athlete${i + 1}@demo.com`,
        passwordHash: athletePasswordHash,
        role: 'athlete',
        name: athletes[i].name,
        athleteId: athletes[i].id,
      },
    });
  }
  console.log('✅ 已创建队员账号');

  for (const athlete of athletes) {
    const trainingPromises = [];
    for (let i = 0; i < randomInt(20, 35); i++) {
      const date = randomDate(30);
      const sessionType = pickRandom(SESSION_TYPES);
      const durationMin = randomInt(45, 120);
      const loadScore = Math.round(durationMin * randomInt(3, 8) * 0.1 * 10);

      trainingPromises.push(
        prisma.trainingData.create({
          data: {
            athleteId: athlete.id,
            date,
            sessionType,
            durationMin,
            avgHeartRate: randomInt(120, 170),
            maxHeartRate: randomInt(160, 200),
            paceKmPerH: sessionType === '有氧训练' ? randomDecimal(8, 15, 2) : null,
            distanceKm: sessionType === '有氧训练' ? randomDecimal(3, 12, 2) : null,
            loadScore,
            rpe: randomInt(5, 10),
            source: 'garmin',
          },
        })
      );
    }
    await Promise.all(trainingPromises);

    const strengthPromises = [];
    for (let i = 0; i < randomInt(8, 15); i++) {
      const date = randomDate(30);
      const exercise = pickRandom(EXERCISES);
      const weightKg = randomDecimal(20, 120, 1);
      const reps = randomInt(3, 12);
      const sets = randomInt(3, 5);

      strengthPromises.push(
        prisma.strengthData.create({
          data: {
            athleteId: athlete.id,
            date,
            exercise,
            weightKg,
            reps,
            sets,
            estimated1Rm: Math.round(weightKg * (1 + reps / 30) * 10) / 10,
          },
        })
      );
    }
    await Promise.all(strengthPromises);

    const recoveryPromises = [];
    for (let i = 0; i < randomInt(15, 25); i++) {
      const date = randomDate(30);
      const sleepScore = randomInt(50, 95);
      const sorenessScore = randomInt(60, 100);
      const overallScore = Math.round((sleepScore + sorenessScore + randomInt(60, 90)) / 3);

      recoveryPromises.push(
        prisma.recoveryData.create({
          data: {
            athleteId: athlete.id,
            date,
            sleepScore,
            hrv: randomInt(40, 80),
            sorenessScore,
            moodScore: randomInt(60, 95),
            overallScore,
            source: 'whoop',
          },
        })
      );
    }
    await Promise.all(recoveryPromises);

    if (randomInt(0, 10) > 6) {
      await prisma.injuryRecord.create({
        data: {
          athleteId: athlete.id,
          date: randomDate(20),
          injuryType: pickRandom(INJURY_TYPES),
          severity: pickRandom(['轻度', '中度', '重度']),
          description: '训练中出现的运动损伤，需要观察和治疗',
          notes: '建议减少高强度训练，配合物理治疗',
          status: pickRandom(['active', 'recovering', 'resolved']),
        },
      });
    }
  }
  console.log('✅ 已生成训练、力量、恢复和伤病数据');

  const defaultFilters = {
    athletes: [],
    sports: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    timeWindow: 'week',
    exercises: [],
    metrics: ['loadScore', 'avgHeartRate', 'distanceKm'],
  };

  await prisma.filterPreset.create({
    data: {
      userId: coach.id,
      name: '默认视图',
      isDefault: true,
      filters: JSON.stringify(defaultFilters),
    },
  });
  console.log('✅ 已创建默认筛选组合');

  await prisma.etlLog.create({
    data: {
      source: 'seed',
      status: 'completed',
      recordsProcessed: await prisma.trainingData.count() + await prisma.strengthData.count() + await prisma.recoveryData.count(),
    },
  });

  console.log('🎉 种子数据生成完成！');
  console.log('');
  console.log('🔑 演示账号：');
  console.log('   教练组: coach@demo.com / demo123');
  console.log('   队员:   athlete1@demo.com / demo123');
  console.log('           athlete2@demo.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
