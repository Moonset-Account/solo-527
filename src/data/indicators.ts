import { IndicatorStandard, IndicatorKey } from '@/types';

export const INDICATOR_STANDARDS: Record<IndicatorKey, IndicatorStandard> = {
  temperature: {
    name: '水温',
    unit: '℃',
    standard: { min: 0, max: 35 },
    description: '水体温度，直接影响溶解氧饱和度和水生生物的代谢活性。水温异常升高可能导致热污染，降低水体自净能力。',
    detectionMethod: '便携式水质多参数分析仪现场测定，或实验室温度计法（GB 13195-91）',
    limitation: '水温受季节、气候、日照影响较大，单次测量值需结合同期历史数据对比分析。'
  },
  ph: {
    name: 'pH值',
    unit: '',
    standard: { min: 6, max: 9 },
    description: '水体酸碱度的量度。正常淡水水体pH值范围为6-9，超出此范围会影响水生生物生存，也可能表明存在酸碱污染。',
    detectionMethod: '玻璃电极法（GB 6920-86），现场测定需校准电极',
    limitation: 'pH值受水体缓冲能力、二氧化碳含量、生物活动等因素影响，早晚可能存在波动。'
  },
  dissolvedOxygen: {
    name: '溶解氧',
    unit: 'mg/L',
    standard: { min: 5, max: null },
    description: '溶解在水中的氧气含量，是衡量水体自净能力和水生生态系统健康的核心指标。低于5mg/L时鱼类生存受到影响。',
    detectionMethod: '碘量法（GB 7489-87）或电化学探头法（HJ 506-2009）',
    limitation: '溶解氧饱和度受水温、气压、盐度影响，分析时需结合现场温度进行校正。'
  },
  ammoniaNitrogen: {
    name: '氨氮',
    unit: 'mg/L',
    standard: { min: null, max: 1.5 },
    description: '水体中以氨和铵离子形式存在的氮，是水体富营养化和污染的重要指示物。高浓度氨氮对水生生物有毒害作用。',
    detectionMethod: '纳氏试剂分光光度法（HJ 535-2009）或水杨酸分光光度法',
    limitation: '水样采集后需尽快分析，若不能立即测定需酸化固定并低温保存。'
  }
};

export const INDICATOR_COLORS: Record<IndicatorKey, string> = {
  temperature: '#FF6B6B',
  ph: '#4ECDC4',
  dissolvedOxygen: '#45B7D1',
  ammoniaNitrogen: '#96CEB4'
};

export const STATUS_COLORS = {
  normal: '#16C79A',
  warning: '#FFB72B',
  exceed: '#E94560'
};

export const SAMPLE_TYPE_LABELS = {
  manual: '人工采样',
  auto: '自动监测站'
};

export const WATER_QUALITY_GRADES = [
  { grade: 'Ⅰ类', range: '优良', color: '#006837' },
  { grade: 'Ⅱ类', range: '良好', color: '#1a9850' },
  { grade: 'Ⅲ类', range: '轻度污染', color: '#66bd63' },
  { grade: 'Ⅳ类', range: '中度污染', color: '#feb24c' },
  { grade: 'Ⅴ类', range: '重度污染', color: '#fc4e2a' },
  { grade: '劣Ⅴ类', range: '严重污染', color: '#b10026' }
];
