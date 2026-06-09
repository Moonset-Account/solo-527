/**
 * 最小化验证脚本 - 逐步验证各模块加载
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.on('uncaughtException', e => console.error('ERR:', e.message, e.stack.split('\n')[1]));

const logger = require('./utils/logger');
logger.info('[verify] Step 1: logger OK');

const config = require('./config');
console.log('[verify] Step 2: config OK, port=' + config.port);

const db = require('./db');
console.log('[verify] Step 3: db module imported (not yet init)');

(async () => {
  try {
    await db.initDb();
    console.log('[verify] Step 4: db initialized');

    const dbh = db.getDb();
    console.log('[verify] Step 5: getDb handle OK');

    dbh.prepare('CREATE TABLE IF NOT EXISTS test_tbl (id TEXT PRIMARY KEY, val TEXT)').run();
    console.log('[verify] Step 6: CREATE TABLE OK');

    const id = 't-' + Date.now();
    dbh.prepare('INSERT INTO test_tbl (id, val) VALUES (?, ?)').run(id, 'hello');
    console.log('[verify] Step 7: INSERT OK');

    const row = dbh.prepare('SELECT * FROM test_tbl WHERE id = ?').get(id);
    console.log('[verify] Step 8: SELECT OK ->', JSON.stringify(row));

    const all = dbh.prepare('SELECT COUNT(*) AS c FROM test_tbl').all();
    console.log('[verify] Step 9: ALL OK ->', JSON.stringify(all));

    dbh.exec('DROP TABLE test_tbl');
    console.log('[verify] Step 10: DROP OK');

    // Test common utils
    const { uuid, now, ok, fail } = require('./utils/common');
    console.log('[verify] Step 11: common OK uuid=' + uuid().slice(0, 8) + ' now=' + now());

    // Test audit
    const audit = require('./audit');
    const id2 = 'audit-' + Date.now();
    audit.log('meeting', id2, 'create', { oldValue: null, newValue: '{}', operatorId: 'verify', operatorName: 'tester' });
    console.log('[verify] Step 12: audit.log OK');

    // Test model service
    const modelSvc = require('./services/modelService');
    const m = modelSvc.registerModel({
      name: 'test-model-' + Date.now(),
      version: '1.0.0',
      provider: 'openai',
      description: 'verify',
      metrics: { precision: 0.9, recall: 0.85, f1: 0.87 },
      operatorName: 'verify',
    });
    console.log('[verify] Step 13: modelService.registerModel OK id=' + m.id.slice(0, 8));

    const models = modelSvc.listModels();
    console.log('[verify] Step 14: modelService.listModels OK count=' + models.length);

    // Test dataset
    const ds = modelSvc.createDataset({ name: '测试集', type: 'validation', sampleCount: 10, version: '1.0' });
    console.log('[verify] Step 15: createDataset OK name=' + ds.name);

    // Test data cleaning (无外部依赖)
    const cleaner = require('./services/dataCleaning');
    const sample = '[张三] 这个功能下周三前完成\n[李四] 好的，我来跟进';
    const parsed = cleaner.parseTranscript(sample, 'speaker-tagged');
    console.log('[verify] Step 15: dataCleaning.parseTranscript OK, segments=' + parsed.segments.length);

    const topics = cleaner.detectTopics(parsed.segments);
    console.log('[verify] Step 16: detectTopics OK topics=' + topics.length);

    console.log('\n====== 所有核心模块验证通过！ ======\n');
    require('./db').closeDb();
    process.exit(0);
  } catch (err) {
    console.error('[verify] FAILED:', err.message);
    console.error(err.stack);
    try { require('./db').closeDb(); } catch {}
    process.exit(1);
  }
})();
