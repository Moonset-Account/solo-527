import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { EtlPipeline } from './api/lib/etl';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据库...');

  console.log('\n1️⃣  创建教练和队员账号...');
  const coachPassword = await bcrypt.hash('coach123', 10);
  const athletePassword = await bcrypt.hash('athlete123', 10);

  const coach = await prisma.user.upsert({
    where: { email: 'coach@example.com' },
    update: {},
    create: {
      email: 'coach@example.com',
      passwordHash: coachPassword,
      role: 'coach',
      name: '王教练',
    },
  });
  console.log(`   ✅ 教练账号: coach@example.com / coach123`);

  const athlete1 = await prisma.athlete.upsert({
    where: { id: 'athlete-001' },
    update: {},
    create: {
      id: 'athlete-001',
      name: '张三',
      sport: '田径',
      team: '国家队',
      position: '短跑',
    },
  });

  const athlete2 = await prisma.athlete.upsert({
    where: { id: 'athlete-002' },
    update: {},
    create: {
      id: 'athlete-002',
      name: '李四',
      sport: '游泳',
      team: '省队',
      position: '自由泳',
    },
  });

  await prisma.user.upsert({
    where: { email: 'zhangsan@example.com' },
    update: {},
    create: {
      email: 'zhangsan@example.com',
      passwordHash: athletePassword,
      role: 'athlete',
      name: '张三',
      athleteId: athlete1.id,
    },
  });
  console.log(`   ✅ 队员账号: zhangsan@example.com / athlete123`);

  console.log('\n2️⃣  导入原始训练数据（含好数据和坏数据）...');
  const trainingRawData = [
    {
      athleteId: athlete1.id,
      date: '2026-06-01',
      sessionType: '有氧训练',
      durationMin: 60,
      avgHeartRate: 155,
      maxHeartRate: 175,
      paceKmPerH: 10.5,
      distanceKm: 10.5,
      loadScore: 450,
      rpe: 7,
      source: 'gps_pod',
    },
    {
      athleteId: athlete1.id,
      date: '2026-06-02',
      sessionType: '力量训练',
      durationMin: 90,
      avgHeartRate: 130,
      maxHeartRate: 160,
      loadScore: 520,
      rpe: 8,
      source: 'gym_log',
    },
    {
      athleteId: athlete1.id,
      date: '2026-06-03',
      sessionType: '有氧训练',
      durationMin: 45,
      avgHeartRate: 145,
      paceKmPerH: 11.2,
      distanceKm: 8.4,
      loadScore: 380,
      source: 'gps_pod',
    },
    {
      athleteId: athlete2.id,
      date: '2026-06-01',
      sessionType: '水上训练',
      durationMin: 120,
      avgHeartRate: 140,
      maxHeartRate: 170,
      distanceKm: 3.2,
      loadScore: 680,
      rpe: 9,
      source: 'swim_watch',
    },
    {
      athleteId: athlete2.id,
      date: '2026-06-02',
      sessionType: '力量训练',
      durationMin: 75,
      avgHeartRate: 125,
      loadScore: 420,
      source: 'gym_log',
    },
    {
      athleteName: '王五',
      date: '2026-06-03',
      sessionType: '有氧训练',
      durationMin: 50,
      avgHeartRate: 150,
      paceKmPerH: 9.8,
      distanceKm: 8.2,
      loadScore: 400,
      sport: '足球',
      team: '俱乐部',
    },
    {
      athleteId: athlete1.id,
      date: '2026-06-04',
      sessionType: '间歇训练',
      durationMin: 0,
      avgHeartRate: 165,
      loadScore: -10,
      source: 'bad_data',
    },
    {
      date: '2026-06-05',
      sessionType: '有氧训练',
      durationMin: 60,
      loadScore: 450,
    },
    {
      athleteId: athlete1.id,
      sessionType: '有氧训练',
      durationMin: 60,
      avgHeartRate: 155,
      loadScore: 450,
    },
  ];

  const trainingImport = await EtlPipeline.importRawRecords(
    'training',
    trainingRawData,
    '种子数据_训练'
  );
  console.log(`   ✅ 导入训练原始数据: ${trainingImport.imported} 条`);
  console.log(`      - 正常数据: 6 条`);
  console.log(`      - 缺运动员: 1 条`);
  console.log(`      - 缺日期: 1 条`);
  console.log(`      - 字段非法: 1 条 (时长<=0, loadScore<0)`);
  console.log(`      - 自动创建新运动员: 王五 (足球)`);

  console.log('\n3️⃣  导入原始力量数据...');
  const strengthRawData = [
    {
      athleteId: athlete1.id,
      date: '2026-06-01',
      exercise: '深蹲',
      weightKg: 80,
      reps: 8,
      sets: 4,
      notes: '状态良好',
    },
    {
      athleteId: athlete1.id,
      date: '2026-06-03',
      exercise: '卧推',
      weightKg: 60,
      reps: 10,
      sets: 3,
    },
    {
      athleteId: athlete2.id,
      date: '2026-06-02',
      exercise: '硬拉',
      weightKg: 100,
      reps: 5,
      sets: 3,
      notes: 'PB达成!',
    },
    {
      athleteId: athlete2.id,
      date: '2026-06-04',
      exercise: '引体向上',
      weightKg: 0,
      reps: 12,
      sets: 4,
    },
    {
      exercise: '深蹲',
      weightKg: 80,
      reps: 8,
      sets: 4,
    },
  ];

  const strengthImport = await EtlPipeline.importRawRecords(
    'strength',
    strengthRawData,
    '种子数据_力量'
  );
  console.log(`   ✅ 导入力量原始数据: ${strengthImport.imported} 条`);
  console.log(`      - 正常数据: 4 条`);
  console.log(`      - 缺运动员+日期: 1 条`);

  console.log('\n4️⃣  导入原始恢复数据...');
  const recoveryRawData = [
    {
      athleteId: athlete1.id,
      date: '2026-06-01',
      sleepScore: 85,
      hrv: 65,
      sorenessScore: 20,
      moodScore: 80,
      overallScore: 78,
      source: 'oura_ring',
    },
    {
      athleteId: athlete1.id,
      date: '2026-06-02',
      sleepScore: 70,
      hrv: 55,
      sorenessScore: 45,
      moodScore: 65,
      overallScore: 62,
      source: 'oura_ring',
    },
    {
      athleteId: athlete2.id,
      date: '2026-06-01',
      sleepScore: 90,
      hrv: 72,
      sorenessScore: 15,
      moodScore: 90,
      overallScore: 88,
      source: 'whoop',
    },
    {
      athleteId: athlete1.id,
      date: '2026-06-03',
      overallScore: 70,
      source: 'manual',
    },
    {
      athleteId: athlete2.id,
      date: '2026-06-03',
    },
  ];

  const recoveryImport = await EtlPipeline.importRawRecords(
    'recovery',
    recoveryRawData,
    '种子数据_恢复'
  );
  console.log(`   ✅ 导入恢复原始数据: ${recoveryImport.imported} 条`);
  console.log(`      - 完整数据: 3 条`);
  console.log(`      - 缺睡眠/HRV等: 1 条 (只有总评分)`);
  console.log(`      - 缺总评分: 1 条 (将失败)`);

  console.log('\n5️⃣  导入原始伤病数据...');
  const injuryRawData = [
    {
      athleteId: athlete1.id,
      date: '2026-05-20',
      injuryType: '肌肉拉伤',
      severity: 'mild',
      description: '左腿腘绳肌轻度拉伤',
      notes: '需要休息5-7天，配合理疗',
      status: 'recovered',
      returnDate: '2026-05-28',
    },
    {
      athleteId: athlete2.id,
      date: '2026-06-01',
      injuryType: '肩关节劳损',
      severity: 'moderate',
      description: '右肩过度使用导致炎症',
      notes: '减少上肢力量训练，增加灵活性练习',
      status: 'active',
    },
    {
      athleteId: athlete1.id,
      injuryType: '脚踝扭伤',
      description: '训练中意外扭伤',
    },
  ];

  const injuryImport = await EtlPipeline.importRawRecords(
    'injury',
    injuryRawData,
    '种子数据_伤病'
  );
  console.log(`   ✅ 导入伤病原始数据: ${injuryImport.imported} 条`);
  console.log(`      - 完整数据: 2 条`);
  console.log(`      - 缺日期: 1 条 (将失败)`);

  console.log('\n6️⃣  执行 ETL 管道...');
  const etl = new EtlPipeline('seed_script');
  const result = await etl.run();

  console.log(`   ✅ ETL 执行完成:`);
  console.log(`      - 抽取: ${result.recordsExtracted} 条`);
  console.log(`      - 校验通过: ${result.recordsValidated} 条`);
  console.log(`      - 加载成功: ${result.recordsLoaded} 条`);
  console.log(`      - 处理失败: ${result.recordsFailed} 条`);
  console.log(`      - 状态: ${result.success ? '成功' : '部分失败'}`);

  if (Object.keys(result.missingFields).length > 0) {
    console.log(`\n   ⚠️  字段缺失统计:`);
    for (const [field, count] of Object.entries(result.missingFields)) {
      console.log(`      - ${field}: ${count} 条`);
    }
  }

  console.log('\n7️⃣  验证数据质量状态...');
  const quality = await EtlPipeline.getDataQualityStatus();
  console.log(`   📊 数据质量状态: ${quality.status.toUpperCase()}`);
  console.log(`   📈 样本量:`);
  console.log(`      - 训练: ${quality.sampleSizes.training}`);
  console.log(`      - 力量: ${quality.sampleSizes.strength}`);
  console.log(`      - 恢复: ${quality.sampleSizes.recovery}`);
  console.log(`      - 伤病: ${quality.sampleSizes.injuries}`);
  console.log(`      - 队员: ${quality.sampleSizes.athletes}`);
  console.log(`   ⚙️  ETL 状态: ${quality.etlStatus}`);

  if (quality.pendingRawRecords) {
    console.log(`   ⏳ 待处理原始数据: ${quality.pendingRawRecords} 条`);
  }
  if (quality.failedRawRecords) {
    console.log(`   ❌ 处理失败: ${quality.failedRawRecords} 条`);
  }
  if (quality.warnings.length > 0) {
    console.log(`   ⚠️  警告:`);
    quality.warnings.forEach(w => console.log(`      - ${w}`));
  }
  if (quality.missingFields) {
    console.log(`   📉 字段缺失:`);
    console.log(`      - 训练心率: ${quality.missingFields.trainingHeartRate}`);
    console.log(`      - 有氧配速: ${quality.missingFields.trainingPace}`);
    console.log(`      - 睡眠评分: ${quality.missingFields.recoverySleep}`);
    console.log(`      - 力量1RM: ${quality.missingFields.strength1Rm}`);
  }

  console.log('\n✅ 数据库初始化完成!');
  console.log('\n📝 测试账号:');
  console.log('   教练: coach@example.com / coach123');
  console.log('   队员: zhangsan@example.com / athlete123');
  console.log('\n🚀 现在可以启动服务进行测试了!');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
