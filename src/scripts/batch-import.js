require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { getDb, closeDb } = require('../utils/database');
const { cleanHistoricalRecords } = require('../services/dataCleaner');
const { importHistoricalTickets } = require('../services/ticketService');
const { buildIndexFromDatabase } = require('../services/vectorStore');

const args = process.argv.slice(2);
let inputFile = args.find(a => a.startsWith('--file='))?.split('=')[1];
let buildIndex = args.includes('--build-index');
let demoCount = parseInt(args.find(a => a.startsWith('--demo='))?.split('=')[1] || '0', 10);

async function generateDemoData(n) {
  const cats = ['环境卫生','市政设施','城市管理','住房建设','劳动保障','医疗卫生','民政救助','市场监管','环境保护','教育文化','治安消防','交通出行','安全生产','信访维稳'];
  const urgs = ['特急','紧急','一般','一般','一般','一般','缓办'];
  const depts = {
    '环境卫生':['CSB','城市管理局'], '市政设施':['CSB','城市管理局'], '城市管理':['CSB','城市管理局'],
    '住房建设':['ZJJ','住房和城乡建设局'], '劳动保障':['RSJ','人社局'], '医疗卫生':['WJW','卫健委'],
    '民政救助':['MZJ','民政局'], '市场监管':['SCJGJ','市监局'], '环境保护':['STHJJ','生态环境局'],
    '教育文化':['JYJ','教育局'], '治安消防':['GAJ','公安局'], '交通出行':['GAJ','公安局'],
    '安全生产':['AQSCJ','应急管理局'], '信访维稳':['XFJ','信访局'],
  };
  const blocks = ['望京街道','建外街道','中关村街道','三里屯街道','亚运村街道','西长安街街道','东华门街道','东升地区','回龙观街道','天通苑北街道','和平街街道','朝外街道'];
  const districts = ['朝阳区','海淀区','西城区','东城区','丰台区','石景山区','通州区','昌平区','大兴区','顺义区'];
  const templates = [
    ['小区垃圾桶', '满了三天没清，恶臭熏天，投诉物业无果'],
    ['路面积水', '下雨就淹，井盖还往外冒污水'],
    ['路灯坏了', '一周没人修，晚上黑路危险'],
    ['楼下底商', '夜间烧烤摊噪音油烟扰民'],
    ['电梯故障', '老楼电梯三天两头坏，老人小孩不敢坐'],
    ['物业', '物业费收了不干事，反映问题没人管'],
    ['健身器材', '公园器材损坏生锈，有安全隐患'],
    ['占道经营', '小商小贩堵路，消防通道都占满'],
    ['施工扰民', '凌晨就开工，打桩机吵得睡不着'],
    ['餐饮油烟', '直接排居民楼，窗户没法开'],
    ['消防通道', '私家车长期占用通道，物业不管'],
    ['排队太长', '社区医院人多，老人站不动'],
    ['红绿灯坏', '路口灯不亮，好几起车祸了'],
    ['流浪狗', '小区流浪狗成群，老人小孩不敢出门'],
    ['树木挡灯', '行道树太密，路灯全被挡黑'],
    ['共享单车', '乱堆乱放占满人行道'],
    ['无证经营', '餐饮店无照还卖过期食品'],
    ['收费乱', '小区停车费乱涨价，业主不服'],
  ];
  const arr = [];
  for (let i = 0; i < n; i++) {
    const idx = i % templates.length;
    const c = cats[i % cats.length];
    const [dc, dn] = depts[c] || ['JDB', '街道办事处'];
    const [tplHead, tplTail] = templates[idx];
    arr.push({
      id: null,
      ticket_no: `HIS2024${String(50000 + i)}`,
      content: `${tplHead}${tplTail}，${i % 5 === 0 ? '多次电话反映仍未解决，希望尽快处理。' : '希望尽快派人处理谢谢。'}`,
      category: c,
      urgency: urgs[i % urgs.length],
      department_code: dc, department_name: dn,
      district: districts[i % districts.length],
      block: blocks[i % blocks.length],
      community: ['阳光花园','望京西园','翠城馨园','和平家园','世纪城'][i % 5] + (i % 20 + 1) + '号楼',
      resolution: i % 4 === 0 ? '已协调物业完成整改，居民满意' : i % 3 === 0 ? '已完成执法检查，责令整改' : '已转相关部门处理完毕',
      resolution_days: 0.5 + (i % 8),
      followup_score: 3 + (i % 3),
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      closed_at: new Date(Date.now() - (i - 1) * 86400000).toISOString(),
    });
  }
  return arr;
}

async function main() {
  let records = [];

  if (demoCount > 0) {
    logger.info(`生成 ${demoCount} 条演示历史数据...`);
    records = await generateDemoData(demoCount);
  } else if (inputFile) {
    const p = path.resolve(inputFile);
    if (!fs.existsSync(p)) { console.error(`文件不存在: ${p}`); process.exit(1); }
    records = JSON.parse(fs.readFileSync(p, 'utf-8'));
    logger.info(`从 ${p} 加载 ${records.length} 条`);
  } else {
    console.error('参数错误：指定 --file=<path> 或 --demo=N');
    console.error('示例: node src/scripts/batch-import.js --demo=100');
    console.error('      node src/scripts/batch-import.js --file=./data/cleaned.json --build-index');
    process.exit(1);
  }

  logger.info(`开始数据清洗...`);
  const cleaned = cleanHistoricalRecords(records);
  logger.info(`清洗后: ${cleaned.length} 条 (丢弃 ${records.length-cleaned.length})`);

  const result = importHistoricalTickets(cleaned, { buildEmbedding: false });
  logger.info(`DB导入完成: ${result.imported} 条`);

  if (buildIndex) {
    logger.info('开始构建向量索引(可能耗时较长)...');
    const idx = await buildIndexFromDatabase(50);
    logger.info(`向量索引构建完成: ${idx.indexed} 条, 消耗 ${idx.totalTokens} tokens`);
  }

  closeDb();
  logger.info('批处理完成');
}

main().catch(e => {
  logger.error('批处理失败', { error: e.message, stack: e.stack });
  closeDb();
  process.exit(1);
});
