import type { Dispatch } from '@/types'

export const dispatches: Dispatch[] = [
  { id: 'D001', fromStationId: 'S03', toStationId: 'S04', bikeCount: 3, dispatchTime: '2026-06-02T09:00:00', completedTime: '2026-06-02T10:30:00', status: 'completed' },
  { id: 'D002', fromStationId: 'S01', toStationId: 'S15', bikeCount: 5, dispatchTime: '2026-06-02T14:00:00', completedTime: '2026-06-02T15:45:00', status: 'completed' },
  { id: 'D003', fromStationId: 'S08', toStationId: 'S10', bikeCount: 4, dispatchTime: '2026-06-03T08:30:00', completedTime: '2026-06-03T10:00:00', status: 'completed' },
  { id: 'D004', fromStationId: 'S05', toStationId: 'S14', bikeCount: 2, dispatchTime: '2026-06-03T11:00:00', completedTime: '2026-06-03T12:15:00', status: 'completed' },
  { id: 'D005', fromStationId: 'S12', toStationId: 'S06', bikeCount: 6, dispatchTime: '2026-06-03T16:00:00', completedTime: '2026-06-03T17:30:00', status: 'completed' },
  { id: 'D006', fromStationId: 'S13', toStationId: 'S15', bikeCount: 4, dispatchTime: '2026-06-04T07:00:00', completedTime: '2026-06-04T08:30:00', status: 'completed' },
  { id: 'D007', fromStationId: 'S07', toStationId: 'S09', bikeCount: 3, dispatchTime: '2026-06-04T10:00:00', completedTime: '2026-06-04T11:20:00', status: 'completed' },
  { id: 'D008', fromStationId: 'S02', toStationId: 'S11', bikeCount: 5, dispatchTime: '2026-06-04T13:30:00', completedTime: '2026-06-04T15:00:00', status: 'completed' },
  { id: 'D009', fromStationId: 'S03', toStationId: 'S04', bikeCount: 7, dispatchTime: '2026-06-05T08:00:00', completedTime: '2026-06-05T09:45:00', status: 'completed' },
  { id: 'D010', fromStationId: 'S01', toStationId: 'S13', bikeCount: 4, dispatchTime: '2026-06-05T12:00:00', completedTime: '2026-06-05T13:30:00', status: 'completed' },
  { id: 'D011', fromStationId: 'S08', toStationId: 'S15', bikeCount: 6, dispatchTime: '2026-06-05T15:00:00', completedTime: '2026-06-05T16:40:00', status: 'completed' },
  { id: 'D012', fromStationId: 'S06', toStationId: 'S03', bikeCount: 3, dispatchTime: '2026-06-06T08:30:00', completedTime: '2026-06-06T10:00:00', status: 'completed' },
  { id: 'D013', fromStationId: 'S05', toStationId: 'S02', bikeCount: 5, dispatchTime: '2026-06-06T11:00:00', completedTime: '2026-06-06T12:30:00', status: 'completed' },
  { id: 'D014', fromStationId: 'S14', toStationId: 'S01', bikeCount: 8, dispatchTime: '2026-06-06T14:00:00', completedTime: '2026-06-06T15:50:00', status: 'completed' },
  { id: 'D015', fromStationId: 'S09', toStationId: 'S07', bikeCount: 4, dispatchTime: '2026-06-06T17:00:00', completedTime: '2026-06-06T18:30:00', status: 'completed' },
  { id: 'D016', fromStationId: 'S12', toStationId: 'S06', bikeCount: 6, dispatchTime: '2026-06-07T08:00:00', completedTime: '2026-06-07T09:40:00', status: 'completed' },
  { id: 'D017', fromStationId: 'S04', toStationId: 'S01', bikeCount: 5, dispatchTime: '2026-06-07T10:30:00', completedTime: '2026-06-07T12:15:00', status: 'in_progress' },
  { id: 'D018', fromStationId: 'S10', toStationId: 'S08', bikeCount: 3, dispatchTime: '2026-06-07T14:00:00', completedTime: '2026-06-07T15:20:00', status: 'in_progress' },
  { id: 'D019', fromStationId: 'S13', toStationId: 'S14', bikeCount: 7, dispatchTime: '2026-06-08T07:30:00', completedTime: '', status: 'pending' },
  { id: 'D020', fromStationId: 'S11', toStationId: 'S02', bikeCount: 4, dispatchTime: '2026-06-08T09:00:00', completedTime: '', status: 'pending' }
]
