import { db } from '../db.js';

export function checkin(session_id: number, participant_id: number) {
  const session = db.sessions.get(session_id);
  if (!session) return { error: '场次不存在' };

  const participant = db.participants.get(participant_id);
  if (!participant) return { error: '参与者不存在' };

  const booking = db.bookings.get(participant.booking_id);
  if (!booking || booking.session_id !== session_id) {
    return { error: '该参与者不属于此场次' };
  }

  if (participant.checked_in) {
    return { error: '该参与者已签到' };
  }

  participant.checked_in = true;
  participant.checked_in_at = new Date().toISOString();
  db.participants.set(participant_id, participant);

  return { data: participant };
}

export function getStatus(session_id: number) {
  const session = db.sessions.get(session_id);
  if (!session) return { error: '场次不存在' };

  const result: any[] = [];
  for (const [, p] of db.participants) {
    const booking = db.bookings.get(p.booking_id);
    if (booking && booking.session_id === session_id) {
      result.push(p);
    }
  }

  const checkedIn = result.filter(p => p.checked_in).length;
  const total = result.length;

  return {
    data: {
      session_id,
      total,
      checked_in: checkedIn,
      not_checked_in: total - checkedIn,
      checkin_rate: total > 0 ? (checkedIn / total * 100).toFixed(1) + '%' : '0%',
      participants: result,
    },
  };
}
