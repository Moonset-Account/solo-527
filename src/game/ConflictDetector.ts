import { Conflict, Train as TrainData } from '../data/types.js';
import { TrackNetwork } from './TrackNetwork.js';

export class ConflictDetector {
  static detectPotentialConflicts(
    network: TrackNetwork,
    trainsData: TrainData[]
  ): Conflict[] {
    const conflicts: Conflict[] = [];
    const nodes = network.getAllNodes();

    for (const node of nodes) {
      if (node.type === 'platform') {
        const trainsAtPlatform = trainsData.filter(t =>
          t.schedule.some(s => s.nodeId === node.id && s.action === 'stop')
        );
        for (let i = 0; i < trainsAtPlatform.length; i++) {
          for (let j = i + 1; j < trainsAtPlatform.length; j++) {
            const a = trainsAtPlatform[i];
            const b = trainsAtPlatform[j];
            const aSchedule = a.schedule.find(s => s.nodeId === node.id)!;
            const bSchedule = b.schedule.find(s => s.nodeId === node.id)!;
            if (aSchedule.arrivalTime < bSchedule.departureTime &&
                bSchedule.arrivalTime < aSchedule.departureTime) {
              conflicts.push({
                type: 'platform_occupied',
                severity: 'warning',
                trains: [a.id, b.id],
                location: node.id,
                time: Math.min(aSchedule.arrivalTime, bSchedule.arrivalTime),
                message: `⚠ 站台 ${node.platformId ?? node.id}: ${a.name}(${formatScheduleTime(aSchedule)}) 和 ${b.name}(${formatScheduleTime(bSchedule)}) 时间重叠`,
              });
            }
          }
        }
      }
    }

    for (let i = 0; i < trainsData.length; i++) {
      for (let j = i + 1; j < trainsData.length; j++) {
        const aPath = trainsData[i].path;
        const bPath = trainsData[j].path;
        for (const aNode of aPath) {
          if (bPath.includes(aNode)) {
            const aNode2 = network.getNode(aNode);
            if (aNode2 && aNode2.type !== 'platform' && aNode2.type !== 'endpoint') {
              const aSched = trainsData[i].schedule.find(s => s.nodeId === aNode);
              const bSched = trainsData[j].schedule.find(s => s.nodeId === aNode);
              if (aSched && bSched && Math.abs(aSched.arrivalTime - bSched.arrivalTime) < 3) {
                conflicts.push({
                  type: 'same_track',
                  severity: 'warning',
                  trains: [trainsData[i].id, trainsData[j].id],
                  location: aNode,
                  time: Math.min(aSched.arrivalTime, bSched.arrivalTime),
                  message: `⚠ ${trainsData[i].name} 和 ${trainsData[j].name} 可能在节点 ${aNode} 冲突`,
                });
              }
            }
          }
        }
      }
    }

    return conflicts;
  }
}

function formatScheduleTime(entry: { arrivalTime: number; departureTime: number }): string {
  return `${Math.floor(entry.arrivalTime / 60)}:${(entry.arrivalTime % 60).toString().padStart(2, '0')}-${Math.floor(entry.departureTime / 60)}:${(entry.departureTime % 60).toString().padStart(2, '0')}`;
}
