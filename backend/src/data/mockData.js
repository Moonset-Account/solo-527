const athletes = [
  { id: 'A001', name: '张三', gender: '男', sport: '田径', position: '短跑', age: 22, level: '健将级' },
  { id: 'A002', name: '李四', gender: '女', sport: '游泳', position: '自由泳', age: 20, level: '一级' },
  { id: 'A003', name: '王五', gender: '男', sport: '篮球', position: '后卫', age: 24, level: '健将级' },
  { id: 'A004', name: '赵六', gender: '女', sport: '排球', position: '主攻', age: 21, level: '一级' },
  { id: 'A005', name: '钱七', gender: '男', sport: '足球', position: '中场', age: 23, level: '健将级' },
  { id: 'A006', name: '孙八', gender: '女', sport: '田径', position: '跳远', age: 19, level: '二级' }
];

const coaches = [
  { id: 'C001', name: '陈教练', role: 'head', sports: ['田径', '游泳'] },
  { id: 'C002', name: '刘教练', role: 'assistant', sports: ['篮球', '足球'] },
  { id: 'C003', name: '周教练', role: 'rehab', sports: ['排球', '田径'] }
];

const sports = ['田径', '游泳', '篮球', '排球', '足球'];
const exercises = ['深蹲', '卧推', '硬拉', '高翻', '引体向上', '俯卧撑', '仰卧起坐', '平板支撑', '30米冲刺', '100米跑', '400米跑', '3000米跑'];

const generateDateRange = (days = 60) => {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const dates = generateDateRange(60);

const trainingPlans = [];
const actualTrainings = [];
const heartRateData = [];
const paceData = [];
const strengthTests = [];
const recoveryScores = [];
const injuryRecords = [];

athletes.forEach(athlete => {
  dates.forEach((date, dateIdx) => {
    if (Math.random() > 0.3) {
      const dailyExercises = exercises
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 4) + 2);

      dailyExercises.forEach(exercise => {
        const sets = Math.floor(Math.random() * 3) + 3;
        const reps = Math.floor(Math.random() * 8) + 4;
        const plannedIntensity = Math.floor(Math.random() * 30) + 60;
        const adjusted = Math.random() > 0.8;
        const adjustedIntensity = adjusted ? Math.floor(plannedIntensity * (0.7 + Math.random() * 0.4)) : plannedIntensity;

        const planId = `P${athlete.id}-${date}-${exercise}`;
        trainingPlans.push({
          id: planId,
          athleteId: athlete.id,
          athleteName: athlete.name,
          date,
          exercise,
          sport: athlete.sport,
          plannedSets: sets,
          plannedReps: reps,
          plannedIntensity,
          adjusted,
          originalIntensity: adjusted ? plannedIntensity : null,
          adjustedIntensity: adjusted ? adjustedIntensity : null,
          adjustmentReason: adjusted ? ['状态不佳', '伤病恢复', '加量训练'][Math.floor(Math.random() * 3)] : null
        });

        const actualSets = Math.max(1, sets + Math.floor(Math.random() * 3) - 1);
        const actualReps = Math.max(2, reps + Math.floor(Math.random() * 5) - 2);
        const actualIntensity = Math.floor(adjustedIntensity * (0.85 + Math.random() * 0.25));

        actualTrainings.push({
          id: `A${planId}`,
          planId,
          athleteId: athlete.id,
          athleteName: athlete.name,
          date,
          exercise,
          sport: athlete.sport,
          actualSets,
          actualReps,
          actualIntensity,
          completionRate: Math.round(((actualSets * actualReps * actualIntensity) / (sets * reps * adjustedIntensity)) * 100),
          notes: Math.random() > 0.8 ? '训练表现良好' : ''
        });

        for (let i = 0; i < 10; i++) {
          heartRateData.push({
            id: `HR${planId}-${i}`,
            athleteId: athlete.id,
            date,
            exercise,
            timestamp: `${date}T${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${String((i % 2) * 30).padStart(2, '0')}:00`,
            heartRate: Math.floor(100 + Math.random() * 80),
            zone: i < 3 ? 'warmup' : i < 7 ? 'training' : 'recovery'
          });
        }

        if (['100米跑', '400米跑', '3000米跑', '30米冲刺'].includes(exercise)) {
          paceData.push({
            id: `PACE${planId}`,
            athleteId: athlete.id,
            date,
            exercise,
            distance: exercise === '30米冲刺' ? 30 : exercise === '100米跑' ? 100 : exercise === '400米跑' ? 400 : 3000,
            duration: exercise === '30米冲刺' ? 4 + Math.random() * 2 :
                     exercise === '100米跑' ? 11 + Math.random() * 3 :
                     exercise === '400米跑' ? 55 + Math.random() * 15 :
                     600 + Math.random() * 180,
            avgPace: null,
            splitTimes: []
          });
        }
      });

      if (dateIdx % 7 === 3) {
        ['深蹲', '卧推', '硬拉'].forEach(exercise => {
          strengthTests.push({
            id: `ST${athlete.id}-${date}-${exercise}`,
            athleteId: athlete.id,
            athleteName: athlete.name,
            date,
            exercise,
            sport: athlete.sport,
            oneRepMax: Math.floor(Math.random() * 80) + 60,
            reps: 1,
            notes: ''
          });
        });
      }

      recoveryScores.push({
        id: `REC${athlete.id}-${date}`,
        athleteId: athlete.id,
        athleteName: athlete.name,
        date,
        overallScore: Math.floor(Math.random() * 40) + 50,
        sleepScore: Math.floor(Math.random() * 40) + 50,
        fatigueScore: Math.floor(Math.random() * 40) + 50,
        sorenessScore: Math.floor(Math.random() * 40) + 50,
        moodScore: Math.floor(Math.random() * 40) + 50,
        hrv: Math.floor(Math.random() * 30) + 40,
        restingHR: Math.floor(Math.random() * 20) + 55
      });
    }

    if (Math.random() > 0.97) {
      injuryRecords.push({
        id: `INJ${athlete.id}-${date}`,
        athleteId: athlete.id,
        athleteName: athlete.name,
        date,
        sport: athlete.sport,
        bodyPart: ['膝盖', '脚踝', '腰部', '肩部', '大腿'][Math.floor(Math.random() * 5)],
        severity: ['轻度', '中度', '重度'][Math.floor(Math.random() * 3)],
        type: ['拉伤', '扭伤', '劳损', '炎症'][Math.floor(Math.random() * 4)],
        description: '训练中出现不适，经检查为轻度损伤',
        internalNotes: '教练备注：建议减少下肢训练量，配合物理治疗',
        status: ['恢复中', '已康复', '停训'][Math.floor(Math.random() * 3)],
        expectedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  });
});

module.exports = {
  athletes,
  coaches,
  sports,
  exercises,
  dates,
  trainingPlans,
  actualTrainings,
  heartRateData,
  paceData,
  strengthTests,
  recoveryScores,
  injuryRecords
};
