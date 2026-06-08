import { LevelConfig } from '@/types/game'

const level4: LevelConfig = {
  id: 'level-4',
  name: '风雨交加',
  description: '暴风雨与停电交替袭来，城市面临双重考验。多个区域同时告急，资源分配的每一个决策都至关重要。',
  difficulty: 4,
  duration: 200,
  gridCols: 5,
  gridRows: 5,
  zones: [
    { id: 'zone-4-1', name: '东区居民区', gridX: 0, gridY: 0, type: 'residential', health: 100, population: 7000 },
    { id: 'zone-4-2', name: '西区居民区', gridX: 4, gridY: 1, type: 'residential', health: 100, population: 6500 },
    { id: 'zone-4-3', name: '南区居民区', gridX: 2, gridY: 4, type: 'residential', health: 100, population: 6000 },
    { id: 'zone-4-4', name: '中心商业区', gridX: 2, gridY: 2, type: 'commercial', health: 100, population: 4500 },
    { id: 'zone-4-5', name: '中心医院', gridX: 1, gridY: 2, type: 'hospital', health: 100, population: 1000 },
    { id: 'zone-4-6', name: '北部工业区', gridX: 3, gridY: 0, type: 'industrial', health: 100, population: 2000 },
    { id: 'zone-4-7', name: '东部交通枢纽', gridX: 4, gridY: 3, type: 'transport', health: 100, population: 3000 },
    { id: 'zone-4-8', name: '南部交通枢纽', gridX: 1, gridY: 4, type: 'transport', health: 100, population: 2800 },
    { id: 'zone-4-9', name: '北部发电站', gridX: 0, gridY: 1, type: 'powerplant', health: 100, population: 250 },
    { id: 'zone-4-10', name: '西部发电站', gridX: 3, gridY: 4, type: 'powerplant', health: 100, population: 200 },
  ],
  events: [
    {
      id: 'event-4-1', type: 'storm', name: '暴风骤雨', description: '猛烈暴风雨横扫城市东部，居民区和商业区受到严重冲击。', triggerTime: 5, affectedZoneIds: ['zone-4-1', 'zone-4-4'], urgency: 'high', timeLimit: 25, requiredTeams: 2, requiredSupplies: 2, delayImpact: 20, costImpact: 25, satisfactionImpact: 15,
    },
    {
      id: 'event-4-2', type: 'blackout', name: '北部大停电', description: '北部发电站因雷击停运，工业区和医院电力中断。', triggerTime: 25, affectedZoneIds: ['zone-4-9', 'zone-4-6', 'zone-4-5'], urgency: 'critical', timeLimit: 20, requiredTeams: 2, requiredSupplies: 1, delayImpact: 30, costImpact: 35, satisfactionImpact: 25,
    },
    {
      id: 'event-4-3', type: 'storm', name: '暴雨持续', description: '暴风雨向西蔓延，西区居民区也陷入困境。', triggerTime: 55, affectedZoneIds: ['zone-4-2'], urgency: 'medium', timeLimit: 25, requiredTeams: 1, requiredSupplies: 2, delayImpact: 15, costImpact: 20, satisfactionImpact: 10,
    },
    {
      id: 'event-4-4', type: 'blackout', name: '西部停电', description: '西部发电站过载跳闸，交通枢纽和南区供电中断。', triggerTime: 80, affectedZoneIds: ['zone-4-10', 'zone-4-7', 'zone-4-3'], urgency: 'critical', timeLimit: 20, requiredTeams: 2, requiredSupplies: 2, delayImpact: 30, costImpact: 35, satisfactionImpact: 25,
    },
    {
      id: 'event-4-5', type: 'storm', name: '风雨再袭', description: '新一轮暴风雨再次袭击城市核心区域，商业区受损加重。', triggerTime: 120, affectedZoneIds: ['zone-4-4', 'zone-4-5'], urgency: 'high', timeLimit: 20, requiredTeams: 2, requiredSupplies: 2, delayImpact: 25, costImpact: 30, satisfactionImpact: 20,
    },
    {
      id: 'event-4-6', type: 'blackout', name: '全面停电', description: '两座发电站同时故障，整个城市陷入黑暗。', triggerTime: 155, affectedZoneIds: ['zone-4-9', 'zone-4-10', 'zone-4-8'], urgency: 'critical', timeLimit: 18, requiredTeams: 3, requiredSupplies: 2, delayImpact: 40, costImpact: 45, satisfactionImpact: 30,
    },
  ],
  resources: [
    { id: 'res-4-1', type: 'repair_team', name: '维修队', total: 4 },
    { id: 'res-4-2', type: 'supply', name: '应急物资', total: 4 },
    { id: 'res-4-3', type: 'vehicle', name: '应急车辆', total: 3 },
  ],
  thresholds: { maxDelay: 180, maxCost: 150, minSatisfaction: 50 },
}

export default level4
