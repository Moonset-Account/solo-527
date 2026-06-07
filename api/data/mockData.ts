import type { Athlete, TrainingData, StrengthData, RecoveryData, InjuryRecord, User } from '@shared/types';
import { addDays, formatISO, subDays } from 'date-fns';

const ATHLETE_NAMES = [
  { name: '李明', sport: '篮球', position: '控球后卫', team: '一队' },
  { name: '王强', sport: '篮球', position: '中锋', team: '一队' },
  { name: '张伟', sport: '篮球', position: '前锋', team: '一队' },
  { name: '刘洋', sport: '足球', position: '中场', team: '二队' },
  { name: '陈杰', sport: '足球', position: '后卫', team: '二队' },
  { name: '赵磊', sport: '田径', position: '短跑', team: '三队' },
  { name: '孙鹏', sport: '游泳', position: '自由泳', team: '三队' },
  { name: '周涛', sport: '排球', position: '主攻', team: '一队' },
];

const EXERCISES = ['深蹲', '卧推', '硬拉', '引体向上', '推举', '划船', '弓箭步', '核心训练'];
const SESSION_TYPES = ['力量训练', '有氧训练', '速度训练', '技术训练', '比赛', '恢复训练'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAthletes(): Athlete[] {
  return ATHLETE_NAMES.map((a, idx) => ({
    id: `athlete-${idx + 1}`,
    name: a.name,
    sport: a.sport,
    position: a.position,
    team: a.team,
    birthDate: `199${randomInt(5, 9)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
  }));
}

export function generateTrainingData(athletes: Athlete[], days: number = 30): TrainingData[] {
  const data: TrainingData[] = [];
  const today = new Date();

  athletes.forEach((athlete, athleteIdx) => {
    for (let d = 0; d < days; d++) {
      if (Math.random() > 0.25) {
        const date = subDays(today, d);
        const dateStr = formatISO(date, { representation: 'date' });
        const sessionType = randomChoice(SESSION_TYPES);
        const duration = randomInt(45, 120);
        const loadScore = randomInt(200, 800);

        data.push({
          id: `train-${athleteIdx}-${d}`,
          athleteId: athlete.id,
          date: dateStr,
          sessionType,
          durationMin: duration,
          avgHeartRate: sessionType !== '恢复训练' ? randomInt(120, 170) : randomInt(90, 110),
          maxHeartRate: sessionType !== '恢复训练' ? randomInt(160, 195) : randomInt(100, 130),
          paceKmPerH: ['有氧训练', '速度训练'].includes(sessionType) ? randomFloat(8, 18, 1) : undefined,
          distanceKm: ['有氧训练', '速度训练'].includes(sessionType) ? randomFloat(3, 12, 2) : undefined,
          loadScore,
          rpe: randomInt(4, 10),
          source: 'gps',
        });
      }
    }
  });

  return data;
}

export function generateStrengthData(athletes: Athlete[], days: number = 30): StrengthData[] {
  const data: StrengthData[] = [];
  const today = new Date();

  athletes.forEach((athlete, athleteIdx) => {
    for (let d = 0; d < days; d++) {
      if (Math.random() > 0.6) {
        const date = subDays(today, d);
        const dateStr = formatISO(date, { representation: 'date' });
        const exerciseCount = randomInt(2, 4);
        const usedExercises = new Set<string>();

        for (let e = 0; e < exerciseCount; e++) {
          let exercise = randomChoice(EXERCISES);
          while (usedExercises.has(exercise)) {
            exercise = randomChoice(EXERCISES);
          }
          usedExercises.add(exercise);

          const weight = randomFloat(20, 120, 1);
          const reps = randomInt(3, 12);
          const sets = randomInt(3, 5);
          const oneRm = parseFloat((weight * (1 + reps / 30)).toFixed(1));

          data.push({
            id: `strength-${athleteIdx}-${d}-${e}`,
            athleteId: athlete.id,
            date: dateStr,
            exercise,
            weightKg: weight,
            reps,
            sets,
            estimated1Rm: oneRm,
          });
        }
      }
    }
  });

  return data;
}

export function generateRecoveryData(athletes: Athlete[], days: number = 30): RecoveryData[] {
  const data: RecoveryData[] = [];
  const today = new Date();

  athletes.forEach((athlete, athleteIdx) => {
    for (let d = 0; d < days; d++) {
      const date = subDays(today, d);
      const dateStr = formatISO(date, { representation: 'date' });

      const baseScore = randomInt(60, 95);
      const soreness = randomInt(1, 8);
      const adjustedScore = Math.max(0, Math.min(100, baseScore - soreness * 3));

      data.push({
        id: `recovery-${athleteIdx}-${d}`,
        athleteId: athlete.id,
        date: dateStr,
        sleepScore: randomInt(60, 95),
        hrv: randomInt(40, 80),
        sorenessScore: soreness,
        moodScore: randomInt(3, 10),
        overallScore: adjustedScore,
        source: 'questionnaire',
      });
    }
  });

  return data;
}

export function generateInjuryRecords(athletes: Athlete[]): InjuryRecord[] {
  const injuryTypes = [
    { type: '脚踝扭伤', severity: 'mild' as const, desc: '训练中轻微扭伤' },
    { type: '肌肉拉伤', severity: 'moderate' as const, desc: '大腿后侧肌肉拉伤' },
    { type: '膝盖不适', severity: 'mild' as const, desc: '髌股关节疼痛综合征' },
    { type: '肩部撞击', severity: 'moderate' as const, desc: '肩袖肌腱炎' },
    { type: '应力性骨折', severity: 'severe' as const, desc: '第二跖骨应力性骨折' },
    { type: '腰背劳损', severity: 'mild' as const, desc: '下背部肌肉劳损' },
  ];

  const data: InjuryRecord[] = [];
  const today = new Date();

  athletes.forEach((athlete, athleteIdx) => {
    const injuryCount = randomInt(0, 2);
    for (let i = 0; i < injuryCount; i++) {
      const injury = randomChoice(injuryTypes);
      const daysAgo = randomInt(1, 60);
      const date = subDays(today, daysAgo);
      const status = daysAgo < 14 ? 'active' : daysAgo < 30 ? 'chronic' : 'recovered';

      data.push({
        id: `injury-${athleteIdx}-${i}`,
        athleteId: athlete.id,
        date: formatISO(date, { representation: 'date' }),
        injuryType: injury.type,
        severity: injury.severity,
        description: injury.desc,
        notes: injury.severity === 'severe' ? '建议减少负重训练，配合物理治疗' : '注意热身，控制训练强度',
        status: status as 'active' | 'recovered' | 'chronic',
        returnDate: status === 'active' ? formatISO(addDays(date, randomInt(7, 21)), { representation: 'date' }) : undefined,
      });
    }
  });

  return data;
}

export function generateUsers(): User[] {
  return [
    {
      id: 'user-coach-1',
      email: 'coach@demo.com',
      role: 'coach',
      name: '张教练',
    },
    {
      id: 'user-athlete-1',
      email: 'athlete@demo.com',
      role: 'athlete',
      name: '李明',
      athleteId: 'athlete-1',
    },
  ];
}

export interface DataStore {
  athletes: Athlete[];
  trainingData: TrainingData[];
  strengthData: StrengthData[];
  recoveryData: RecoveryData[];
  injuryRecords: InjuryRecord[];
  users: User[];
}

export function createDataStore(): DataStore {
  const athletes = generateAthletes();
  return {
    athletes,
    trainingData: generateTrainingData(athletes),
    strengthData: generateStrengthData(athletes),
    recoveryData: generateRecoveryData(athletes),
    injuryRecords: generateInjuryRecords(athletes),
    users: generateUsers(),
  };
}
