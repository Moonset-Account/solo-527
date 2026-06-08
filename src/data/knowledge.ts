import { KnowledgeCard } from '@/types/game';

export const knowledgeCards: KnowledgeCard[] = [
  {
    id: 'k_tutorial',
    title: '溶液与溶解',
    principle: '溶解是溶质分散到溶剂中形成均匀混合物的过程。氯化钠溶于水时，Na⁺和Cl⁻被水分子包围，形成水合离子。',
    safetyNote: '配制溶液时注意不要超过容器容积的2/3，避免搅拌时溶液溅出。',
    realWorldApplication: '食盐溶于水是生活中最常见的溶解现象。海水就是含有多种盐类的溶液。',
    relatedFormula: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)',
  },
  {
    id: 'k_solution_prep',
    title: '溶液配制方法',
    principle: '配制一定浓度的溶液需要准确量取溶质和溶剂。量筒是常用的量取工具，读数时视线应与液面凹面最低处齐平。',
    safetyNote: '量取浓酸浓碱时必须使用防护设备，沿壁缓慢加入。',
    realWorldApplication: '医用生理盐水(0.9%NaCl)就是按精确浓度配制的溶液，用于静脉注射和伤口清洗。',
    relatedFormula: 'c = n/V',
  },
  {
    id: 'k_temperature',
    title: '加热与温度控制',
    principle: '加热是加速反应和促进溶解的常用方法。酒精灯的外焰温度最高，应使用外焰加热。温度计用于监测温度变化。',
    safetyNote: '加热时试管口不可对着人；酒精灯必须用灯帽盖灭，严禁用嘴吹灭；容器外壁不能有水。',
    realWorldApplication: '烹饪中的煮沸、消毒、化学工业中的蒸馏提纯都需要精确的温度控制。',
  },
  {
    id: 'k_acid_base',
    title: '酸碱中和反应',
    principle: '酸碱中和反应是酸和碱反应生成盐和水的过程。酚酞指示剂在碱性溶液中显红色，在中性或酸性溶液中无色。当红色恰好褪去时，说明溶液恰好中和。',
    safetyNote: '强酸强碱有腐蚀性，避免皮肤接触。中和反应会放热，注意控制滴加速度。',
    realWorldApplication: '胃酸过多时服用抗酸药（如氢氧化铝）就是利用酸碱中和原理。农业上用石灰改良酸性土壤。',
    relatedFormula: 'NaOH + HCl → NaCl + H₂O',
  },
  {
    id: 'k_precipitate',
    title: '沉淀反应与过滤',
    principle: '两种可溶性盐溶液混合时，如果生成不溶性盐，就会形成沉淀。硫酸钡是不溶于水的白色沉淀。过滤是分离沉淀和溶液的基本操作。',
    safetyNote: '含钡化合物有毒，实验废液不可随意倾倒，需统一回收处理。',
    realWorldApplication: '硫酸钡沉淀用于X射线造影剂（钡餐），因为其不溶于水且不透X射线。水处理中也常用沉淀法去除杂质。',
    relatedFormula: 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl',
  },
  {
    id: 'k_comprehensive',
    title: '综合实验方法',
    principle: '复杂实验需要将多种基本操作组合：量取→溶解→加热→反应→分离→观察。每一步的准确性都会影响最终结果。Cu²⁺与OH⁻反应生成蓝色Cu(OH)₂沉淀。',
    safetyNote: '综合实验操作步骤多，需格外注意安全规范。加热后先撤酒精灯再停止其他操作。',
    realWorldApplication: '工业生产和科研中，大多数化学过程都是多步骤的综合操作。药物合成、材料制备都需要精确的流程控制。',
    relatedFormula: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
  },
];

export function getKnowledgeCardById(id: string): KnowledgeCard | undefined {
  return knowledgeCards.find(k => k.id === id);
}
