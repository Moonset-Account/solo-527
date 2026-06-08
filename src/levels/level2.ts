import { LevelConfig } from '@/types/game'

const level2: LevelConfig = {
  id: 'level-2',
  name: '停电危机',
  description: '城市核心区域突发大规模停电，工业区受到波及，你需要在黑暗中维持关键设施运转。',
  difficulty: 2,
  duration: 150,
  gridCols: 4,
  gridRows: 4,
  zones: [
    { id: 'zone-2-1', name: '东区居民区', gridX: 0, gridY: 0, type: 'residential', health: 100, population: 5000 },
    { id: 'zone-2-2', name: '西区居民区', gridX: 3, gridY: 0, type: 'residential', health: 100, population: 4500 },
    { id: 'zone-2-3', name: '中心商业区', gridX: 2, gridY: 1, type: 'commercial', health: 100, population: 3000 },
    { id: 'zone-2-4', name: '中心医院', gridX: 1, gridY: 2, type: 'hospital', health: 100, population: 800 },
    { id: 'zone-2-5', name: '南部工业区', gridX: 3, gridY: 3, type: 'industrial', health: 100, population: 1500 },
    { id: 'zone-2-6', name: '北部发电站', gridX: 0, gridY: 3, type: 'powerplant', health: 100, population: 200 },
    { id: 'zone-2-7', name: '南部交通枢纽', gridX: 2, gridY: 3, type: 'transport', health: 100, population: 2000 },
  ],
  events: [
    {
      id: 'event-2-1', type: 'blackout', name: '核心区停电', description: '城市核心区域突然断电，商业区和医院供电中断。', triggerTime: 5, affectedZoneIds: ['zone-2-3', 'zone-2-4'], urgency: 'critical', timeLimit: 30, requiredTeams: 2, requiredSupplies: 1, delayImpact: 25, costImpact: 30, satisfactionImpact: 20,
    },
    {
      id: 'event-2-2', type: 'blackout', name: '停电连锁反应', description: '停电范围扩大，工业区也失去电力，生产线被迫停工。', triggerTime: 40, affectedZoneIds: ['zone-2-5', 'zone-2-7'], urgency: 'high', timeLimit: 25, requiredTeams: 2, requiredSupplies: 2, delayImpact: 30, costImpact: 35, satisfactionImpact: 20,
    },
    {
      id: 'event-2-3', type: 'storm', name: '雷暴来袭', description: '雷暴天气加剧了电力系统的负担，居民区也受到影响。', triggerTime: 70, affectedZoneIds: ['zone-2-1', 'zone-2-2'], urgency: 'medium', timeLimit: 30, requiredTeams: 1, requiredSupplies: 2, delayImpact: 15, costImpact: 20, satisfactionImpact: 15,
    },
    {
      id: 'event-2-4', type: 'fire', name: '工业区火灾', description: '停电期间工业区设备故障引发火灾，情况紧急。', triggerTime: 110, affectedZoneIds: ['zone-2-5'], urgency: 'critical', timeLimit: 20, requiredTeams: 2, requiredSupplies: 2, delayImpact: 35, costImpact: 40, satisfactionImpact: 25,
    },
  ],
  resources: [
    { id: 'res-2-1', type: 'repair_team', name: '维修队', total: 3 },
    { id: 'res-2-2', type: 'supply', name: '应急物资', total: 3 },
    { id: 'res-2-3', type: 'vehicle', name: '应急车辆', total: 2 },
  ],
  thresholds: { maxDelay: 120, maxCost: 100, minSatisfaction: 40 },
}

export default level2
