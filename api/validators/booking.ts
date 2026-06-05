import { db } from '../db.js';

export function validateGroupBooking(
  session_id: number,
  school_id: number | null,
  participants: { name: string; age: number }[]
): { valid: boolean; error?: string } {
  const session = db.sessions.get(session_id);
  if (!session) {
    return { valid: false, error: '场次不存在' };
  }

  if (!school_id) {
    return { valid: false, error: '团体预约必须提供学校ID' };
  }

  const school = db.schools.get(school_id);
  if (!school) {
    return { valid: false, error: '学校不存在' };
  }

  if (session.status !== 'scheduled') {
    return { valid: false, error: '该场次不可预约' };
  }

  const remaining = session.capacity - session.booked_count;
  if (participants.length > remaining) {
    return { valid: false, error: `场次剩余容量不足，剩余 ${remaining} 个名额` };
  }

  const course = db.courses.get(session.course_id);
  if (!course) {
    return { valid: false, error: '课程不存在' };
  }

  for (const p of participants) {
    if (p.age < course.min_age || p.age > course.max_age) {
      return { valid: false, error: `参与者 ${p.name} 的年龄 ${p.age} 不在课程年龄范围（${course.min_age}-${course.max_age}）内` };
    }
  }

  return { valid: true };
}

export function validateIndividualBooking(
  session_id: number,
  participants: { name: string; age: number }[]
): { valid: boolean; error?: string } {
  const session = db.sessions.get(session_id);
  if (!session) {
    return { valid: false, error: '场次不存在' };
  }

  if (session.status !== 'scheduled') {
    return { valid: false, error: '该场次不可预约' };
  }

  const remaining = session.capacity - session.booked_count;
  if (participants.length > remaining) {
    return { valid: false, error: `场次剩余容量不足，剩余 ${remaining} 个名额` };
  }

  const course = db.courses.get(session.course_id);
  if (!course) {
    return { valid: false, error: '课程不存在' };
  }

  for (const p of participants) {
    if (p.age < course.min_age || p.age > course.max_age) {
      return { valid: false, error: `参与者 ${p.name} 的年龄 ${p.age} 不在课程年龄范围（${course.min_age}-${course.max_age}）内` };
    }
  }

  return { valid: true };
}
