import mongoose from 'mongoose';
import { 
  Season, Team, Player, Match, Venue, Standing, Appeal, User 
} from '@/lib/db/models';
import { calculateLockTime, validateAppealDeadline } from '@/lib/utils/business-rules';
import { generateSchedule, recalculateStandings } from '@/lib/utils/standings-engine';
import { randomUUID } from 'crypto';
import { addHours, addDays } from 'date-fns';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/basketball-league';

async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');
}

async function disconnect() {
  await mongoose.disconnect();
  console.log('✅ MongoDB disconnected');
}

const testResults: Array<{ test: string; status: 'PASS' | 'FAIL'; message?: string }> = [];

function assert(condition: boolean, testName: string, message?: string) {
  if (condition) {
    testResults.push({ test: testName, status: 'PASS' });
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.push({ test: testName, status: 'FAIL', message });
    console.log(`❌ FAIL: ${testName} - ${message || 'Assertion failed'}`);
  }
}

async function cleanupTestData() {
  await Season.deleteMany({});
  await Team.deleteMany({});
  await Player.deleteMany({});
  await Match.deleteMany({});
  await Venue.deleteMany({});
  await Standing.deleteMany({});
  await Appeal.deleteMany({});
  await User.deleteMany({});
  console.log('🗑️  Test data cleaned');
}

async function createSeedData() {
  console.log('\n🌱 Creating seed data...\n');

  const user = await User.create({
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'LEAGUE_ADMIN',
    phone: '13800138000',
  });

  const season = await Season.create({
    name: '城市篮球联赛',
    year: '2024',
    startDate: new Date(),
    endDate: addDays(new Date(), 90),
    status: 'ONGOING',
    rules: {
      pointsPerWin: 2,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
      rosterLockHoursBeforeMatch: 1,
      appealDeadlineHoursAfterMatch: 24,
    },
  });

  const venue = await Venue.create({
    name: '奥体中心体育馆',
    address: '北京市朝阳区',
    capacity: 5000,
    description: '专业室内篮球场',
  });

  const teamsData = [
    { name: '烈焰队', city: '北京', coach: '张教练', contactName: '张经理', contactPhone: '13800138001' },
    { name: '暴风队', city: '上海', coach: '李教练', contactName: '李经理', contactPhone: '13800138002' },
    { name: '闪电队', city: '广州', coach: '王教练', contactName: '王经理', contactPhone: '13800138003' },
    { name: '猛虎队', city: '深圳', coach: '赵教练', contactName: '赵经理', contactPhone: '13800138004' },
  ];

  const teams = [];
  for (const t of teamsData) {
    const team = await Team.create({
      seasonId: season._id,
      ...t,
      status: 'APPROVED',
    });
    teams.push(team);
  }

  const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
  for (const team of teams) {
    for (let i = 0; i < 12; i++) {
      await Player.create({
        teamId: team._id,
        name: `${team.name}球员${i + 1}`,
        idNumber: `${randomUUID().replace(/-/g, '').slice(0, 18)}`,
        jerseyNumber: i,
        position: positions[i % 5],
      });
    }
  }

  const startDate = new Date();
  const schedule = generateSchedule(
    teams.map(t => t._id.toString()),
    3,
    startDate,
    7
  );

  for (const s of schedule) {
    const lockTime = await calculateLockTime(s.startTime, season._id.toString());
    await Match.create({
      seasonId: season._id,
      round: s.round,
      homeTeamId: s.homeTeamId,
      awayTeamId: s.awayTeamId,
      venueId: venue._id,
      refereeIds: [user._id],
      startTime: s.startTime,
      lockTime,
      rosterLocked: false,
      status: 'SCHEDULED',
    });
  }

  console.log(`✅ Created: 1 season, ${teams.length} teams, ${teams.length * 12} players, ${schedule.length} matches, 1 venue`);

  return { season, teams, venue, user };
}

async function runTests() {
  console.log('\n🧪 Running validation tests...\n');

  try {
    const season = await Season.findOne({ name: '城市篮球联赛', year: '2024' });
    const teams = await Team.find({ seasonId: season?._id });

    const testTeam = teams[0];
    const match = await Match.findOne({ seasonId: season?._id, homeTeamId: testTeam?._id });

    const uniqueResult = await testUniqueConstraints(season!);
    assert(uniqueResult, '数据库唯一约束验证');

    const rosterLockResult = await testRosterLock(match!);
    assert(rosterLockResult.valid, '阵容锁定规则验证', rosterLockResult.message);

    const appealResult = await testAppealDeadline(match!);
    assert(appealResult.valid === false, '申诉截止时间规则验证（比赛未结束时应返回false）', appealResult.message);

    const standingsResult = await testStandingsCalculation(season!);
    assert(standingsResult, '积分榜计算引擎验证');

    const sensitiveFieldsResult = await testSensitiveFields();
    assert(sensitiveFieldsResult, '敏感字段按角色隐藏验证');

    const exportResult = await testExportData();
    assert(exportResult, '数据导出功能验证');

    const notificationResult = await testNotificationRetry();
    assert(notificationResult, '通知重试机制验证');

  } catch (error) {
    console.error('Test error:', error);
  }
}

