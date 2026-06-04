import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import app from '../api/app.js';
import { resetDatabase, login } from './setup.js';

let server: any;
let baseUrl: string;
let adminToken: string;
let coach1Token: string;

beforeAll(async () => {
  await resetDatabase();
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address() as { port: number };
  baseUrl = `http://localhost:${addr.port}`;
  adminToken = await login(baseUrl, 'admin', 'password123');
  coach1Token = await login(baseUrl, 'coach1', 'password123');
});

afterAll(() => {
  server.close();
});

async function getMemberWithPackage(): Promise<{ memberId: number; packageId: number; coachId: number }> {
  const membersRes = await fetch(`${baseUrl}/api/members?status=active`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const membersData = await membersRes.json();
  const activeMember = membersData.data[0];

  const coachesRes = await fetch(`${baseUrl}/api/coaches`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const coachesData = await coachesRes.json();
  const coach = coachesData.data[0];

  const pkgRes = await fetch(`${baseUrl}/api/members/${activeMember.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const pkgData = await pkgRes.json();

  const { getDb } = await import('../api/db/database.js');
  const db = getDb();
  const pkg = db.prepare('SELECT * FROM member_packages WHERE member_id = ? AND status = ? AND remaining_sessions > 0').get(activeMember.id, 'active') as any;

  return {
    memberId: activeMember.id,
    packageId: pkg?.id,
    coachId: coach.id,
  };
}

describe('Appointments API', () => {
  it('should create appointment successfully', async () => {
    const { memberId, packageId, coachId } = await getMemberWithPackage();
    const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        coach_id: coachId,
        member_package_id: packageId,
        start_time: `${tomorrow} 09:00:00`,
        end_time: `${tomorrow} 10:00:00`,
        type: 'private',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('booked');
  });

  it('should reject appointment for frozen member with MEMBER_FROZEN error', async () => {
    const membersRes = await fetch(`${baseUrl}/api/members?status=frozen`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const membersData = await membersRes.json();
    const frozenMember = membersData.data[0];

    const coachesRes = await fetch(`${baseUrl}/api/coaches`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const coachesData = await coachesRes.json();
    const coach = coachesData.data[0];

    const tomorrow = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: frozenMember.id,
        coach_id: coach.id,
        start_time: `${tomorrow} 09:00:00`,
        end_time: `${tomorrow} 10:00:00`,
        type: 'private',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('frozen');
  });

  it('should reject appointment with no remaining sessions', async () => {
    const { getDb } = await import('../api/db/database.js');
    const db = getDb();
    const exhaustedPkg = db.prepare('SELECT * FROM member_packages WHERE remaining_sessions = 0').get() as any;
    if (!exhaustedPkg) {
      return;
    }

    const coachesRes = await fetch(`${baseUrl}/api/coaches`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const coachesData = await coachesRes.json();
    const coach = coachesData.data[0];

    const tomorrow = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: exhaustedPkg.member_id,
        coach_id: coach.id,
        member_package_id: exhaustedPkg.id,
        start_time: `${tomorrow} 09:00:00`,
        end_time: `${tomorrow} 10:00:00`,
        type: 'private',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('remaining sessions');
  });

  it('should reject appointment with coach time conflict', async () => {
    const { memberId, packageId, coachId } = await getMemberWithPackage();
    const tomorrow = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

    await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        coach_id: coachId,
        member_package_id: packageId,
        start_time: `${tomorrow} 10:00:00`,
        end_time: `${tomorrow} 11:00:00`,
        type: 'private',
      }),
    });

    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        coach_id: coachId,
        member_package_id: packageId,
        start_time: `${tomorrow} 10:30:00`,
        end_time: `${tomorrow} 11:30:00`,
        type: 'private',
      }),
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('conflict');
  });

  it('should reject private appointment without member_package_id with PACKAGE_REQUIRED error', async () => {
    const { memberId, coachId } = await getMemberWithPackage();
    const tomorrow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        coach_id: coachId,
        start_time: `${tomorrow} 09:00:00`,
        end_time: `${tomorrow} 10:00:00`,
        type: 'private',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('PACKAGE_REQUIRED');
  });

  it('should reject private appointment with package not belonging to member', async () => {
    const { getDb } = await import('../api/db/database.js');
    const db = getDb();

    const member1 = db.prepare('SELECT * FROM members WHERE status = ? LIMIT 1').get('active') as any;
    const member2 = db.prepare('SELECT * FROM members WHERE status = ? AND id != ? LIMIT 1').get('active', member1.id) as any;

    if (!member2) return;

    const coach = db.prepare('SELECT * FROM coaches WHERE status = ? LIMIT 1').get('active') as any;
    const otherMemberPkg = db.prepare('SELECT * FROM member_packages WHERE member_id = ? AND status = ? AND remaining_sessions > 0 LIMIT 1').get(member2.id, 'active') as any;

    if (!otherMemberPkg) return;

    const tomorrow = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: member1.id,
        coach_id: coach.id,
        member_package_id: otherMemberPkg.id,
        start_time: `${tomorrow} 09:00:00`,
        end_time: `${tomorrow} 10:00:00`,
        type: 'private',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('PACKAGE_NOT_BELONG_TO_MEMBER');
  });

  it('should deduct session from member_package on check-in', async () => {
    const { memberId, packageId, coachId } = await getMemberWithPackage();
    const tomorrow = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);

    const aptRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        coach_id: coachId,
        member_package_id: packageId,
        start_time: `${tomorrow} 14:00:00`,
        end_time: `${tomorrow} 15:00:00`,
        type: 'private',
      }),
    });
    const aptData = await aptRes.json();
    const appointmentId = aptData.data.id;

    const { getDb } = await import('../api/db/database.js');
    const db = getDb();
    const pkgBefore = db.prepare('SELECT remaining_sessions FROM member_packages WHERE id = ?').get(packageId) as { remaining_sessions: number };

    const checkinRes = await fetch(`${baseUrl}/api/appointments/${appointmentId}/checkin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    });

    expect(checkinRes.status).toBe(200);
    const checkinData = await checkinRes.json();
    expect(checkinData.success).toBe(true);
    expect(checkinData.data.status).toBe('checked_in');

    const pkgAfter = db.prepare('SELECT remaining_sessions FROM member_packages WHERE id = ?').get(packageId) as { remaining_sessions: number };
    expect(pkgAfter.remaining_sessions).toBe(pkgBefore.remaining_sessions - 1);
  });

  it('should create session_deduction record on check-in', async () => {
    const { getDb } = await import('../api/db/database.js');
    const db = getDb();
    const deduction = db.prepare('SELECT * FROM session_deductions ORDER BY id DESC LIMIT 1').get() as any;

    expect(deduction).toBeDefined();
    expect(deduction.sessions_deducted).toBe(1);
    expect(deduction.remaining_after).toBeGreaterThanOrEqual(0);
  });

  it('should reject appointment with expired package by expiry_date', async () => {
    const { getDb } = await import('../api/db/database.js');
    const db = getDb();

    const member = db.prepare('SELECT * FROM members WHERE status = ? LIMIT 1').get('active') as any;
    const coach = db.prepare('SELECT * FROM coaches WHERE status = ? LIMIT 1').get('active') as any;

    const pastDate = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const result = db.prepare(`
      INSERT INTO member_packages (member_id, package_type_id, remaining_sessions, total_sessions, start_date, expiry_date, paid_amount, status)
      VALUES (?, 1, 5, 10, ?, ?, 3000, 'active')
    `).run(member.id, pastDate, pastDate);

    const tomorrow = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: member.id,
        coach_id: coach.id,
        member_package_id: result.lastInsertRowid,
        start_time: `${tomorrow} 09:00:00`,
        end_time: `${tomorrow} 10:00:00`,
        type: 'private',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('PACKAGE_EXPIRED');
  });

  it('should reject check-in for private appointment without member_package_id', async () => {
    const { getDb } = await import('../api/db/database.js');
    const db = getDb();

    const member = db.prepare('SELECT * FROM members WHERE status = ? LIMIT 1').get('active') as any;
    const coach = db.prepare('SELECT * FROM coaches WHERE status = ? LIMIT 1').get('active') as any;

    const tomorrow = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const aptResult = db.prepare(`
      INSERT INTO appointments (member_id, coach_id, member_package_id, start_time, end_time, type, status)
      VALUES (?, ?, NULL, ?, ?, 'private', 'booked')
    `).run(member.id, coach.id, `${tomorrow} 09:00:00`, `${tomorrow} 10:00:00`);

    const res = await fetch(`${baseUrl}/api/appointments/${aptResult.lastInsertRowid}/checkin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('package');
  });
});
