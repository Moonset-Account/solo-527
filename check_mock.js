const data = require('./backend/src/data/mockData');
console.log('actualTrainings 总数:', data.actualTrainings.length);
console.log('trainingPlans 总数:', data.trainingPlans.length);

console.log('\n前 5 个 actualTrainings:');
data.actualTrainings.slice(0, 5).forEach(t => {
    console.log(' ', t.date, t.athleteId, t.exercise);
});

const adjusted = data.trainingPlans.filter(p => p.adjusted);
console.log('\n有调整的计划数:', adjusted.length);

for (const p of adjusted) {
    const t = data.actualTrainings.find(tr => tr.athleteId === p.athleteId && tr.date === p.date);
    if (t) {
        console.log('\n找到匹配样本:');
        console.log('  日期:', p.date, '运动员:', p.athleteId);
        console.log('  计划动作:', p.exercise, '实际动作:', t.exercise);
        console.log('  原强度:', p.originalIntensity, '调整后:', p.adjustedIntensity, '实际:', t.actualIntensity);
        console.log('  planId:', p.id, 'training.planId:', t.planId);
        break;
    }
}
