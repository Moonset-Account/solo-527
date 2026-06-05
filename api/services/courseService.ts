import { db } from '../db.js';

export function list(filters: { status?: string } = {}) {
  const result: any[] = [];
  for (const [, course] of db.courses) {
    if (filters.status && course.status !== filters.status) continue;
    const aids: any[] = [];
    for (const [, cta] of db.courseTeachingAids) {
      if (cta.course_id === course.id) {
        const aid = db.teachingAids.get(cta.teaching_aid_id);
        if (aid) {
          aids.push({ ...cta, teaching_aid_name: aid.name });
        }
      }
    }
    result.push({ ...course, teaching_aids: aids });
  }
  return result;
}

export function getById(id: number) {
  const course = db.courses.get(id);
  if (!course) return null;

  const aids: any[] = [];
  for (const [, cta] of db.courseTeachingAids) {
    if (cta.course_id === id) {
      const aid = db.teachingAids.get(cta.teaching_aid_id);
      if (aid) {
        aids.push({ ...cta, teaching_aid_name: aid.name });
      }
    }
  }

  return { ...course, teaching_aids: aids };
}

export function create(data: any) {
  const id = db.getNextId(db.courses);
  const now = new Date().toISOString();
  const course = {
    id,
    name: data.name,
    description: data.description || '',
    min_age: data.min_age,
    max_age: data.max_age,
    capacity: data.capacity,
    duration_minutes: data.duration_minutes,
    status: data.status || 'active',
    created_at: now,
    updated_at: now,
  };
  db.courses.set(id, course);
  return course;
}

export function update(id: number, data: any) {
  const course = db.courses.get(id);
  if (!course) return null;

  const updated = {
    ...course,
    ...data,
    id: course.id,
    created_at: course.created_at,
    updated_at: new Date().toISOString(),
  };
  db.courses.set(id, updated);
  return updated;
}
