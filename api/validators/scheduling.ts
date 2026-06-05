import { db } from '../db.js';

export function validateScheduleAssignment(
  guide_id: number,
  date: string,
  start_time: string,
  end_time: string,
  excludeSessionId?: number
): { valid: boolean; conflict?: string } {
  const guide = db.guides.get(guide_id);
  if (!guide) {
    return { valid: false, conflict: '讲解员不存在' };
  }

  if (guide.status !== 'active') {
    return { valid: false, conflict: '该讲解员当前不可用' };
  }

  for (const [, assignment] of db.scheduleAssignments) {
    const session = db.sessions.get(assignment.session_id);
    if (!session) continue;

    if (assignment.guide_id !== guide_id) continue;
    if (session.date !== date) continue;
    if (excludeSessionId && session.id === excludeSessionId) continue;

    if (start_time < session.end_time && end_time > session.start_time) {
      return {
        valid: false,
        conflict: `讲解员在 ${date} ${session.start_time}-${session.end_time} 已有安排（场次ID: ${session.id}）`,
      };
    }
  }

  return { valid: true };
}
