const data = require('./backend/src/data/mockData');
const adjustedPlans = data.trainingPlans.filter(p => p.adjusted);

for (let i = 0; i < 3; i++) {
    const p = adjustedPlans[i];
    const t = data.actualTrainings.find(tr => tr.planId === p.id);
    console.log('--- 样本', i+1, '---');
    console.log('  日期:', p.date, '运动员:', p.athleteId, '动作:', p.exercise);
    console.log('  原强度:', p.originalIntensity, '调整后:', p.adjustedIntensity, '计划:', p.plannedIntensity);
    console.log('  实际训练存在:', !!t);
    if (t) console.log('  实际强度:', t.actualIntensity);
}

const date = adjustedPlans[0].date;
const athleteId = adjustedPlans[0].athleteId;
const dayPlans = data.trainingPlans.filter(p => p.date === date && p.athleteId === athleteId);
const dayTrainings = data.actualTrainings.filter(t => t.date === date && t.athleteId === athleteId);
console.log('\n使用样本 0 测试:');
console.log('日期:', date, '运动员:', athleteId);
console.log('当日计划数:', dayPlans.length, '调整数:', dayPlans.filter(p => p.adjusted).length);
console.log('当日训练数:', dayTrainings.length);
