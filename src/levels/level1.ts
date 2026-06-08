import { LevelConfig } from '../data/types.js';

export const level1: LevelConfig = {
  id: 'level1',
  name: '单岔口',
  description: 'A simple Y-shaped track with one junction',
  timeLimit: 120,
  nodes: [
    { id: 'entry_a', x: 180, y: 360, type: 'endpoint', connections: ['j1'] },
    { id: 'j1', x: 540, y: 360, type: 'junction', connections: ['entry_a', 'exit_b', 'exit_c'], switchState: 0 },
    { id: 'exit_b', x: 900, y: 220, type: 'endpoint', connections: ['j1'] },
    { id: 'exit_c', x: 900, y: 500, type: 'endpoint', connections: ['j1'] },
  ],
  edges: [
    { from: 'entry_a', to: 'j1', length: 10, speedLimit: 100 },
    { from: 'j1', to: 'exit_b', length: 10, speedLimit: 100 },
    { from: 'j1', to: 'exit_c', length: 10, speedLimit: 100 },
  ],
  trains: [
    {
      id: 'T1', type: 'passenger', name: '101', color: 0x4a90d9, speed: 80, priority: 2,
      path: ['entry_a', 'j1', 'exit_b'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [{ nodeId: 'entry_a', arrivalTime: 5, departureTime: 5, action: 'pass' }],
    },
    {
      id: 'T2', type: 'freight', name: '201', color: 0xd97b4a, speed: 60, priority: 1,
      path: ['entry_a', 'j1', 'exit_c'],
      currentPathIndex: 0, progress: 0, delayAmount: 0, state: 'waiting', misrouted: false,
      schedule: [{ nodeId: 'entry_a', arrivalTime: 18, departureTime: 18, action: 'pass' }],
    },
  ],
  starThresholds: { one: 120, two: 90, three: 60 },
  tutorialSteps: [
    { highlightNodeIds: ['j1'], message: '点击岔口切换轨道方向，让列车驶向正确出口', waitForAction: 'switch' },
    { highlightNodeIds: ['j1'], message: '切换岔口为下方轨道，让货车通过', waitForAction: 'switch' },
  ],
};
