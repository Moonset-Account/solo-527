import { db } from '../db.js';
import { validateGroupBooking, validateIndividualBooking } from '../validators/booking.js';

export function createGroupBooking(session_id: number, user_id: number, school_id: number, participantsData: { name: string; age: number }[]) {
  const validation = validateGroupBooking(session_id, school_id, participantsData);
  if (!validation.valid) {
    return { error: validation.error };
  }

  const id = db.getNextId(db.bookings);
  const now = new Date().toISOString();
  const booking = {
    id,
    type: 'group' as const,
    session_id,
    user_id,
    school_id,
    total_count: participantsData.length,
    status: 'pending',
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  };
  db.bookings.set(id, booking);

  for (const p of participantsData) {
    const pId = db.getNextId(db.participants);
    db.participants.set(pId, {
      id: pId,
      booking_id: id,
      name: p.name,
      age: p.age,
      checked_in: false,
      checked_in_at: null,
    });
  }

  const session = db.sessions.get(session_id)!;
  session.booked_count += participantsData.length;
  session.updated_at = now;
  db.sessions.set(session_id, session);

  const notifId = db.getNextId(db.notifications);
  db.notifications.set(notifId, {
    id: notifId,
    user_id,
    type: 'booking',
    title: '团体预约已提交',
    content: `您已成功提交团体预约，共 ${participantsData.length} 人，等待审核。`,
    read: false,
    created_at: now,
  });

  for (const [, u] of db.users) {
    if (u.role === 'manager' || u.role === 'admin') {
      const nId = db.getNextId(db.notifications);
      db.notifications.set(nId, {
        id: nId,
        user_id: u.id,
        type: 'review',
        title: '新团体预约待审核',
        content: `有一个新的团体预约需要审核（预约ID: ${id}）。`,
        read: false,
        created_at: now,
      });
    }
  }

  return { data: booking };
}

export function createIndividualBooking(session_id: number, user_id: number, participantsData: { name: string; age: number }[]) {
  const validation = validateIndividualBooking(session_id, participantsData);
  if (!validation.valid) {
    return { error: validation.error };
  }

  const id = db.getNextId(db.bookings);
  const now = new Date().toISOString();
  const booking = {
    id,
    type: 'individual' as const,
    session_id,
    user_id,
    school_id: null,
    total_count: participantsData.length,
    status: 'pending',
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  };
  db.bookings.set(id, booking);

  for (const p of participantsData) {
    const pId = db.getNextId(db.participants);
    db.participants.set(pId, {
      id: pId,
      booking_id: id,
      name: p.name,
      age: p.age,
      checked_in: false,
      checked_in_at: null,
    });
  }

  const session = db.sessions.get(session_id)!;
  session.booked_count += participantsData.length;
  session.updated_at = now;
  db.sessions.set(session_id, session);

  const notifId = db.getNextId(db.notifications);
  db.notifications.set(notifId, {
    id: notifId,
    user_id,
    type: 'booking',
    title: '个人预约已提交',
    content: `您已成功提交个人预约，等待审核。`,
    read: false,
    created_at: now,
  });

  return { data: booking };
}

export function list(filters: { status?: string; user_id?: number; session_id?: number } = {}) {
  const result: any[] = [];
  for (const [, booking] of db.bookings) {
    if (filters.status && booking.status !== filters.status) continue;
    if (filters.user_id && booking.user_id !== filters.user_id) continue;
    if (filters.session_id && booking.session_id !== filters.session_id) continue;
    result.push(booking);
  }
  return result;
}

export function getById(id: number) {
  const booking = db.bookings.get(id);
  if (!booking) return null;

  const bookingParticipants: any[] = [];
  for (const [, p] of db.participants) {
    if (p.booking_id === id) {
      bookingParticipants.push(p);
    }
  }

  return { ...booking, participants: bookingParticipants };
}

export function review(id: number, action: 'approve' | 'reject', note: string | null, reviewer_id: number) {
  const booking = db.bookings.get(id);
  if (!booking) return { error: '预约不存在' };

  if (booking.status !== 'pending') {
    return { error: '该预约已处理，无法重复审核' };
  }

  const now = new Date().toISOString();
  const oldStatus = booking.status;
  booking.status = action === 'approve' ? 'approved' : 'rejected';
  booking.review_note = note;
  booking.reviewed_by = reviewer_id;
  booking.reviewed_at = now;
  booking.updated_at = now;
  db.bookings.set(id, booking);

  if (action === 'reject') {
    const session = db.sessions.get(booking.session_id);
    if (session) {
      session.booked_count -= booking.total_count;
      if (session.booked_count < 0) session.booked_count = 0;
      session.updated_at = now;
      db.sessions.set(booking.session_id, session);
    }
  }

  const notifId = db.getNextId(db.notifications);
  db.notifications.set(notifId, {
    id: notifId,
    user_id: booking.user_id,
    type: 'review',
    title: action === 'approve' ? '预约已通过' : '预约已拒绝',
    content: action === 'approve'
      ? `您的预约（ID: ${id}）已审核通过。`
      : `您的预约（ID: ${id}）已被拒绝。${note ? '原因：' + note : ''}`,
    read: false,
    created_at: now,
  });

  const logId = db.getNextId(db.auditLogs);
  db.auditLogs.set(logId, {
    id: logId,
    user_id: reviewer_id,
    action: action === 'approve' ? 'approve' : 'reject',
    entity_type: 'booking',
    entity_id: id,
    old_value: JSON.stringify({ status: oldStatus }),
    new_value: JSON.stringify({ status: booking.status }),
    ip_address: '127.0.0.1',
    created_at: now,
  });

  return { data: booking };
}

export function cancel(id: number, user_id: number) {
  const booking = db.bookings.get(id);
  if (!booking) return { error: '预约不存在' };

  if (booking.user_id !== user_id) {
    return { error: '只能取消自己的预约' };
  }

  if (booking.status === 'cancelled') {
    return { error: '预约已取消' };
  }

  if (booking.status === 'rejected') {
    return { error: '已拒绝的预约无需取消' };
  }

  const now = new Date().toISOString();
  booking.status = 'cancelled';
  booking.updated_at = now;
  db.bookings.set(id, booking);

  const session = db.sessions.get(booking.session_id);
  if (session) {
    session.booked_count -= booking.total_count;
    if (session.booked_count < 0) session.booked_count = 0;
    session.updated_at = now;
    db.sessions.set(booking.session_id, session);
  }

  return { data: booking };
}
