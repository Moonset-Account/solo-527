require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { getDb, closeDb } = require('../utils/database');

const ACCEPTANCE_SAMPLES = [
  {
    sample_type: 'correct',
    content: '望京西园三区12号楼前垃圾桶已经3天没人清运，垃圾堆成山了臭气熏天苍蝇蚊子特别多，路过都捂着鼻子走，请城管来管管物业吧',
    expected_category: '环境卫生',
    expected_urgency: '一般',
    expected_department: 'CSB',
    expected_high_risk: 0,
    expected_needs_review: 0,
    remarks: '典型环境卫生类，关键词明确分类置信度高，应自动分拨',
  },
  {
    sample_type: 'correct',
    content: '青年路和朝阳北路交叉口西北角，有一根路灯坏了快一周没人修，晚上漆黑一片，昨天晚上有人骑车摔倒受伤了，请市政赶紧修一下',
    expected_category: '市政设施',
    expected_urgency: '紧急',
    expected_department: 'CSB',
    expected_high_risk: 0,
    expected_needs_review: 0,
    remarks: '路灯损坏，语义明确含受伤信息提升紧急度，应自动分拨',
  },
  {
    sample_type: 'correct',
    content: '小区2号楼18层电梯停运已经4天，物业说配件坏了一直不修，楼里全是老人上下楼不方便，昨天一位80岁老人心脏病发作救护车都上不去，万一着火更麻烦',
    expected_category: '市政设施',
    expected_urgency: '紧急',
    expected_department: 'ZJJ',
    expected_high_risk: 0,
    expected_needs_review: 0,
    remarks: '电梯故障，救护车都无法使用，紧急度高但非安全生产类',
  },
  {
    sample_type: 'correct',
    content: '楼下新开的那家饭馆，油烟直接排到小区里，我们住户天天闻油烟，家里窗户都不敢开，闻了都恶心，已经打了好几次投诉电话',
    expected_category: '环境保护',
    expected_urgency: '一般',
    expected_department: 'STHJJ',
    expected_high_risk: 0,
    expected_needs_review: 0,
    remarks: '餐饮油烟扰民，环保部门职责，分类明确',
  },
  {
    sample_type: 'correct',
    content: '60岁以上老年公交卡怎么办理？需要什么证件和去哪里办理地点和时间？周末休息吗？可以代办吗？',
    expected_category: '民政救助',
    expected_urgency: '缓办',
    expected_department: 'MZJ',
    expected_high_risk: 0,
    expected_needs_review: 0,
    remarks: '纯咨询类诉求，缓办级别，自动分拨民政',
  },
  {
    sample_type: 'low_confidence',
    content: '嗯...那个...就是...小区那啥...你懂吧...就那个事...不方便说',
    expected_category: '其他民生诉求',
    expected_urgency: '一般',
    expected_department: 'JDB',
    expected_high_risk: 0,
    expected_needs_review: 1,
    remarks: '语义极度模糊，置信度必然低于阈值，必须进入人工复核队列',
  },
  {
    sample_type: 'low_confidence',
    content: '我也不知道算啥问题吧反正就是心里不舒服，你们看着办吧感觉都有点问题又说不上来，唉就那样吧',
    expected_category: '其他民生诉求',
    expected_urgency: '一般',
    expected_department: 'JDB',
    expected_high_risk: 0,
    expected_needs_review: 1,
    remarks: '无实质诉求内容，语义不清置信度低，人工判定',
  },
  {
    sample_type: 'low_confidence',
    content: '某某部门说不归他们管，某某又说找那个，我也不知道找哪个部门，几个部门推来推去都不管用，踢皮球',
    expected_category: '其他民生诉求',
    expected_urgency: '一般',
    expected_department: 'JDB',
    expected_high_risk: 0,
    expected_needs_review: 1,
    remarks: '部门推诿描述，未说明具体事项，分类置信度低',
  },
  {
    sample_type: 'manual_correction',
    content: 'XX路XX小区停车收费一个月收了我们两次物业费又收了还收了两次停车费，这不是双重收费吗？物价局管不管？',
    expected_category: '市场监管',
    expected_urgency: '一般',
    expected_department: 'SCJGJ',
    expected_high_risk: 0,
    expected_needs_review: 1,
    remarks: '模型易误分为住房建设，实际为价格监管属市场监管部门（人工改标场景）',
  },
  {
    sample_type: 'manual_correction',
    content: '工地早上5点就开始施工，挖掘机噪音让人睡不着，打了110不管，110说环保局环保局说城管城管又说住建，到底谁管',
    expected_category: '环境保护',
    expected_urgency: '一般',
    expected_department: 'STHJJ',
    expected_high_risk: 0,
    expected_needs_review: 1,
    remarks: '施工噪声污染属环保部门，模型可能误分城市管理或住建',
  },
  {
    sample_type: 'manual_correction',
    content: '我们学校老师在外面私下开补习班收费两小时500块，不去的学生上课被老师点名批评给穿小鞋',
    expected_category: '教育文化',
    expected_urgency: '一般',
    expected_department: 'JYJ',
    expected_high_risk: 0,
    expected_needs_review: 1,
    remarks: '师德师风违规，教育主管部门处理，模型可能误分纪检类',
  },
  {
    sample_type: 'manual_correction',
    content: '买到过期食品吃了拉肚子，超市还在卖过期牛奶保质期都过了一星期还摆货架上卖，小票都有',
    expected_category: '市场监管',
    expected_urgency: '紧急',
    expected_department: 'SCJGJ',
    expected_high_risk: 0,
    expected_needs_review: 1,
    remarks: '食品安全属市场监管，模型可能误分为医疗卫生',
  },
  {
    sample_type: 'unanswerable',
    content: '反映居委会张主任今天下午三点在办公室收了我两条烟和5000块钱好处费，他说能给我办低保我要举报他贪污受贿，你们管不管？不管我去区纪委继续举报',
    expected_category: '信访维稳',
    expected_urgency: '紧急',
    expected_department: 'XFJ',
    expected_high_risk: 1,
    expected_needs_review: 1,
    remarks: '举报类涉廉政问题，必须人工介入转交纪委渠道（高风险+模型无法自动处理）',
  },
  {
    sample_type: 'unanswerable',
    content: '我们村300多户拆迁补偿不合理，准备明天集体到市政府门口上访静坐，横幅都做好了50条，还有两个记者要来',
    expected_category: '信访维稳',
    expected_urgency: '特急',
    expected_department: 'XFJ',
    expected_high_risk: 1,
    expected_needs_review: 1,
    remarks: '群体性上访事件，高风险群体性事件，禁止自动关闭，必须人工确认升级',
  },
  {
    sample_type: 'unanswerable',
    content: 'XX工地脚手架塌了压了三个人听说有一个没呼吸了，120刚拉走，工地还在瞒报不让说，工地经理把工人手机都收了',
    expected_category: '安全生产',
    expected_urgency: '特急',
    expected_department: 'AQSCJ',
    expected_high_risk: 1,
    expected_needs_review: 1,
    remarks: '安全生产死亡事故，属高风险类别，必须人工确认应急处置',
  },
  {
    sample_type: 'unanswerable',
    content: 'XX小区有人从10楼往下跳，现在还站窗边喊要跳，消防来了也不敢上去劝，楼下聚集了好多人围观堵路了',
    expected_category: '治安消防',
    expected_urgency: '特急',
    expected_department: 'GAJ',
    expected_high_risk: 1,
    expected_needs_review: 1,
    remarks: '人命关天的治安事件，110处置范畴，高风险类别必须人工',
  },
  {
    sample_type: 'unanswerable',
    content: '我们200多工人工资一年没发，老板跑了找不到人，我们准备去堵马路，今天下午就集合去区政府大门堵路去',
    expected_category: '劳动保障',
    expected_urgency: '特急',
    expected_department: 'RSJ',
    expected_high_risk: 1,
    expected_needs_review: 1,
    remarks: '欠薪引发群体性堵路事件，含群体+堵路关键词高风险拦截',
  },
  {
    sample_type: 'unanswerable',
    content: '今天上午小区5户人家都发烧39度以上，还有小孩也烧，卫生院说是可能传染，让报给你们，大家都怕',
    expected_category: '重大疫情',
    expected_urgency: '特急',
    expected_department: 'WJW',
    expected_high_risk: 1,
    expected_needs_review: 1,
    remarks: '疑似传染病聚集性发病，属重大疫情高风险类别拦截',
  },
];

