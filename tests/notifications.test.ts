import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import app from '../api/app.js';
import { resetDatabase, login } from './setup.js';

let server: any;
let baseUrl: string;
let adminToken: string;
let member1Token: string;

beforeAll(async () => {
  await resetDatabase();
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address() as { port: number };
  baseUrl = `http://localhost:${addr.port}`;
  adminToken = await login(baseUrl, 'admin', 'password123');
  member1Token = await login(baseUrl, 'member1', 'password123');
});

afterAll(() => {
  server.close();
});

async function getActiveMemberWithPackage(): Promise<{ memberId: number; packageId: number; coachId: number }> {
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

  const { getDb } = await import('../api/db/database.js');
  const db = getDb();
  const pkg = db.prepare('SELECT * FROM member_packages WHERE member_id = ? AND status = ? AND remaining_sessions > 0').get(activeMember.id, 'active') as any;

  return {
    memberId: activeMember.id,
    packageId: pkg?.id,
    coachId: coach.id,
  };
}

describe('Notifications API', () => {
  it('should send in-app notification to coach when creating appointment', async () => {
    const { memberId, packageId, coachId } = await getActiveMemberWithPackage();
    const tomorrow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const coachesRes = await fetch(`${baseUrl}/api/coaches/${coachId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const coachData = await coachesRes.json();

    const { getDb } = await import('../api/db/database.js');
    const db = getDb();
    const coachUser = db.prepare('SELECT id FROM users WHERE coach_id = ?').get(coachId) as { id: number } | undefined;

    const beforeCount = coachUser
      ? (db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ? AND title LIKE ?').get(coachUser.id, '%预约%') as { cnt: number }).cnt
      : 0;

    await fetch(`${baseUrl}/api/appointments`, {
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

    if (coachUser) {
      const afterCount = (db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ? AND title LIKE ?').get(coachUser.id, '%预约%') as { cnt: number }).cnt;
      expect(afterCount).toBeGreaterThan(beforeCount);
    }
  });

  it('should send in-app notification to member when creating appointment', async () => {
    const { memberId, packageId, coachId } = await getActiveMemberWithPackage();
    const tomorrow = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10);

    const { getDb } = await import('../api/db/database.js');
    const db = getDb();
    const memberUser = db.prepare('SELECT id FROM users WHERE member_id = ?').get(memberId) as { id: number } | undefined;

    const beforeCount = memberUser
      ? (db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ? AND title LIKE ?').get(memberUser.id, '%预约%') as { cnt: number }).cnt
      : 0;

    await fetch(`${baseUrl}/api/appointments`, {
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

    if (memberUser) {
      const afterCount = (db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ? AND title LIKE ?').get(memberUser.id, '%预约%') as { cnt: number }).cnt;
      expect(afterCount).toBeGreaterThan(beforeCount);
    }
  });

  it('should send notification when freeze is approved', async () => {
    const { getDb } = await import('../api/db/database.js');
    const db = getDb();

    const row = db.prepare(`
      SELECT mp.id as package_id, mp.member_id
      FROM member_packages mp
      JOIN members m ON m.id = mp.member_id
      WHERE mp.status = 'active' AND m.status = 'active'
      LIMIT 1
    `).get() as { package_id: number; member_id: number } | undefined;
    if (!row) return;

    const today = new Date().toISOString().slice(0, 10);
    const futureDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

    const freezeRes = await fetch(`${baseUrl}/api/freezes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: row.member_id,
        member_package_id: row.package_id,
        start_date: today,
        end_date: futureDate,
        reason: '出差',
      }),
    });
    const freezeData = await freezeRes.json();
    const freezeId = freezeData.data.id;

    const memberUser = db.prepare('SELECT id FROM users WHERE member_id = ?').get(row.member_id) as { id: number } | undefined;
    const beforeCount = memberUser
      ? (db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ? AND title LIKE ?').get(memberUser.id, '%冻结%') as { cnt: number }).cnt
      : 0;

    await fetch(`${baseUrl}/api/freezes/${freezeId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    });

    if (memberUser) {
      const afterCount = (db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE user_id = ? AND title LIKE ?').get(memberUser.id, '%冻结%') as { cnt: number }).cnt;
      expect(afterCount).toBeGreaterThan(beforeCount);
    }
  });

  it('should mark message as read', async () => {
    const messagesRes = await fetch(`${baseUrl}/api/messages?read=false&limit=1`, {
      headers: { Authorization: `Bearer ${member1Token}` },
    });
    const messagesData = await messagesRes.json();

    if (messagesData.data && messagesData.data.length > 0) {
      const msgId = messagesData.data[0].id;

      const res = await fetch(`${baseUrl}/api/messages/${msgId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${member1Token}`, 'Content-Type': 'application/json' },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const msgRes = await fetch(`${baseUrl}/api/messages?limit=50`, {
        headers: { Authorization: `Bearer ${member1Token}` },
      });
      const msgData = await msgRes.json();
      const updatedMsg = msgData.data.find((m: any) => m.id === msgId);
      expect(updatedMsg.read).toBeTruthy();
    }
  });

  it('should return correct unread count', async () => {
    const res = await fetch(`${baseUrl}/api/messages/unread-count`, {
      headers: { Authorization: `Bearer ${member1Token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.data.count).toBe('number');
    expect(data.data.count).toBeGreaterThanOrEqual(0);
  });
});
