import type { RepairRecord } from '@/types'

export const repairs: RepairRecord[] = [
  { id: 'RP001', stationId: 'S01', bikeId: 'BK001', reportTime: '2026-06-02T09:15:00', reason: 'brake_failure', status: 'completed' },
  { id: 'RP002', stationId: 'S03', bikeId: 'BK002', reportTime: '2026-06-02T11:30:00', reason: 'tire_damage', status: 'completed' },
  { id: 'RP003', stationId: 'S04', bikeId: 'BK003', reportTime: '2026-06-02T14:20:00', reason: 'chain_issue', status: 'completed' },
  { id: 'RP004', stationId: 'S08', bikeId: 'BK004', reportTime: '2026-06-03T08:45:00', reason: 'brake_failure', status: 'repairing' },
  { id: 'RP005', stationId: 'S13', bikeId: 'BK005', reportTime: '2026-06-03T10:10:00', reason: 'other', status: 'completed' },
  { id: 'RP006', stationId: 'S01', bikeId: 'BK006', reportTime: '2026-06-03T13:25:00', reason: 'tire_damage', status: 'completed' },
  { id: 'RP007', stationId: 'S06', bikeId: 'BK007', reportTime: '2026-06-04T07:50:00', reason: 'chain_issue', status: 'repairing' },
  { id: 'RP008', stationId: 'S11', bikeId: 'BK008', reportTime: '2026-06-04T09:30:00', reason: 'brake_failure', status: 'completed' },
  { id: 'RP009', stationId: 'S15', bikeId: 'BK009', reportTime: '2026-06-04T11:45:00', reason: 'tire_damage', status: 'repairing' },
  { id: 'RP010', stationId: 'S02', bikeId: 'BK010', reportTime: '2026-06-04T15:20:00', reason: 'other', status: 'completed' },
  { id: 'RP011', stationId: 'S09', bikeId: 'BK011', reportTime: '2026-06-05T08:10:00', reason: 'chain_issue', status: 'completed' },
  { id: 'RP012', stationId: 'S05', bikeId: 'BK012', reportTime: '2026-06-05T10:35:00', reason: 'brake_failure', status: 'repairing' },
  { id: 'RP013', stationId: 'S14', bikeId: 'BK013', reportTime: '2026-06-05T12:40:00', reason: 'tire_damage', status: 'completed' },
  { id: 'RP014', stationId: 'S07', bikeId: 'BK014', reportTime: '2026-06-05T16:15:00', reason: 'chain_issue', status: 'repairing' },
  { id: 'RP015', stationId: 'S10', bikeId: 'BK015', reportTime: '2026-06-06T08:25:00', reason: 'other', status: 'repairing' },
  { id: 'RP016', stationId: 'S12', bikeId: 'BK016', reportTime: '2026-06-06T11:50:00', reason: 'brake_failure', status: 'completed' },
  { id: 'RP017', stationId: 'S03', bikeId: 'BK017', reportTime: '2026-06-06T14:30:00', reason: 'tire_damage', status: 'repairing' },
  { id: 'RP018', stationId: 'S08', bikeId: 'BK018', reportTime: '2026-06-06T17:10:00', reason: 'chain_issue', status: 'repairing' },
  { id: 'RP019', stationId: 'S01', bikeId: 'BK019', reportTime: '2026-06-07T09:05:00', reason: 'brake_failure', status: 'completed' },
  { id: 'RP020', stationId: 'S13', bikeId: 'BK020', reportTime: '2026-06-07T11:20:00', reason: 'other', status: 'repairing' },
  { id: 'RP021', stationId: 'S04', bikeId: 'BK021', reportTime: '2026-06-07T14:55:00', reason: 'tire_damage', status: 'repairing' },
  { id: 'RP022', stationId: 'S06', bikeId: 'BK022', reportTime: '2026-06-07T16:40:00', reason: 'chain_issue', status: 'completed' },
  { id: 'RP023', stationId: 'S11', bikeId: 'BK023', reportTime: '2026-06-08T08:30:00', reason: 'brake_failure', status: 'repairing' },
  { id: 'RP024', stationId: 'S15', bikeId: 'BK024', reportTime: '2026-06-08T10:15:00', reason: 'tire_damage', status: 'repairing' },
  { id: 'RP025', stationId: 'S09', bikeId: 'BK025', reportTime: '2026-06-08T13:45:00', reason: 'other', status: 'repairing' }
]
