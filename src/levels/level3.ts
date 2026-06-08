import { LevelConfig } from '../data/types.js';

export const level3: LevelConfig = {
  id: 'level3',
  name: '站台停靠',
  description: 'Junction + platform, 4 trains with stops',
  timeLimit: 180,
  nodes: [
    { id: 'entry_a', x: 140, y: 360, type: 'endpoint', connections: ['j1'] },
    { id: 'j1', x: 360, y: 360, type: 'junction', connections: ['entry_a', 'p1', 'exit_d'], switchState: 0 },
    { id: 'p1', x: 600, y: 230, type: 'platform', connections: ['j1', 's1'], platformId: '1号站台' },
    { id: 's1', x: 800, y: 230, type: 'signal', connections: ['p1', 'exit_c'], signalState: 'green' },
    { id: 'exit_c', x: 1060, y: 230, type: 'endpoint', connections: ['s1'] },
    { id: 'exit_d', x: 1060, y: 490, type: 'endpoint', connections: ['j1'] },
  ],
  edges: [
    { from: 'entry_a', to: 'j1', length: 10, speedLimit: 80 },
    { from: 'j1', to: 'p1', length: 10, speedLimit: 80 },
    { from: 'p1', to: 's1', length: 10, speedLimit: 80 },
    { from: 's1', to: 'exit_c', length: 10, speedLimit: 80 },
    { from: 'j1', to: 'exit_d', length: 10, speedLimit: 80 },
  ],
  trains: [
    {
      id: 'T1', type: 'passenger', name: '101', color: 0x4a90d9, speed: 80, priority: 3,
      path: ['entry_a', 'j1', 'p1', 's1', 'exit_c'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 5, departureTime: 5, action: 'pass' },
        { nodeId: 'p1', arrivalTime: 15, departureTime: 25, action: 'stop' },
      ],
    },
    {
      id: 'T2', type: 'freight', name: '201', color: 0xd97b4a, speed: 55, priority: 1,
      path: ['entry_a', 'j1', 'exit_d'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [{ nodeId: 'entry_a', arrivalTime: 8, departureTime: 8, action: 'pass' }],
    },
    {
      id: 'T3', type: 'passenger', name: '102', color: 0x6366f1, speed: 75, priority: 2,
      path: ['entry_a', 'j1', 'p1', 's1', 'exit_c'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 30, departureTime: 30, action: 'pass' },
        { nodeId: 'p1', arrivalTime: 40, departureTime: 50, action: 'stop' },
      ],
    },
    {
      id: 'T4', type: 'freight', name: '202', color: 0xf59e0b, speed: 50, priority: 1,
      path: ['entry_a', 'j1', 'exit_d'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [{ nodeId: 'entry_a', arrivalTime: 35, departureTime: 35, action: 'pass' }],
    },
  ],
  starThresholds: { one: 180, two: 140, three: 100 },
  tutorialSteps: [
    { highlightNodeIds: ['p1'], message: '站台同一时间只能停一辆列车，注意错开到站时间', waitForAction: 'none' },
  ],
};
