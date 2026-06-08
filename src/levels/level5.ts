import { LevelConfig } from '@/types/game'

const level5: LevelConfig = {
  id: 'level-5',
  name: '全城紧急',
  description: '城市遭受史无前例的多重灾难同时侵袭，暴风雨、停电、交通瘫痪、火灾和内涝同时爆发，全城进入紧急状态。',
  difficulty: 5,
  duration: 240,
  gridCols: 6,
  gridRows: 6,
  zones: [
    { id: 'zone-5-1', name: '东区居民区', gridX: 0, gridY: 0, type: 'residential', health: 100, population: 8000 },
    { id: 'zone-5-2', name: '西区居民区', gridX: 5, gridY: 1, type: 'residential', health: 100, population: 7500 },
    { id: 'zone-5-3', name: '南区居民区', gridX: 2, gridY: 5, type: 'residential', health: 100, population: 7000 },
    { id: 'zone-5-4', name: '北区居民区', gridX: 3, gridY: 0, type: 'residential', health: 100, population: 6500 },
    { id: 'zone-5-5', name: '中心商业区', gridX: 3, gridY: 3, type: 'commercial', health: 100, population: 5000 },
    { id: 'zone-5-6', name: '第一医院', gridX: 1, gridY: 2, type: 'hospital', health: 100, population: 1200 },
    { id: 'zone-5-7', name: '第二医院', gridX: 4, gridY: 4, type: 'hospital', health: 100, population: 1000 },
    { id: 'zone-5-8', name: '东部工业区', gridX: 5, gridY: 0, type: 'industrial', health: 100, population: 2500 },
    { id: 'zone-5-9', name: '北部交通枢纽', gridX: 2, gridY: 1, type: 'transport', health: 100, population: 3500 },
    { id: 'zone-5-10', name: '南部交通枢纽', gridX: 3, gridY: 5, type: 'transport', health: 100, population: 3000 },
    { id: 'zone-5-11', name: '主发电站', gridX: 0, gridY: 3, type: 'powerplant', health: 100, population: 300 },
    { id: 'zone-5-12', name: '备用发电站', gridX: 5, gridY: 5, type: 'powerplant', health: 100, population: 200 },
  ],
  events: [
    {
      id: 'event-5-1', type: 'storm', name: '超级暴风雨', description: '超强暴风雨席卷全城，东部和北部居民区率先遭受冲击。', triggerTime: 5, affectedZoneIds: ['zone-5-1', 'zone-5-4'], urgency: 'high', timeLimit: 20, requiredTeams: 2, requiredSupplies: 2, delayImpact: 20, costImpact: 25, satisfactionImpact: 15,
    },
    {
      id: 'event-5-2', type: 'blackout', name: '主电站故障', description: '主发电站遭受雷击严重受损，大范围区域供电中断。', triggerTime: 20, affectedZoneIds: ['zone-5-11', 'zone-5-6', 'zone-5-9'], urgency: 'critical', timeLimit: 18, requiredTeams: 2, requiredSupplies: 2, delayImpact: 35, costImpact: 40, satisfactionImpact: 25,
    },
    {
      id: 'event-5-3', type: 'traffic', name: '北部交通瘫痪', description: '暴风雨导致北部交通枢纽完全瘫痪，救援通道被切断。', triggerTime: 40, affectedZoneIds: ['zone-5-9'], urgency: 'high', timeLimit: 20, requiredTeams: 2, requiredSupplies: 1, delayImpact: 25, costImpact: 30, satisfactionImpact: 20,
    },
    {
      id: 'event-5-4', type: 'fire', name: '工业区大火', description: '停电导致东部工业区设备失控引发大火，浓烟弥漫。', triggerTime: 65, affectedZoneIds: ['zone-5-8'], urgency: 'critical', timeLimit: 15, requiredTeams: 3, requiredSupplies: 2, delayImpact: 40, costImpact: 50, satisfactionImpact: 30,
    },
    {
      id: 'event-5-5', type: 'flood', name: '南区严重内涝', description: '持续暴雨使南区居民区和交通枢纽积水严重，居民被困。', triggerTime: 90, affectedZoneIds: ['zone-5-3', 'zone-5-10'], urgency: 'critical', timeLimit: 18, requiredTeams: 3, requiredSupplies: 2, delayImpact: 35, costImpact: 40, satisfactionImpact: 25,
    },
    {
      id: 'event-5-6', type: 'storm', name: '暴风雨第二波', description: '暴风雨再度加强，西区居民区和商业区遭受重创。', triggerTime: 120, affectedZoneIds: ['zone-5-2', 'zone-5-5'], urgency: 'high', timeLimit: 18, requiredTeams: 2, requiredSupplies: 2, delayImpact: 25, costImpact: 30, satisfactionImpact: 20,
    },
    {
      id: 'event-5-7', type: 'blackout', name: '备用电站故障', description: '备用发电站也因过载停运，全城陷入彻底黑暗。', triggerTime: 160, affectedZoneIds: ['zone-5-12', 'zone-5-7', 'zone-5-5'], urgency: 'critical', timeLimit: 15, requiredTeams: 3, requiredSupplies: 2, delayImpact: 40, costImpact: 45, satisfactionImpact: 30,
    },
    {
      id: 'event-5-8', type: 'flood', name: '全城内涝', description: '排水系统全面崩溃，城区多处被淹，第一医院也面临积水威胁。', triggerTime: 195, affectedZoneIds: ['zone-5-1', 'zone-5-6', 'zone-5-4'], urgency: 'critical', timeLimit: 15, requiredTeams: 3, requiredSupplies: 3, delayImpact: 45, costImpact: 50, satisfactionImpact: 35,
    },
  ],
  resources: [
    { id: 'res-5-1', type: 'repair_team', name: '维修队', total: 5 },
    { id: 'res-5-2', type: 'supply', name: '应急物资', total: 4 },
    { id: 'res-5-3', type: 'vehicle', name: '应急车辆', total: 3 },
  ],
  thresholds: { maxDelay: 200, maxCost: 180, minSatisfaction: 50 },
}

export default level5
