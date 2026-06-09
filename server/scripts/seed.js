/**
 * 种子数据脚本：填充演示数据
 * npm run seed
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { initDb, getDb } = require('../db');
const logger = require('../utils/logger');
const { now, uuid } = require('../utils/common');
const meetingSvc = require('../services/meetingService');
const modelSvc = require('../services/modelService');
const sampleSvc = require('../services/sampleValidationService');
const audit = require('../audit');
const cleaner = require('../services/dataCleaning');

const demoTranscript1 = `[项目经理 李明] 各位早上好，今天是6月9号，我们来开本周的周会，先请大家汇报各自的进度。

[后端工程师 张伟] 我这边上周主要做了用户登录模块的重构，已经完成了80%，剩下的20%是短信验证码部分，预计明天（6月10号）能完成。这个模块测试的话需要QA小王那边配合一下。

[QA工程师 王芳] 好的，我这边收到。等张伟提交后我会第一时间安排测试。另外上周提的5个bug，现在已经关闭了3个，还有2个优先级比较低的，我这周内处理完。

[前端工程师 陈静] 前端这边支付页面的UI已经按照新设计稿改完了，下午会提PR。不过我有个问题，支付接口的文档好像还没更新？之前跟产品确认过是需要支持优惠券抵扣的。

[产品经理 刘洋] 接口文档我今天下班前（6月9日 18:00前）会更新好发在群里。优惠券抵扣这个功能我们确定要做，但是优先级调低，放到7月1号的版本就行，这一版先做基础支付。

[设计师 赵雪] 好的，那优惠券的UI我7月版本再做。另外首页的新版banner我今天会出稿。

[项目经理 李明] 好的，我再总结一下。张伟的登录重构6月10号完成，王芳5个bug这周处理完，陈静下午提支付页面PR，刘洋今天更新接口文档，赵雪今天出banner稿。还有一件事，下周三（6月18号）我们要做v2.0版本的验收，这是里程碑，大家把手上的任务尽量在6月17号前完成。

[产品经理 刘洋] 里程碑我补充一下，6月18号验收必须包含：登录模块、基础支付、首页改版这三个核心功能，其他小功能可以延后到7月版本。

[项目经理 李明] 好的，大家如果有阻塞问题随时在群里说。我们下周见。`;

const demoTranscript2 = `发言人A：好，今天我们过一下Q3的产品规划。
发言人B：Q3我们主要做三个方向，第一是用户增长，第二是商业化探索，第三是稳定性建设。
发言人C：用户增长方面，我建议先做邀请有礼活动，转化率大概能提升10%。这个相关同事跟进一下吧。
发言人A：好，邀请有礼这个尽快出方案。
发言人B：商业化这边，7月底前必须上线会员系统，这是董事会要求的。
发言人D：会员系统我可以做，但是需要产品在7月5号之前把需求文档给到我。
发言人A：那产品这边记得7月5号前出文档。稳定性方面呢？
发言人E：稳定性主要做慢查询优化和缓存升级，大概需要两周时间。尽快安排吧。
发言人A：好，那我们再确认一下时间点，会员系统是Q3的里程碑，7月底必须上线。还有那个邀请有礼的负责人等会散会后确认一下。`;

async function run() {
  await initDb();
  logger.info('[seed] === Seeding demo data ===');

  const db = getDb();
  const existingMeetingCount = db.prepare('SELECT COUNT(*) AS c FROM meetings').get().c;
  if (existingMeetingCount > 0) {
    logger.info(`[seed] Existing meetings: ${existingMeetingCount}, skip meeting seed`);
  } else {
    const m1 = await meetingSvc.importTranscript({
      title: '产品研发周会（2026-06-09）',
      projectName: '电商平台 v2.0',
      meetingDate: '2026-06-09',
      duration: 45,
      location: '线上腾讯会议',
      rawContent: demoTranscript1,
      sourceFormat: 'speaker-tagged',
      source: 'seed-demo-1',
      operatorName: 'seed',
    });
    logger.info(`[seed] Imported meeting 1: ${m1.meetingId}`);

    const m2 = await meetingSvc.importTranscript({
      title: 'Q3产品规划评审会',
      projectName: '增长项目组',
      meetingDate: '2026-06-05',
      duration: 60,
      location: '会议室A',
      rawContent: demoTranscript2,
      sourceFormat: 'speaker-tagged',
      source: 'seed-demo-2',
      operatorName: 'seed',
    });
    logger.info(`[seed] Imported meeting 2: ${m2.meetingId}`);
  }

  const existingModels = db.prepare('SELECT COUNT(*) AS c FROM registered_models').get().c;
  if (existingModels === 0) {
    modelSvc.registerModel({
      name: 'gpt-4o',
      version: '1.0.0',
      provider: 'openai',
      description: '默认的GPT-4o行动项抽取模型',
      metrics: { precision: 0.88, recall: 0.82, f1: 0.85, field_accuracy: { assignee: 0.89, deadline: 0.76 } },
      operatorName: 'seed',
    });

    const m2 = modelSvc.registerModel({
      name: 'gpt-4o-mini',
      version: '1.0.0',
      provider: 'openai',
      description: '轻量版模型，适合批量处理',
      metrics: { precision: 0.82, recall: 0.78, f1: 0.80 },
      operatorName: 'seed',
    });

    modelSvc.promoteModel(m2.id.replace('x', m2.id), 'seed').catch(() => {});

    const models = modelSvc.listModels();
    if (models.length > 0) {
      modelSvc.promoteModel(models[0].id, 'seed');
      logger.info(`[seed] Registered ${models.length} models, active: ${models[0].name}`);
    }
  }

  const datasets = modelSvc.listDatasets();
  if (datasets.length === 0) {
    modelSvc.createDataset({ name: '标准验证集 v1.0', type: 'validation', sampleCount: 20, description: '覆盖常见会议场景的标准验证集', version: '1.0' });
    modelSvc.createDataset({ name: '项目经理专属数据集', type: 'training', sampleCount: 150, description: '历史标注数据', version: '1.2' });
    logger.info('[seed] Created 2 datasets');
  }

  const samples = sampleSvc.listSamples();
  if (samples.length === 0) {
    const s1 = sampleSvc.createSample({
      meeting_title: '研发任务分配会',
      project_name: '示例项目',
      meeting_date: '2026-06-01',
      transcript: '张三负责完成登录接口，周五前提交；李四写测试用例，下周一完成；王五这两天出设计稿。',
      expected_action_items: [
        { title: '完成登录接口开发', assignee: '张三', deadline: '2026-06-05', priority: 'high', is_milestone: false },
        { title: '编写测试用例', assignee: '李四', deadline: '2026-06-08', priority: 'medium', is_milestone: false },
        { title: '输出设计稿', assignee: '王五', deadline: '2026-06-03', priority: 'medium', is_milestone: false },
      ],
      tags: ['seed', 'basic'],
      notes: '基础场景：明确负责人、明确日期',
    });

    const s2 = sampleSvc.createSample({
      meeting_title: '模糊场景测试会',
      project_name: '示例项目',
      meeting_date: '2026-06-02',
      transcript: '支付模块相关同事跟进一下，尽快出方案。另外，这个月底前版本要上线。',
      expected_action_items: [
        { title: '支付模块方案设计', assignee: null, deadline: null, priority: 'high', is_milestone: false, _note: '负责人模糊：相关同事' },
        { title: '完成版本上线', assignee: null, deadline: '2026-06-30', priority: 'high', is_milestone: true },
      ],
      tags: ['seed', 'ambiguous'],
      notes: '模糊场景：负责人不确定，需标记待确认',
    });

    logger.info(`[seed] Created sample seeds, e.g. ${s1.id}`);
  }

  logger.info('[seed] === Seeding complete ===');
}

run().then(() => {
  require('../db').closeDb();
  process.exit(0);
}).catch(err => {
  logger.error('[seed] Failed', err);
  process.exit(1);
});
