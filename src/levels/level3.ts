import { LevelConfig } from '@/types/game'

const level3: LevelConfig = {
  id: 'level-3',
  name: '交通瘫痪',
  description: '城市交通网络遭遇连环事故，多个交通枢纽同时瘫痪，你需要在混乱中恢复城市通行。',
  difficulty: 3,
  duration: 180,
  gridCols: 5,
  gridRows: 5,
  zones: [
    { id: 'zone-3-1', name: '东区居民区', gridX: 0, gridY: 0, type: 'residential', health: 100, population: 6000 },
    { id: 'zone-3-2', name: '西区居民区', gridX: 4, gridY: 0, type: 'residential', health: 100, population: 5500 },
    { id: 'zone-3-3', name: '南区居民区', gridX: 2, gridY: 4, type: 'residential', health: 100, population: 5000 },
    { id: 'zone-3-4', name: '中心商业区', gridX: 2, gridY: 2, type: 'commercial', health: 100, population: 4000 },
    { id: 'zone-3-5', name: '中心医院', gridX: 1, gridY: 2, type: 'hospital', health: 100, population: 900 },
    { id: 'zone-3-6', name: '北部交通枢纽', gridX: 2, gridY: 0, type: 'transport', health: 100, population: 3000 },
    { id: 'zone-3-7', name: '东部交通枢纽', gridX: 4, gridY: 2, type: 'transport', health: 100, population: 2500 },
    { id: 'zone-3-8', name: '南部交通枢纽', gridX: 2, gridY: 3, type: 'transport', health: 100, population: 2800 },
    { id: 'zone-3-9', name: '西部发电站', gridX: 0, gridY: 3, type: 'powerplant', health: 100, population: 200 },
  ],
  events: [
    {
      id: 'event-3-1', type: 'traffic', name: '北部拥堵', description: '北部交通枢纽发生多车追尾，主干道完全堵塞。', triggerTime: 5, affectedZoneIds: ['zone-3-6'], urgency: 'high', timeLimit: 25, requiredTeams: 2, requiredSupplies: 1, delayImpact: 20, costImpact: 20, satisfactionImpact: 15,
    },
    {
      id: 'event-3-2', type: 'storm', name: '暴风雨', description: '暴风雨突袭城市，能见度骤降，多个区域受到影响。', triggerTime: 30, affectedZoneIds: ['zone-3-1', 'zone-3-2'], urgency: 'medium', timeLimit: 30, requiredTeams: 1, requiredSupplies: 2, delayImpact: 15, costImpact: 20, satisfactionImpact: 10,
    },
    {
      id: 'event-3-3', type: 'traffic', name: '东部连环事故', description: '东部交通枢纽因雨天路滑发生连环碰撞，交通彻底中断。', triggerTime: 60, affectedZoneIds: ['zone-3-7'], urgency: 'critical', timeLimit: 20, requiredTeams: 2, requiredSupplies: 2, delayImpact: 30, costImpact: 35, satisfactionImpact: 25,
    },
    {
      id: 'event-3-4', type: 'blackout', name: '区域停电', description: '暴风雨导致西部发电站故障，周边区域供电中断。', triggerTime: 100, affectedZoneIds: ['zone-3-9', 'zone-3-5'], urgency: 'high', timeLimit: 25, requiredTeams: 2, requiredSupplies: 1, delayImpact: 25, costImpact: 30, satisfactionImpact: 20,
    },
    {
      id: 'event-3-5', type: 'flood', name: '南部内涝', description: '南部交通枢纽和居民区因暴雨积水严重，道路无法通行。', triggerTime: 140, affectedZoneIds: ['zone-3-8', 'zone-3-3'], urgency: 'critical', timeLimit: 20, requiredTeams: 3, requiredSupplies: 2, delayImpact: 35, costImpact: 40, satisfactionImpact: 25,
    },
  ],
  resources: [
    { id: 'res-3-1', type: 'repair_team', name: '维修队', total: 4 },
    { id: 'res-3-2', type: 'supply', name: '应急物资', total: 3 },
    { id: 'res-3-3', type: 'vehicle', name: '应急车辆', total: 2 },
  ],
  thresholds: { maxDelay: 150, maxCost: 120, minSatisfaction: 40 },
}

export default level3
