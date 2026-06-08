import { Apparatus } from '@/types/game';

export const apparatus: Apparatus[] = [
  { id: 'beaker', name: '烧杯', type: 'beaker', capacity: 250 },
  { id: 'flask', name: '锥形瓶', type: 'flask', capacity: 250 },
  { id: 'test_tube', name: '试管', type: 'test_tube', capacity: 20 },
  { id: 'thermometer', name: '温度计', type: 'thermometer' },
  { id: 'bunsen_burner', name: '酒精灯', type: 'bunsen_burner' },
  { id: 'dropper', name: '胶头滴管', type: 'dropper' },
  { id: 'stirrer', name: '玻璃棒', type: 'stirrer' },
  { id: 'funnel', name: '漏斗', type: 'funnel' },
  { id: 'graduated_cylinder', name: '量筒', type: 'graduated_cylinder', capacity: 100 },
];

export function getApparatusById(id: string): Apparatus | undefined {
  return apparatus.find(a => a.id === id);
}
