import { db } from '../db.js';

export function list(filters: { course_id?: number; date?: string; status?: string } = {}) {
  const result: any[] = [];
  for (const [, session] of db.sessions) {
    if (filters.course_id && session.course_id !== filters.course_id) continue;
    if (filters.date && session.date !== filters.date) continue;
    if (filters.status && session.status !== filters.status) continue;
    const course = db.courses.get(session.course_id);
    result.push({ ...session, course_name: course?.name || null });
  }
  return result;
}

export function getById(id: number) {
  const session = db.sessions.get(id);
  if (!session) return null;

  const course = db.courses.get(session.course_id);
  const sessionBookings: any[] = [];
  for (const [, b] of db.bookings) {
    if (b.session_id === id) {
      sessionBookings.push(b);
    }
  }

  return {
    ...session,
    course_name: course?.name || null,
    course: course || null,
    bookings: sessionBookings,
  };
}

export function create(data: any) {
  const course = db.courses.get(data.course_id);
  if (!course) return { error: '课程不存在' };

  const id = db.getNextId(db.sessions);
  const now = new Date().toISOString();
  const session = {
    id,
    course_id: data.course_id,
    date: data.date,
    start_time: data.start_time,
    end_time: data.end_time,
    capacity: data.capacity || course.capacity,
    booked_count: 0,
    status: data.status || 'scheduled',
    guide_id: data.guide_id || null,
    location: data.location || '',
    created_at: now,
    updated_at: now,
  };
  db.sessions.set(id, session);
  return { data: session };
}

export function update(id: number, data: any) {
  const session = db.sessions.get(id);
  if (!session) return null;

  const updated = {
    ...session,
    ...data,
    id: session.id,
    created_at: session.created_at,
    updated_at: new Date().toISOString(),
  };
  db.sessions.set(id, updated);
  return updated;
}

export function getCalendar(month: number, year: number) {
  const result: Record<string, any[]> = {};
  for (const [, session] of db.sessions) {
    const sessionDate = new Date(session.date);
    if (sessionDate.getMonth() + 1 === month && sessionDate.getFullYear() === year) {
      const course = db.courses.get(session.course_id);
      if (!result[session.date]) {
        result[session.date] = [];
      }
      result[session.date].push({
        ...session,
        course_name: course?.name || null,
      });
    }
  }
  return result;
}
