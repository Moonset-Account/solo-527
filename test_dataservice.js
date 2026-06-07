const dataService = require('./backend/src/services/dataService');

async function test() {
    console.log('测试 dataService.getDayTrainings...');
    console.log('参数: date=2026-04-10, athleteId=A001');
    
    const result = await dataService.getDayTrainings('2026-04-10', 'A001');
    
    console.log('\n返回结果:');
    console.log('  rows 数量:', result.rows.length);
    console.log('  hasAdjusted:', result.hasAdjusted);
    console.log('  cached:', result.cached);
    console.log('  cacheKey:', result.cacheKey);
    
    if (result.rows.length > 0) {
        console.log('\n第一条数据:');
        const row = result.rows[0];
        console.log('  训练:', row.training?.exercise);
        console.log('  计划:', row.plan?.exercise);
        console.log('  deviation:', row.deviation);
    } else {
        console.log('\n直接测试 clickhouse:');
        const clickhouse = require('./backend/src/database/clickhouse');
        const chResult = await clickhouse.query(
            'SELECT * FROM DAY_TRAININGS WHERE date = :date',
            { date: '2026-04-10', athleteId: 'A001' }
        );
        console.log('  clickhouse rows:', chResult.rows.length);
        if (chResult.rows.length > 0) {
            console.log('  第一条:', chResult.rows[0].training?.exercise);
        }
    }
}

test().catch(console.error);
