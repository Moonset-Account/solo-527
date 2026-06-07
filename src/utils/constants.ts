import type { DataDictionary, IndicatorConfig, WaterQualityGrade } from '../types';

export const INDICATORS: IndicatorConfig[] = [
  {
    code: 'temperature',
    name: '水温',
    unit: '°C',
    standardMin: 0,
    standardMax: 35,
    color: '#F97316',
    gradeThresholds: {
      'Ⅰ': 20,
      'Ⅱ': 25,
      'Ⅲ': 30,
      'Ⅳ': 33,
      'Ⅴ': 35,
      '劣Ⅴ': Infinity,
    },
  },
  {
    code: 'ph',
    name: 'pH值',
    unit: '',
    standardMin: 6,
    standardMax: 9,
    color: '#8B5CF6',
    gradeThresholds: {
      'Ⅰ': 7,
      'Ⅱ': 7.5,
      'Ⅲ': 8,
      'Ⅳ': 8.5,
      'Ⅴ': 9,
      '劣Ⅴ': Infinity,
    },
  },
  {
    code: 'dissolvedOxygen',
    name: '溶解氧',
    unit: 'mg/L',
    standardMin: 2,
    standardMax: 15,
    color: '#0EA5E9',
    gradeThresholds: {
      'Ⅰ': 7.5,
      'Ⅱ': 6,
      'Ⅲ': 5,
      'Ⅳ': 3,
      'Ⅴ': 2,
      '劣Ⅴ': -Infinity,
    },
  },
  {
    code: 'ammoniaNitrogen',
    name: '氨氮',
    unit: 'mg/L',
    standardMin: 0,
    standardMax: 2,
    color: '#EF4444',
    gradeThresholds: {
      'Ⅰ': 0.15,
      'Ⅱ': 0.5,
      'Ⅲ': 1.0,
      'Ⅳ': 1.5,
      'Ⅴ': 2.0,
      '劣Ⅴ': Infinity,
    },
  },
];

export const WATER_QUALITY_GRADES = [
  { grade: 'Ⅰ' as WaterQualityGrade, color: '#10B981', description: '优' },
  { grade: 'Ⅱ' as WaterQualityGrade, color: '#34D399', description: '良好' },
  { grade: 'Ⅲ' as WaterQualityGrade, color: '#FBBF24', description: '轻度污染' },
  { grade: 'Ⅳ' as WaterQualityGrade, color: '#F97316', description: '中度污染' },
  { grade: 'Ⅴ' as WaterQualityGrade, color: '#EF4444', description: '重度污染' },
  { grade: '劣Ⅴ' as WaterQualityGrade, color: '#7C2D12', description: '严重污染' },
];

export const RIVER_SECTIONS = [
  '上游干流',
  '中游干流',
  '下游干流',
  '东支流',
  '西支流',
  '南支流',
];

export const ORGANIZATIONS = [
  '市环境监测中心站',
  '区水文水资源局',
  '省水利科学研究院',
  '流域管理局监测中心',
  '第三方检测机构A',
  '第三方检测机构B',
];

export const DATA_DICTIONARY: DataDictionary = {
  indicators: INDICATORS,
  riverSections: RIVER_SECTIONS,
  organizations: ORGANIZATIONS,
  waterQualityGrades: WATER_QUALITY_GRADES,
};

export const MAPBOX_TOKEN = '';
export const MAP_CENTER = [118.7969, 32.0603];
export const MAP_ZOOM = 10;
