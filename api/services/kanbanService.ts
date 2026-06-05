import { db } from '../db.js';

export function getOverdue() {
  const now = new Date();
  const overdueBookings: any[] = [];
  const overdueTeachingAids: any[] = [];

  for (const [, booking] of db.bookings) {
    if (booking.status === 'pending') {
      const created = new Date(booking.created_at);
      const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 48) {
        overdueBookings.push({
          ...booking,
          overdue_hours: Math.round(hoursDiff - 48),
        });
      }
    }
  }

  for (const [, sta] of db.sessionTeachingAids) {
    if (!sta.returned) {
      const session = db.sessions.get(sta.session_id);
      if (session) {
        const sessionEnd = new Date(`${session.date}T${session.end_time}`);
        const hoursDiff = (now.getTime() - sessionEnd.getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
          const aid = db.teachingAids.get(sta.teaching_aid_id);
          overdueTeachingAids.push({
            ...sta,
            teaching_aid_name: aid?.name || null,
            session_info: session,
            overdue_hours: Math.round(hoursDiff - 24),
          });
        }
      }
    }
  }

  return {
    overdue_pending_bookings: overdueBookings,
    overdue_unreturned_aids: overdueTeachingAids,
  };
}

export function getIdleResources() {
  const availableGuides: any[] = [];
  for (const [, guide] of db.guides) {
    if (guide.status === 'active') {
      const user = db.users.get(guide.user_id);
      const assignments: any[] = [];
      for (const [, a] of db.scheduleAssignments) {
        if (a.guide_id === guide.id) {
          assignments.push(a);
        }
      }
      availableGuides.push({
        ...guide,
        name: user?.name || null,
        assignment_count: assignments.length,
      });
    }
  }

  const availableTeachingAids: any[] = [];
  for (const [, aid] of db.teachingAids) {
    if (aid.available_quantity > 0) {
      availableTeachingAids.push(aid);
    }
  }

  const lowBookingSessions: any[] = [];
  for (const [, session] of db.sessions) {
    if (session.status === 'scheduled' && session.capacity > 0) {
      const rate = session.booked_count / session.capacity;
      if (rate < 0.5) {
        const course = db.courses.get(session.course_id);
        lowBookingSessions.push({
          ...session,
          course_name: course?.name || null,
          booking_rate: (rate * 100).toFixed(1) + '%',
        });
      }
    }
  }

  return {
    available_guides: availableGuides,
    available_teaching_aids: availableTeachingAids,
    low_booking_sessions: lowBookingSessions,
  };
}

export function getMetrics() {
  const allBookings = Array.from(db.bookings.values());
  const totalBookings = allBookings.length;
  const approvedBookings = allBookings.filter(b => b.status === 'approved').length;
  const bookingConversionRate = totalBookings > 0
    ? Number(((approvedBookings / totalBookings) * 100).toFixed(1))
    : 0;

  let totalParticipants = 0;
  let checkedInParticipants = 0;
  for (const [, p] of db.participants) {
    totalParticipants++;
    if (p.checked_in) checkedInParticipants++;
  }
  const checkinRate = totalParticipants > 0
    ? Number(((checkedInParticipants / totalParticipants) * 100).toFixed(1))
    : 0;

  const allFeedbacks = Array.from(db.feedbacks.values());
  const averageRating = allFeedbacks.length > 0
    ? Number((allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length).toFixed(2))
    : 0;

  return {
    booking_conversion_rate: bookingConversionRate + '%',
    checkin_rate: checkinRate + '%',
    average_rating: averageRating,
    total_bookings: totalBookings,
    approved_bookings: approvedBookings,
    total_participants: totalParticipants,
    checked_in_participants: checkedInParticipants,
    total_feedbacks: allFeedbacks.length,
  };
}
