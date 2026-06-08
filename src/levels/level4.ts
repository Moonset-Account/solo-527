import { LevelConfig } from '../data/types.js';

export const level4: LevelConfig = {
  id: 'level4',
  name: '晚点连锁',
  description: 'Signals + priority, 4 trains on parallel tracks',
  timeLimit: 180,
  nodes: [
    { id: 'entry_a', x: 100, y: 360, type: 'endpoint', connections: ['s1', 's3'] },
    { id: 's1', x: 280, y: 210, type: 'signal', connections: ['entry_a', 'p1'], signalState: 'green' },
    { id: 'p1', x: 480, y: 210, type: 'platform', connections: ['s1', 's2'], platformId: '1号站台' },
    { id: 's2', x: 680, y: 210, type: 'signal', connections: ['p1', 'exit_c'], signalState: 'green' },
    { id: 'exit_c', x: 1060, y: 210, type: 'endpoint', connections: ['s2'] },
    { id: 's3', x: 280, y: 510, type: 'signal', connections: ['entry_a', 'p2'], signalState: 'green' },
    { id: 'p2', x: 480, y: 510, type: 'platform', connections: ['s3', 's4'], platformId: '2号站台' },
    { id: 's4', x: 680, y: 510, type: 'signal', connections: ['p2', 'exit_e'], signalState: 'green' },
    { id: 'exit_e', x: 1060, y: 510, type: 'endpoint', connections: ['s4'] },
  ],
  edges: [
    { from: 'entry_a', to: 's1', length: 8, speedLimit: 100 },
    { from: 's1', to: 'p1', length: 8, speedLimit: 100 },
    { from: 'p1', to: 's2', length: 8, speedLimit: 100 },
    { from: 's2', to: 'exit_c', length: 8, speedLimit: 100 },
    { from: 'entry_a', to: 's3', length: 8, speedLimit: 100 },
    { from: 's3', to: 'p2', length: 8, speedLimit: 100 },
    { from: 'p2', to: 's4', length: 8, speedLimit: 100 },
    { from: 's4', to: 'exit_e', length: 8, speedLimit: 100 },
  ],
  trains: [
    {
      id: 'T1', type: 'passenger', name: '101', color: 0x4a90d9, speed: 85, priority: 3,
      path: ['entry_a', 's1', 'p1', 's2', 'exit_c'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 3, departureTime: 3, action: 'pass' },
        { nodeId: 'p1', arrivalTime: 12, departureTime: 22, action: 'stop' },
      ],
    },
    {
      id: 'T2', type: 'freight', name: '201', color: 0xd97b4a, speed: 50, priority: 1,
      path: ['entry_a', 's3', 'p2', 's4', 'exit_e'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 6, departureTime: 6, action: 'pass' },
        { nodeId: 'p2', arrivalTime: 18, departureTime: 28, action: 'stop' },
      ],
    },
    {
      id: 'T3', type: 'passenger', name: '102', color: 0x6366f1, speed: 70, priority: 2,
      path: ['entry_a', 's1', 'p1', 's2', 'exit_c'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 25, departureTime: 25, action: 'pass' },
        { nodeId: 'p1', arrivalTime: 35, departureTime: 45, action: 'stop' },
      ],
    },
    {
      id: 'T4', type: 'freight', name: '202', color: 0xf59e0b, speed: 45, priority: 1,
      path: ['entry_a', 's3', 'p2', 's4', 'exit_e'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 30, departureTime: 30, action: 'pass' },
        { nodeId: 'p2', arrivalTime: 40, departureTime: 50, action: 'stop' },
      ],
    },
  ],
  starThresholds: { one: 180, two: 140, three: 100 },
  tutorialSteps: [
    { highlightNodeIds: ['s1', 's3'], message: '用信号灯控制列车放行时机，防止晚点连锁反应', waitForAction: 'signal' },
  ],
};
