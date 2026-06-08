import { Experiment } from '@/types/game';

export const experiments: Experiment[] = [
  {
    id: 'tutorial',
    title: '实验室入门',
    steps: [
      { id: 't1', order: 1, description: '选择烧杯放在实验台上', action: 'select_apparatus', target: 'beaker', tolerance: 0, hint: '点击底部的烧杯图标', errorPrompt: '请先选择烧杯，它是实验的基本容器', safetyNote: '使用前检查烧杯是否有裂纹' },
      { id: 't2', order: 2, description: '向烧杯中加入蒸馏水', action: 'add_reagent', target: 'water', tolerance: 0, hint: '在右侧试剂面板选择蒸馏水', errorPrompt: '请选择蒸馏水添加到烧杯中', safetyNote: '注意不要超过烧杯容量的2/3' },
      { id: 't3', order: 3, description: '加入氯化钠固体', action: 'add_reagent', target: 'nacl', tolerance: 0, hint: '选择氯化钠试剂', errorPrompt: '请选择氯化钠加入溶液中' },
      { id: 't4', order: 4, description: '用玻璃棒搅拌', action: 'stir', target: 'stirrer', tolerance: 0, hint: '选择玻璃棒进行搅拌', errorPrompt: '需要用玻璃棒搅拌帮助溶解' },
      { id: 't5', order: 5, description: '观察溶解现象', action: 'observe', target: 'solution', tolerance: 0, hint: '点击观察按钮记录现象', errorPrompt: '请仔细观察溶液的变化' },
    ],
    requiredApparatus: ['beaker', 'stirrer'],
    requiredReagents: ['water', 'nacl'],
    successCondition: '氯化钠完全溶解',
  },
  {
    id: 'solution_prep',
    title: '基础溶液配制',
    steps: [
      { id: 's1', order: 1, description: '选择量筒', action: 'select_apparatus', target: 'graduated_cylinder', tolerance: 0, hint: '使用量筒可以精确量取液体', errorPrompt: '配制溶液需要用量筒量取' },
      { id: 's2', order: 2, description: '量取50mL蒸馏水', action: 'measure', target: 'water:50', tolerance: 5, hint: '注意读取量筒刻度时视线要与液面齐平', errorPrompt: '量取量不准确，请重新量取', safetyNote: '量筒读数时视线应与液面最低处齐平' },
      { id: 's3', order: 3, description: '将蒸馏水倒入烧杯', action: 'pour', target: 'beaker', tolerance: 0, hint: '将量筒中的水倒入烧杯', errorPrompt: '请将量好的水倒入烧杯中' },
      { id: 's4', order: 4, description: '加入硫酸铜溶液', action: 'add_reagent', target: 'cuso4', tolerance: 0, hint: '选择右侧的硫酸铜溶液', errorPrompt: '请添加硫酸铜溶液', safetyNote: '硫酸铜溶液有毒，避免接触皮肤' },
      { id: 's5', order: 5, description: '用玻璃棒搅拌', action: 'stir', target: 'stirrer', tolerance: 0, hint: '用玻璃棒沿同一方向搅拌', errorPrompt: '请搅拌使溶液混合均匀' },
      { id: 's6', order: 6, description: '观察溶液颜色变化', action: 'observe', target: 'solution', tolerance: 0, hint: '观察并记录溶液颜色', errorPrompt: '请仔细观察溶液的变化' },
    ],
    requiredApparatus: ['graduated_cylinder', 'beaker', 'stirrer'],
    requiredReagents: ['water', 'cuso4'],
    successCondition: '配制出均匀的硫酸铜溶液',
  },
  {
    id: 'temperature_control',
    title: '温度控制实验',
    steps: [
      { id: 'tc1', order: 1, description: '选择烧杯放在实验台上', action: 'select_apparatus', target: 'beaker', tolerance: 0, hint: '选择烧杯作为加热容器', errorPrompt: '请先放置烧杯' },
      { id: 'tc2', order: 2, description: '加入蒸馏水', action: 'add_reagent', target: 'water', tolerance: 0, hint: '加入适量蒸馏水', errorPrompt: '请先向烧杯中加水' },
      { id: 'tc3', order: 3, description: '放置酒精灯', action: 'select_apparatus', target: 'bunsen_burner', tolerance: 0, hint: '选择酒精灯', errorPrompt: '请选择酒精灯进行加热' },
      { id: 'tc4', order: 4, description: '将温度控制在60°C', action: 'control_temperature', target: 'temp:60', tolerance: 10, hint: '调整加热强度使温度稳定在60°C左右', errorPrompt: '温度超出允许范围，请调整加热', safetyNote: '加热时不要将试管口对着自己或他人' },
      { id: 'tc5', order: 5, description: '观察加热现象', action: 'observe', target: 'heating', tolerance: 0, hint: '观察水中气泡的变化', errorPrompt: '请观察实验现象' },
      { id: 'tc6', order: 6, description: '熄灭酒精灯', action: 'heat', target: 'bunsen_burner_off', tolerance: 0, hint: '用灯帽盖灭酒精灯', errorPrompt: '请正确熄灭酒精灯', safetyNote: '不可用嘴吹灭酒精灯，必须用灯帽盖灭' },
    ],
    requiredApparatus: ['beaker', 'bunsen_burner', 'thermometer'],
    requiredReagents: ['water'],
    successCondition: '成功控制温度并观察加热现象',
  },
  {
    id: 'acid_base',
    title: '酸碱中和反应',
    steps: [
      { id: 'ab1', order: 1, description: '选择锥形瓶', action: 'select_apparatus', target: 'flask', tolerance: 0, hint: '酸碱中和实验使用锥形瓶', errorPrompt: '请选择锥形瓶' },
      { id: 'ab2', order: 2, description: '加入氢氧化钠溶液', action: 'add_reagent', target: 'naoh', tolerance: 0, hint: '先加入碱溶液', errorPrompt: '请先加入氢氧化钠溶液', safetyNote: '氢氧化钠有强腐蚀性，操作需谨慎' },
      { id: 'ab3', order: 3, description: '滴加酚酞指示剂', action: 'drop', target: 'phenolphthalein', tolerance: 0, hint: '用胶头滴管滴加2-3滴酚酞', errorPrompt: '请添加酚酞指示剂' },
      { id: 'ab4', order: 4, description: '观察颜色变红', action: 'observe', target: 'color_red', tolerance: 0, hint: '酚酞在碱性环境中变红', errorPrompt: '请先观察碱液中指示剂的颜色' },
      { id: 'ab5', order: 5, description: '逐滴加入盐酸', action: 'drop', target: 'hcl', tolerance: 0, hint: '慢慢滴加盐酸并不断摇匀', errorPrompt: '请逐滴加入盐酸', safetyNote: '酸碱中和会放热，注意控制滴加速度' },
      { id: 'ab6', order: 6, description: '观察红色褪去', action: 'observe', target: 'color_fade', tolerance: 0, hint: '当溶液变无色时说明达到中和点', errorPrompt: '请观察颜色变化' },
    ],
    requiredApparatus: ['flask', 'dropper'],
    requiredReagents: ['naoh', 'hcl', 'phenolphthalein'],
    successCondition: '完成酸碱中和反应并观察指示剂变色',
  },
  {
    id: 'precipitate',
    title: '沉淀反应',
    steps: [
      { id: 'p1', order: 1, description: '选择试管', action: 'select_apparatus', target: 'test_tube', tolerance: 0, hint: '沉淀实验使用试管', errorPrompt: '请选择试管' },
      { id: 'p2', order: 2, description: '加入氯化钡溶液', action: 'add_reagent', target: 'bacl2', tolerance: 0, hint: '先加入含钡离子的溶液', errorPrompt: '请先加入氯化钡溶液', safetyNote: '氯化钡有毒，切勿入口' },
      { id: 'p3', order: 3, description: '加入硫酸钠溶液', action: 'add_reagent', target: 'na2so4', tolerance: 0, hint: '再加入硫酸根离子溶液', errorPrompt: '请加入硫酸钠溶液' },
      { id: 'p4', order: 4, description: '观察白色沉淀生成', action: 'observe', target: 'precipitate_white', tolerance: 0, hint: '钡离子与硫酸根反应生成白色沉淀', errorPrompt: '请观察沉淀现象' },
      { id: 'p5', order: 5, description: '用漏斗过滤', action: 'filter', target: 'funnel', tolerance: 0, hint: '安装过滤装置进行过滤', errorPrompt: '请使用漏斗过滤沉淀', safetyNote: '过滤时注意不要将滤液洒出' },
      { id: 'p6', order: 6, description: '收集并观察沉淀', action: 'observe', target: 'precipitate_collected', tolerance: 0, hint: '观察滤纸上的沉淀', errorPrompt: '请收集并观察沉淀' },
    ],
    requiredApparatus: ['test_tube', 'funnel'],
    requiredReagents: ['bacl2', 'na2so4'],
    successCondition: '成功生成并分离沉淀',
  },
  {
    id: 'comprehensive',
    title: '综合实验',
    steps: [
      { id: 'c1', order: 1, description: '选择量筒量取蒸馏水', action: 'measure', target: 'water:40', tolerance: 5, hint: '量取40mL蒸馏水', errorPrompt: '请准确量取蒸馏水', safetyNote: '量取时注意视线' },
      { id: 'c2', order: 2, description: '将水倒入烧杯', action: 'pour', target: 'beaker', tolerance: 0, hint: '倒入烧杯中', errorPrompt: '请倒入烧杯' },
      { id: 'c3', order: 3, description: '加入硫酸铜溶液', action: 'add_reagent', target: 'cuso4', tolerance: 0, hint: '加入硫酸铜溶液', errorPrompt: '请加入硫酸铜溶液' },
      { id: 'c4', order: 4, description: '用酒精灯加热至70°C', action: 'control_temperature', target: 'temp:70', tolerance: 10, hint: '控制温度在70°C', errorPrompt: '温度控制不准确', safetyNote: '加热时注意安全' },
      { id: 'c5', order: 5, description: '逐滴加入氢氧化钠溶液', action: 'drop', target: 'naoh', tolerance: 0, hint: '逐滴加入并搅拌', errorPrompt: '请逐滴加入', safetyNote: '氢氧化钠有腐蚀性' },
      { id: 'c6', order: 6, description: '观察蓝色沉淀生成', action: 'observe', target: 'precipitate_blue', tolerance: 0, hint: '观察蓝色沉淀', errorPrompt: '请观察现象' },
      { id: 'c7', order: 7, description: '过滤收集沉淀', action: 'filter', target: 'funnel', tolerance: 0, hint: '使用漏斗过滤', errorPrompt: '请进行过滤操作' },
      { id: 'c8', order: 8, description: '记录实验结果', action: 'observe', target: 'final_result', tolerance: 0, hint: '记录最终结果', errorPrompt: '请记录实验结果' },
    ],
    requiredApparatus: ['graduated_cylinder', 'beaker', 'bunsen_burner', 'thermometer', 'funnel', 'stirrer'],
    requiredReagents: ['water', 'cuso4', 'naoh'],
    successCondition: '完成综合实验并正确记录结果',
  },
];

export function getExperimentById(id: string): Experiment | undefined {
  return experiments.find(e => e.id === id);
}
