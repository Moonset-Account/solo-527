import mongoose from 'mongoose';
import { 
  Season, Team, Player, Match, Venue, User 
} from '@/lib/db/models';
import { addDays, addHours } from 'date-fns';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/basketball-league';

async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');
}

async function disconnect() {
  await mongoose.disconnect();
  console.log('✅ MongoDB disconnected');
}

async function cleanupData() {
  await Season.deleteMany({});
  await Team.deleteMany({});
  await Player.deleteMany({});
  await Match.deleteMany({});
  await Venue.deleteMany({});
  await User.deleteMany({});
  console.log('🗑️  Existing data cleaned');
}

async function createSeedData() {
  console.log('\n🌱 Creating seed data...\n');

  const seasonId = new mongoose.Types.ObjectId('60d21b4667d0d8992e610c80');
  const teamIds = [
    new mongoose.Types.ObjectId('60d21b4667d0d8992e610c81'),
    new mongoose.Types.ObjectId('60d21b4667d0d8992e610c82'),
    new mongoose.Types.ObjectId('60d21b4667d0d8992e610c83'),
    new mongoose.Types.ObjectId('60d21b4667d0d8992e610c84'),
  ];
  const venueIds = [
    new mongoose.Types.ObjectId('60d21b4667d0d8992e610c85'),
    new mongoose.Types.ObjectId('60d21b4667d0d8992e610c86'),
  ];
  const refereeIds = [
    new mongoose.Types.ObjectId('60d21b4667d0d8992e610c87'),
    new mongoose.Types.ObjectId('60d21b4667d0d8992e610c88'),
  ];

  const season = await Season.create({
    _id: seasonId,
    name: '2024城市篮球联赛',
    year: '2024',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    status: 'ONGOING',
    rules: {
      pointsPerWin: 2,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
      rosterLockHoursBeforeMatch: 1,
      appealDeadlineHoursAfterMatch: 24,
    },
  });
  console.log('✅ Created season:', season.name);

  const teamsData = [
    { _id: teamIds[0], name: '猛虎队', city: '北京', coach: '张教练', contactName: '张经理', contactPhone: '13800138001', logo: '', status: 'APPROVED' as const },
    { _id: teamIds[1], name: '飞鹰队', city: '上海', coach: '李教练', contactName: '李经理', contactPhone: '13800138002', logo: '', status: 'APPROVED' as const },
    { _id: teamIds[2], name: '闪电队', city: '广州', coach: '王教练', contactName: '王经理', contactPhone: '13800138003', logo: '', status: 'APPROVED' as const },
    { _id: teamIds[3], name: '暴风队', city: '深圳', coach: '赵教练', contactName: '赵经理', contactPhone: '13800138004', logo: '', status: 'APPROVED' as const },
  ];

  const teams = [];
  for (const t of teamsData) {
    const team = await Team.create({
      ...t,
      seasonId: season._id,
      registeredAt: new Date(),
    });
    teams.push(team);
    console.log('✅ Created team:', team.name);
  }

  const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
  const playerNames = [
    ['张小明', '李大伟', '王强', '赵磊', '孙浩', '周杰', '吴涛', '郑凯'],
    ['陈华', '林峰', '黄强', '杨勇', '周明', '吴亮', '徐伟', '孙杰'],
    ['马超', '黄磊', '周涛', '吴鹏', '郑伟', '王磊', '李涛', '张强'],
    ['刘军', '陈杰', '杨明', '黄涛', '赵强', '孙伟', '周凯', '吴明'],
  ];

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const names = playerNames[i];
    for (let j = 0; j < 8; j++) {
      const playerId = new mongoose.Types.ObjectId();
      await Player.create({
        _id: playerId,
        teamId: team._id,
        name: names[j],
        idNumber: `ID${team._id.toString().slice(-8)}${(j + 1).toString().padStart(2, '0')}`,
        jerseyNumber: j + 1,
        position: positions[j % 5],
        dateOfBirth: new Date(`1995-0${(j % 9) + 1}-${(j % 28) + 1}`),
      });
    }
    console.log(`✅ Created 8 players for ${team.name}`);
  }

  const venuesData = [
    { _id: venueIds[0], name: '首都体育馆', address: '北京市海淀区中关村南大街54号', capacity: 18000, description: '北京最大的室内体育馆' },
    { _id: venueIds[1], name: '上海东方体育中心', address: '上海市浦东新区泳耀路300号', capacity: 15000, description: '上海现代化体育场馆' },
  ];

  const venues = [];
  for (const v of venuesData) {
    const venue = await Venue.create(v);
    venues.push(venue);
    console.log('✅ Created venue:', venue.name);
  }

  const refereesData = [
    { _id: refereeIds[0], email: 'referee1@league.com', name: '王裁判', role: 'REFEREE' as const, phone: '13900139001', avatar: '' },
    { _id: refereeIds[1], email: 'referee2@league.com', name: '李裁判', role: 'REFEREE' as const, phone: '13900139002', avatar: '' },
  ];

  const referees = [];
  for (const r of refereesData) {
    const referee = await User.create(r);
    referees.push(referee);
    console.log('✅ Created referee:', referee.name);
  }

  const baseDate = new Date('2024-03-01');
  const matchesData = [
    {
      _id: new mongoose.Types.ObjectId('60d21b4667d0d8992e610c90'),
      round: 1,
      homeTeamId: teamIds[0],
      awayTeamId: teamIds[1],
      venueId: venueIds[0],
      startTime: addHours(baseDate, 19),
    },
    {
      _id: new mongoose.Types.ObjectId('60d21b4667d0d8992e610c91'),
      round: 1,
      homeTeamId: teamIds[2],
      awayTeamId: teamIds[3],
      venueId: venueIds[1],
      startTime: addHours(baseDate, 19),
    },
    {
      _id: new mongoose.Types.ObjectId('60d21b4667d0d8992e610c92'),
      round: 2,
      homeTeamId: teamIds[0],
      awayTeamId: teamIds[2],
      venueId: venueIds[0],
      startTime: addHours(addDays(baseDate, 7), 19),
    },
  ];

  for (const m of matchesData) {
    const lockTime = addHours(m.startTime, -1);
    const match = await Match.create({
      ...m,
      seasonId: season._id,
      refereeIds: refereeIds,
      startTime: m.startTime,
      lockTime,
      rosterLocked: false,
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0,
    });
    console.log(`✅ Created match: Round ${match.round} - ${teams.find(t => t._id.equals(m.homeTeamId))?.name} vs ${teams.find(t => t._id.equals(m.awayTeamId))?.name}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Seed Data Summary');
  console.log('='.repeat(60));
  console.log(`✅ Season: 1`);
  console.log(`✅ Teams: ${teams.length}`);
  console.log(`✅ Players: ${teams.length * 8}`);
  console.log(`✅ Venues: ${venues.length}`);
  console.log(`✅ Matches: ${matchesData.length}`);
  console.log(`✅ Referees: ${referees.length}`);
  console.log('='.repeat(60));
  console.log('🎉 Seed data creation completed successfully!');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🏀 Basketball League - Seed Data Script');
  console.log('='.repeat(60));

  try {
    await connect();
    await cleanupData();
    await createSeedData();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();
