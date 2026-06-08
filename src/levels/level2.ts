import { LevelConfig } from '../data/types.js';

export const level2: LevelConfig = {
  id: 'level2',
  name: '双岔口',
  description: 'Two junctions in sequence, 3 trains',
  timeLimit: 150,
  nodes: [
    { id: 'entry_a1', x: 140, y: 260, type: 'endpoint', connections: ['j1'] },
    { id: 'entry_a2', x: 140, y: 460, type: 'endpoint', connections: ['j1'] },
    { id: 'j1', x: 400, y: 360, type: 'junction', connections: ['entry_a1', 'entry_a2', 'j2'], switchState: 1 },
    { id: 'j2', x: 740, y: 360, type: 'junction', connections: ['j1', 'exit_b', 'exit_c', 'exit_d'], switchState: 0 },
    { id: 'exit_b', x: 1040, y: 180, type: 'endpoint', connections: ['j2'] },
    { id: 'exit_c', x: 1040, y: 360, type: 'endpoint', connections: ['j2'] },
    { id: 'exit_d', x: 1040, y: 540, type: 'endpoint', connections: ['j2'] },
  ],
  edges: [
    { from: 'entry_a1', to: 'j1', length: 10, speedLimit: 100 },
    { from: 'entry_a2', to: 'j1', length: 10, speedLimit: 100 },
    { from: 'j1', to: 'j2', length: 10, speedLimit: 100 },
    { from: 'j2', to: 'exit_b', length: 10, speedLimit: 100 },
    { from: 'j2', to: 'exit_c', length: 10, speedLimit: 100 },
    { from: 'j2', to: 'exit_d', length: 10, speedLimit: 100 },
  ],
  trains: [
    {
      id: 'T1', type: 'passenger', name: '101', color: 0x4a90d9, speed: 85, priority: 3,
      path: ['entry_a1', 'j1', 'j2', 'exit_b'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [{ nodeId: 'entry_a1', arrivalTime: 5, departureTime: 5, action: 'pass' }],
    },
    {
      id: 'T2', type: 'freight', name: '201', color: 0xd97b4a, speed: 55, priority: 1,
      path: ['entry_a2', 'j1', 'j2', 'exit_c'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [{ nodeId: 'entry_a2', arrivalTime: 12, departureTime: 12, action: 'pass' }],
    },
    {
      id: 'T3', type: 'passenger', name: '102', color: 0x6366f1, speed: 75, priority: 2,
      path: ['entry_a1', 'j1', 'j2', 'exit_d'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [{ nodeId: 'entry_a1', arrivalTime: 25, departureTime: 25, action: 'pass' }],
    },
  ],
  starThresholds: { one: 150, two: 120, three: 90 },
  tutorialSteps: [
    { highlightNodeIds: ['j1', 'j2'], message: '两个岔口需要协调切换，确保每辆列车走上正确轨道', waitForAction: 'switch' },
  ],
};
