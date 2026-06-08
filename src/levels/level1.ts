import { LevelConfig } from '@/types/game'

const level1: LevelConfig = {
  id: 'level-1',
  name: '暴雨初临',
  description: '一场暴雨突然来袭，城市部分区域受到影响。作为新手调度员，你需要合理分配资源，保护市民安全。',
  difficulty: 1,
  duration: 120,
  gridCols: 4,
  gridRows: 4,
  zones: [
    { id: 'zone-1-1', name: '东区居民区', gridX: 0, gridY: 0, type: 'residential', health: 100, population: 5000 },
    { id: 'zone-1-2', name: '西区居民区', gridX: 3, gridY: 3, type: 'residential', health: 100, population: 4500 },
    { id: 'zone-1-3', name: '中心商业区', gridX: 1, gridY: 1, type: 'commercial', health: 100, population: 3000 },
    { id: 'zone-1-4', name: '中心医院', gridX: 2, gridY: 1, type: 'hospital', health: 100, population: 800 },
    { id: 'zone-1-5', name: '南部交通枢纽', gridX: 1, gridY: 3, type: 'transport', health: 100, population: 2000 },
    { id: 'zone-1-6', name: '北部发电站', gridX: 0, gridY: 2, type: 'powerplant', health: 100, population: 200 },
  ],
  events: [
    {
      id: 'event-1-1', type: 'storm', name: '轻度暴雨', description: '东部地区开始降下大雨，部分低洼区域出现积水。', triggerTime: 5, affectedZoneIds: ['zone-1-1'], urgency: 'medium', timeLimit: 40, requiredTeams: 1, requiredSupplies: 1, delayImpact: 10, costImpact: 15, satisfactionImpact: 10,
    },
    {
      id: 'event-1-2', type: 'storm', name: '暴雨加剧', description: '雨势增大，西区也受到影响，商业区出现排水不畅的情况。', triggerTime: 30, affectedZoneIds: ['zone-1-2', 'zone-1-3'], urgency: 'high', timeLimit: 35, requiredTeams: 2, requiredSupplies: 2, delayImpact: 20, costImpact: 25, satisfactionImpact: 15,
    },
    {
      id: 'event-1-3', type: 'flood', name: '局部内涝', description: '持续暴雨导致南部交通枢纽附近出现内涝，道路通行受阻。', triggerTime: 60, affectedZoneIds: ['zone-1-5'], urgency: 'high', timeLimit: 30, requiredTeams: 2, requiredSupplies: 2, delayImpact: 25, costImpact: 30, satisfactionImpact: 20,
    },
  ],
  resources: [
    { id: 'res-1-1', type: 'repair_team', name: '维修队', total: 3 },
    { id: 'res-1-2', type: 'supply', name: '应急物资', total: 4 },
    { id: 'res-1-3', type: 'vehicle', name: '应急车辆', total: 2 },
  ],
  thresholds: { maxDelay: 100, maxCost: 80, minSatisfaction: 30 },
  tutorialSteps: [
    { id: 'tut-1', text: '欢迎来到应急调度中心！当事件发生时，你需要及时分配资源来应对危机。', position: 'bottom' },
    { id: 'tut-2', text: '注意右侧的事件面板，每个事件都有处理时限，超时会造成严重后果。', highlightElement: 'event-panel', position: 'left' },
    { id: 'tut-3', text: '点击事件后，选择需要的维修队和物资数量，然后派遣至受影响区域。', highlightElement: 'dispatch-button', position: 'top' },
    { id: 'tut-4', text: '合理分配有限的资源是关键，同时处理多个事件时需要权衡优先级。', position: 'bottom' },
    { id: 'tut-5', text: '关注市民满意度指标，如果降至最低阈值以下，任务将失败。', highlightElement: 'satisfaction-bar', position: 'right' },
  ],
}

export default level1
