import { LevelConfig } from '../data/types.js';

export const level5: LevelConfig = {
  id: 'level5',
  name: '综合调度',
  description: 'All mechanics combined: junctions, signals, platforms, 5 trains',
  timeLimit: 240,
  nodes: [
    { id: 'entry_a', x: 100, y: 360, type: 'endpoint', connections: ['j1'] },
    { id: 'j1', x: 260, y: 360, type: 'junction', connections: ['entry_a', 's1', 's2'], switchState: 0 },
    { id: 's1', x: 430, y: 210, type: 'signal', connections: ['j1', 'p1'], signalState: 'green' },
    { id: 'p1', x: 590, y: 210, type: 'platform', connections: ['s1', 'j2'], platformId: '1号站台' },
    { id: 'j2', x: 750, y: 210, type: 'junction', connections: ['p1', 's3', 'exit_c'], switchState: 0 },
    { id: 's2', x: 430, y: 510, type: 'signal', connections: ['j1', 'p2'], signalState: 'green' },
    { id: 'p2', x: 590, y: 510, type: 'platform', connections: ['s2', 'j3'], platformId: '2号站台' },
    { id: 'j3', x: 750, y: 510, type: 'junction', connections: ['p2', 's3', 'exit_f'], switchState: 0 },
    { id: 's3', x: 910, y: 360, type: 'signal', connections: ['j2', 'j3', 'exit_e'], signalState: 'green' },
    { id: 'exit_c', x: 1080, y: 160, type: 'endpoint', connections: ['j2'] },
    { id: 'exit_e', x: 1080, y: 360, type: 'endpoint', connections: ['s3'] },
    { id: 'exit_f', x: 1080, y: 560, type: 'endpoint', connections: ['j3'] },
  ],
  edges: [
    { from: 'entry_a', to: 'j1', length: 8, speedLimit: 100 },
    { from: 'j1', to: 's1', length: 8, speedLimit: 100 },
    { from: 's1', to: 'p1', length: 8, speedLimit: 100 },
    { from: 'p1', to: 'j2', length: 8, speedLimit: 100 },
    { from: 'j2', to: 's3', length: 8, speedLimit: 100 },
    { from: 'j2', to: 'exit_c', length: 8, speedLimit: 100 },
    { from: 'j1', to: 's2', length: 8, speedLimit: 100 },
    { from: 's2', to: 'p2', length: 8, speedLimit: 100 },
    { from: 'p2', to: 'j3', length: 8, speedLimit: 100 },
    { from: 'j3', to: 's3', length: 8, speedLimit: 100 },
    { from: 'j3', to: 'exit_f', length: 8, speedLimit: 100 },
    { from: 's3', to: 'exit_e', length: 8, speedLimit: 100 },
  ],
  trains: [
    {
      id: 'T1', type: 'passenger', name: '101', color: 0x4a90d9, speed: 85, priority: 3,
      path: ['entry_a', 'j1', 's1', 'p1', 'j2', 's3', 'exit_e'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 3, departureTime: 3, action: 'pass' },
        { nodeId: 'p1', arrivalTime: 15, departureTime: 25, action: 'stop' },
      ],
    },
    {
      id: 'T2', type: 'freight', name: '201', color: 0xd97b4a, speed: 50, priority: 1,
      path: ['entry_a', 'j1', 's2', 'p2', 'j3', 'exit_f'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 5, departureTime: 5, action: 'pass' },
        { nodeId: 'p2', arrivalTime: 20, departureTime: 30, action: 'stop' },
      ],
    },
    {
      id: 'T3', type: 'passenger', name: '102', color: 0x6366f1, speed: 75, priority: 2,
      path: ['entry_a', 'j1', 's1', 'p1', 'j2', 'exit_c'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 28, departureTime: 28, action: 'pass' },
        { nodeId: 'p1', arrivalTime: 38, departureTime: 48, action: 'stop' },
      ],
    },
    {
      id: 'T4', type: 'freight', name: '202', color: 0xf59e0b, speed: 45, priority: 1,
      path: ['entry_a', 'j1', 's2', 'p2', 'j3', 's3', 'exit_e'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 35, departureTime: 35, action: 'pass' },
        { nodeId: 'p2', arrivalTime: 50, departureTime: 60, action: 'stop' },
      ],
    },
    {
      id: 'T5', type: 'passenger', name: '103', color: 0x22d3ee, speed: 80, priority: 2,
      path: ['entry_a', 'j1', 's2', 'p2', 'j3', 'exit_f'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [
        { nodeId: 'entry_a', arrivalTime: 55, departureTime: 55, action: 'pass' },
        { nodeId: 'p2', arrivalTime: 65, departureTime: 75, action: 'stop' },
      ],
    },
  ],
  starThresholds: { one: 240, two: 180, three: 130 },
};
