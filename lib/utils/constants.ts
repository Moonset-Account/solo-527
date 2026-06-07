import type { DataDictionaryItem, WaterQualityGrade } from '@/types';

export const MAP_CENTER: [number, number] = [116.4, 39.9];
export const MAP_ZOOM = 10;

export const RIVER_SECTIONS = [
  '上游干流段',
  '中游支流段',
  '下游汇入段',
  '城市景观段',
  '生态修复段',
  '饮用水源段',
];

export const ORGANIZATIONS = [
  '市环境监测中心站',
  '水文水资源勘测局',
  '流域生态环境站',
  '城市排水监测站',
  '农业面源监测站',
  '饮用水源保护站',
];

export const INDICATORS: DataDictionaryItem[] = [
  {
    code: 'temperature',
    name: '水温',
    unit: '°C',
    description: '水体温度，影响溶解氧和微生物活性',
    standard: 35,
    color: '#FB923C',
  },
  {
    code: 'ph',
    name: 'pH',
    unit: '',
    description: '酸碱度，正常范围 6-9',
    standard: 8.5,
    color: '#A855F7',
  },
  {
    code: 'dissolvedOxygen',
    name: '溶解氧',
    unit: 'mg/L',
    description: '溶解在水中的氧气含量，越高水质越好',
    standard: 5,
    color: '#06B6D4',
  },
  {
    code: 'ammoniaNitrogen',
    name: '氨氮',
    unit: 'mg/L',
    description: '水中以游离氨和铵离子形式存在的氮',
    standard: 1.5,
    color: '#EF4444',
  },
];

export const WATER_QUALITY_GRADES: Array<{
  grade: WaterQualityGrade;
  color: string;
  description: string;
}> = [
  { grade: 'Ⅰ', color: '#10B981', description: '优，源头水、国家自然保护区' },
  { grade: 'Ⅱ', color: '#34D399', description: '良好，集中式生活饮用水地表水源地一级保护区' },
  { grade: 'Ⅲ', color: '#FBBF24', description: '良好，集中式生活饮用水地表水源地二级保护区' },
  { grade: 'Ⅳ', color: '#F97316', description: '轻度污染，一般工业用水区及人体非直接接触的娱乐用水区' },
  { grade: 'Ⅴ', color: '#EF4444', description: '中度污染，农业用水区及一般景观要求水域' },
  { grade: '劣Ⅴ', color: '#7F1D1D', description: '重度污染，基本丧失使用功能' },
];
