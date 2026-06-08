import { Level } from '@/types/game';

export const levels: Level[] = [
  {
    id: 'level_0',
    title: '实验室入门',
    description: '学习化学实验的基本操作：选取器材、添加试剂、搅拌和观察',
    experimentId: 'tutorial',
    knowledgeCardId: 'k_tutorial',
    newRules: [],
    hintCount: 5,
    order: 0,
  },
  {
    id: 'level_1',
    title: '基础溶液配制',
    description: '掌握量筒的使用方法，学会精确量取和配制溶液',
    experimentId: 'solution_prep',
    knowledgeCardId: 'k_solution_prep',
    newRules: ['量取精度要求：量筒读数误差不超过±5mL'],
    hintCount: 3,
    order: 1,
  },
  {
    id: 'level_2',
    title: '温度控制实验',
    description: '学习使用酒精灯加热，掌握温度控制和温度计读数',
    experimentId: 'temperature_control',
    knowledgeCardId: 'k_temperature',
    newRules: ['温度区间控制：目标温度误差不超过±10°C'],
    timeLimit: 180,
    hintCount: 3,
    order: 2,
  },
  {
    id: 'level_3',
    title: '酸碱中和反应',
    description: '认识酸碱中和反应，学会使用指示剂判断反应终点',
    experimentId: 'acid_base',
    knowledgeCardId: 'k_acid_base',
    newRules: ['滴加速度控制：必须逐滴加入', '指示剂使用：根据颜色变化判断终点'],
    hintCount: 3,
    order: 3,
  },
  {
    id: 'level_4',
    title: '沉淀反应',
    description: '学习沉淀反应原理和过滤分离操作',
    experimentId: 'precipitate',
    knowledgeCardId: 'k_precipitate',
    newRules: ['操作顺序要求：先加试剂再过滤', '废液处理：含重金属废液需回收'],
    hintCount: 2,
    order: 4,
  },
  {
    id: 'level_5',
    title: '综合实验',
    description: '综合运用所学技能完成复杂实验',
    experimentId: 'comprehensive',
    knowledgeCardId: 'k_comprehensive',
    newRules: ['全部规则综合应用', '时间限制：5分钟内完成'],
    timeLimit: 300,
    hintCount: 2,
    order: 5,
  },
];

export function getLevelById(id: string): Level | undefined {
  return levels.find(l => l.id === id);
}

export function getLevelsOrdered(): Level[] {
  return [...levels].sort((a, b) => a.order - b.order);
}