async function main() {
  const db = getDb();
  const del = db.prepare('DELETE FROM evaluation_samples');
  const delRes = del.run();
  logger.info(`清空旧样本: ${delRes.changes} 条`);

  const insert = db.prepare(`
    INSERT INTO evaluation_samples (
      id, sample_type, content, expected_category, expected_urgency, expected_department,
      expected_high_risk, expected_needs_review, remarks, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const tx = db.transaction((samples) => {
    for (const s of samples) {
      insert.run(
        uuidv4(), s.sample_type, s.content, s.expected_category, s.expected_urgency,
        s.expected_department, s.expected_high_risk, s.expected_needs_review, s.remarks
      );
    }
    return samples.length;
  });

  const count = tx(ACCEPTANCE_SAMPLES);
  logger.info(`成功插入 ${count} 条验收样本`);

  const byType = db.prepare('SELECT sample_type, COUNT(*) as c FROM evaluation_samples GROUP BY sample_type').all();
  logger.info('样本分布:', Object.fromEntries(byType.map(r => [r.sample_type, r.c])));

  closeDb();
}

main().catch(e => {
  logger.error('样本初始化失败', { error: e.message, stack: e.stack });
  closeDb();
  process.exit(1);
});

module.exports = { ACCEPTANCE_SAMPLES };
