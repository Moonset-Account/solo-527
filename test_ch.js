const clickhouse = require('./backend/src/database/clickhouse');

async function test() {
    console.log('测试 ClickHouse 直接查询...');
    
    const result = await clickhouse.query(
        'SELECT * FROM DAY_TRAININGS WHERE date = :date',
        { date: '2026-04-11', athleteId: 'A001' }
    );
    
    console.log('返回行数:', result.rows.length);
    console.log('hasAdjusted:', result.hasAdjusted);
    
    if (result.rows.length > 0) {
        console.log('\n第一条数据:');
        const row = result.rows[0];
        console.log('  训练:', row.training?.exercise);
        console.log('  调整:', row.plan?.adjusted);
        console.log('  deviation:', row.deviation);
    } else {
        console.log('\n直接从 mockData 验证:');
        const data = require('./backend/src/data/mockData');
        const trainings = data.actualTrainings.filter(t => t.date === '2026-04-11' && t.athleteId === 'A001');
        console.log('  actualTrainings 数量:', trainings.length);
        if (trainings.length > 0) {
            console.log('  第一条训练:', trainings[0].exercise, trainings[0].id);
        }
    }
}

test().catch(console.error);