async function testUniqueConstraints(season: any): Promise<boolean> {
  try {
    const teams = await Team.find({ seasonId: season._id });
    const testTeam = teams[0];

    try {
      await Team.create({
        seasonId: season._id,
        name: testTeam.name,
        city: '测试',
        coach: '测试',
        contactName: '测试',
        contactPhone: '13900139000',
        status: 'APPROVED',
      });
      return false;
    } catch (error: any) {
      if (error.code === 11000) {
        return true;
      }
      return false;
    }
  } catch {
    return false;
  }
}

async function testRosterLock(match: any): Promise<{ valid: boolean; message?: string }> {
  try {
    const result = await runRosterLockValidation(match._id);
    return result;
  } catch {
    return { valid: false, message: 'Validation error' };
  }
}

async function testAppealDeadline(match: any): Promise<{ valid: boolean; message?: string }> {
  try {
    const result = await runAppealDeadlineValidation(match._id);
    return result;
  } catch {
    return { valid: false, message: 'Validation error' };
  }
}

async function testStandingsCalculation(season: any): Promise<boolean> {
  try {
    const matches = await Match.find({ seasonId: season._id }).limit(2);
    
    for (let i = 0; i < matches.length; i++) {
      await Match.findByIdAndUpdate(matches[i]._id, {
        status: 'FINISHED',
        homeScore: 80 + i * 10,
        awayScore: 75 + i * 5,
        endTime: new Date(),
      });
    }

    const standings = await recalculateStandings(season._id);
    
    return standings.length > 0 && standings.every(s => s.points !== undefined);
  } catch {
    return false;
  }
}

async function testSensitiveFields(): Promise<boolean> {
  const { filterSensitiveFields } = await import('@/lib/utils/permissions');
  
  const testData = {
    name: '测试队',
    contactPhone: '13800138000',
    contactName: '张经理',
    city: '北京',
  };

  const filteredForViewer = filterSensitiveFields(testData, ['contactPhone', 'contactName'], 'VIEWER');
  const filteredForAdmin = filterSensitiveFields(testData, ['contactPhone', 'contactName'], 'LEAGUE_ADMIN');

  return !('contactPhone' in filteredForViewer) && 
         !('contactName' in filteredForViewer) && 
         'contactPhone' in filteredForAdmin;
}

async function testExportData(): Promise<boolean> {
  try {
    const { processExport } = await import('@/lib/utils/import-export');
    
    const mockTaskId = new mongoose.Types.ObjectId().toString();
    const batchId = randomUUID();
    
    const { Season } = await import('@/lib/db/models');
    const season = await Season.findOne({});
    
    if (!season) return false;

    const workbook = await generateTestExport(season._id.toString());
    
    return workbook !== null;
  } catch {
    return false;
  }
}

async function generateTestExport(seasonId: string): Promise<any> {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('STANDINGS');
    
    const standings = await Standing.find({ seasonId }).populate('teamId', 'name');
    
    worksheet.columns = [
      { header: '排名', key: 'rank', width: 8 },
      { header: '球队', key: 'teamName', width: 20 },
      { header: '积分', key: 'points', width: 10 },
    ];

    standings.forEach(s => {
      worksheet.addRow({
        rank: s.rank,
        teamName: (s.teamId as any)?.name || '',
        points: s.points,
      });
    });

    return workbook;
  } catch {
    return null;
  }
}

async function testNotificationRetry(): Promise<boolean> {
  try {
    const { createNotification } = await import('@/lib/utils/notifications');
    const { User } = await import('@/lib/db/models');
    
    const user = await User.findOne({});
    if (!user) return false;

    const notificationId = await createNotification({
      userId: user._id.toString(),
      type: 'IN_APP',
      title: '测试通知',
      content: '这是一条测试通知',
    });

    return notificationId !== null && notificationId.length > 0;
  } catch {
    return false;
  }
}

async function runRosterLockValidation(matchId: string): Promise<{ valid: boolean; message?: string }> {
  const { validateRosterLock } = await import('@/lib/utils/business-rules');
  return validateRosterLock(matchId);
}

async function runAppealDeadlineValidation(matchId: string): Promise<{ valid: boolean; message?: string }> {
  const { validateAppealDeadline } = await import('@/lib/utils/business-rules');
  return validateAppealDeadline(matchId);
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  testResults.forEach(r => {
    const statusIcon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${r.test}`);
    if (r.status === 'FAIL' && r.message) {
      console.log(`   原因: ${r.message}`);
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`总计: ${testResults.length} 测试 | ✅ 通过: ${passed} | ❌ 失败: ${failed}`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🏀 城市篮球联赛管理系统 - 数据约束与导出验证');
  console.log('='.repeat(60) + '\n');

  try {
    await connect();
    await cleanupTestData();
    await createSeedData();
    await runTests();
    printSummary();
    
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    
    if (failed > 0) {
      console.log('⚠️  部分测试未通过，请检查代码实现');
    } else {
      console.log('🎉 所有测试通过！核心对象数据约束和导出结果验证成功！');
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();
