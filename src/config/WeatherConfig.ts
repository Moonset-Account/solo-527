import type { WeatherDefinition } from '@/types';

export const WEATHER_CONFIGS: Record<string, WeatherDefinition> = {
  sunny: {
    type: 'sunny',
    name: '晴朗',
    icon: '☀️',
    description: '天气良好，无任何特殊影响',
    color: '#fff3cd',
    effects: {},
  },
  rain: {
    type: 'rain',
    name: '下雨',
    icon: '🌧️',
    description: '湿滑山路：所有车辆减速15%，部分塔攻击效率降低',
    color: '#a3c2c2',
    effects: {
      enemySpeedMult: 0.85,
      towerFireRateMult: 0.92,
      particleName: 'rain',
    },
  },
  fog: {
    type: 'fog',
    name: '浓雾',
    icon: '🌫️',
    description: '大雾弥漫：所有塔射程降低20%',
    color: '#c9d6df',
    effects: {
      towerRangeMult: 0.8,
      visibilityMult: 0.75,
      particleName: 'fog',
    },
  },
  snow: {
    type: 'snow',
    name: '下雪',
    icon: '🌨️',
    description: '积雪覆盖：所有车辆减速25%，塔攻击效率降低',
    color: '#dfe6e9',
    effects: {
      enemySpeedMult: 0.75,
      towerFireRateMult: 0.88,
      particleName: 'snow',
    },
  },
  typhoon: {
    type: 'typhoon',
    name: '台风',
    icon: '🌀',
    description: '极端天气：所有车辆减速30%，塔射程降低15%，攻击频率降低15%',
    color: '#fab1a0',
    effects: {
      enemySpeedMult: 0.7,
      towerFireRateMult: 0.85,
      towerRangeMult: 0.85,
      particleName: 'typhoon',
    },
  },
};

export function getWeatherConfig(type: string): WeatherDefinition {
  return WEATHER_CONFIGS[type];
}
