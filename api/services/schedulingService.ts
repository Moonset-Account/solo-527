import { db } from '../db.js';
import { validateScheduleAssignment } from '../validators/scheduling.js';

export function list(filters: { guide_id?: number; session_id?: number } = {}) {
  const result: any[] = [];
  for (const [, assignment] of db.scheduleAssignments) {
    if (filters.guide_id && assignment.guide_id !== filters.guide_id) continue;
    if (filters.session_id && assignment.session_id !== filters.session_id) continue;
    const session = db.sessions.get(assignment.session_id);
    const guide = db.guides.get(assignment.guide_id);
    const user = guide ? db.users.get(guide.user_id) : null;
    result.push({
      ...assignment,
      session_info: session || null,
      guide_name: user?.name || null,
    });
  }
  return result;
}

export function assign(session_id: number, guide_id: number) {
  const session = db.sessions.get(session_id);
  if (!session) return { error: '场次不存在' };

  const guide = db.guides.get(guide_id);
  if (!guide) return { error: '讲解员不存在' };

  const validation = validateScheduleAssignment(guide_id, session.date, session.start_time, session.end_time);
  if (!validation.valid) {
    return { error: validation.conflict };
  }

  for (const [, a] of db.scheduleAssignments) {
    if (a.session_id === session_id && a.guide_id === guide_id) {
      return { error: '该讲解员已分配到此场次' };
    }
  }

  const id = db.getNextId(db.scheduleAssignments);
  const now = new Date().toISOString();
  const assignment = {
    id,
    session_id,
    guide_id,
    assigned_at: now,
  };
  db.scheduleAssignments.set(id, assignment);

  session.guide_id = guide_id;
  session.updated_at = now;
  db.sessions.set(session_id, session);

  return { data: assignment };
}

export function remove(id: number) {
  const assignment = db.scheduleAssignments.get(id);
  if (!assignment) return { error: '排班记录不存在' };

  const session = db.sessions.get(assignment.session_id);
  if (session && session.guide_id === assignment.guide_id) {
    session.guide_id = null;
    session.updated_at = new Date().toISOString();
    db.sessions.set(assignment.session_id, session);
  }

  db.scheduleAssignments.delete(id);
  return { data: { deleted: true } };
}

export function checkConflicts(guide_id: number, date: string, start_time: string, end_time: string) {
  return validateScheduleAssignment(guide_id, date, start_time, end_time);
}
