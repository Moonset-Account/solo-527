import { db } from '../db.js';

export function create(session_id: number, booking_id: number, user_id: number, rating: number, comment: string) {
  const session = db.sessions.get(session_id);
  if (!session) return { error: '场次不存在' };

  const booking = db.bookings.get(booking_id);
  if (!booking) return { error: '预约不存在' };

  if (rating < 1 || rating > 5) {
    return { error: '评分范围为1-5' };
  }

  const id = db.getNextId(db.feedbacks);
  const now = new Date().toISOString();
  const feedback = {
    id,
    session_id,
    booking_id,
    user_id,
    rating,
    comment,
    created_at: now,
  };
  db.feedbacks.set(id, feedback);
  return { data: feedback };
}

export function getStats(filters: { course_id?: number; guide_id?: number; session_id?: number } = {}) {
  const allFeedbacks: any[] = [];
  for (const [, f] of db.feedbacks) {
    allFeedbacks.push(f);
  }

  let filtered = allFeedbacks;

  if (filters.session_id) {
    filtered = filtered.filter(f => f.session_id === filters.session_id);
  }

  if (filters.course_id || filters.guide_id) {
    filtered = filtered.filter(f => {
      const session = db.sessions.get(f.session_id);
      if (!session) return false;
      if (filters.course_id && session.course_id !== filters.course_id) return false;
      if (filters.guide_id && session.guide_id !== filters.guide_id) return false;
      return true;
    });
  }

  if (filtered.length === 0) {
    return {
      data: {
        total_feedbacks: 0,
        average_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    };
  }

  const totalRating = filtered.reduce((sum, f) => sum + f.rating, 0);
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  filtered.forEach(f => distribution[f.rating]++);

  return {
    data: {
      total_feedbacks: filtered.length,
      average_rating: Number((totalRating / filtered.length).toFixed(2)),
      rating_distribution: distribution,
    },
  };
}
