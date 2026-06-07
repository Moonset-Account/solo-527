const metricsConfig = {
  load: {
    id: 'load',
    name: '训练负荷',
    unit: 'AU',
    category: 'performance',
    description: '综合训练负荷值',
    calculation: '强度 × 组数 × 次数',
    thresholds: { low: 200, medium: 500, high: 800 }
  },
  intensity: {
    id: 'intensity',
    name: '训练强度',
    unit: '%',
    category: 'performance',
    description: '平均训练强度百分比',
    calculation: '实际强度/计划强度 × 100%',
    thresholds: { low: 60, medium: 80, high: 95 }
  },
  volume: {
    id: 'volume',
    name: '训练量',
    unit: 'kg',
    category: 'performance',
    description: '总训练重量',
    calculation: 'Σ(重量 × 组数 × 次数)',
    thresholds: { low: 5000, medium: 10000, high: 20000 }
  },
  heartRate: {
    id: 'heartRate',
    name: '平均心率',
    unit: 'bpm',
    category: 'physiology',
    description: '训练期间平均心率',
    calculation: '心率数据平均值',
    thresholds: { low: 100, medium: 140, high: 170 }
  },
  recovery: {
    id: 'recovery',
    name: '恢复评分',
    unit: '分',
    category: 'recovery',
    description: '综合恢复评分',
    calculation: '睡眠×0.3 + 疲劳×0.3 + 酸痛×0.2 + 情绪×0.2',
    thresholds: { low: 40, medium: 60, high: 80 }
  },
  completionRate: {
    id: 'completionRate',
    name: '完成率',
    unit: '%',
    category: 'performance',
    description: '训练计划完成率',
    calculation: '实际完成/计划 × 100%',
    thresholds: { low: 70, medium: 90, high: 100 }
  }
};

const radarMetrics = [
  { key: 'strength', name: '力量', max: 100 },
  { key: 'endurance', name: '耐力', max: 100 },
  { key: 'speed', name: '速度', max: 100 },
  { key: 'power', name: '爆发力', max: 100 },
  { key: 'flexibility', name: '柔韧性', max: 100 },
  { key: 'recovery', name: '恢复能力', max: 100 }
];

module.exports = { metricsConfig, radarMetrics };
