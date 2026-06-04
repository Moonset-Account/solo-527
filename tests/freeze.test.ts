import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import app from '../api/app.js';
import { resetDatabase, login } from './setup.js';

let server: any;
let baseUrl: string;
let adminToken: string;

beforeAll(async () => {
  await resetDatabase();
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address() as { port: number };
  baseUrl = `http://localhost:${addr.port}`;
  adminToken = await login(baseUrl, 'admin', 'password123');
});

afterAll(() => {
  server.close();
});

async function getActiveMemberWithPackage(): Promise<{ memberId: number; packageId: number }> {
  const { getDb } = await import('../api/db/database.js');
  const db = getDb();
  const row = db.prepare(`
    SELECT mp.id as package_id, mp.member_id
    FROM member_packages mp
    JOIN members m ON m.id = mp.member_id
    WHERE mp.status = 'active' AND mp.remaining_sessions > 0 AND m.status = 'active'
    LIMIT 1
  `).get() as { package_id: number; member_id: number } | undefined;

  if (!row) throw new Error('No active member with package found');
  return { memberId: row.member_id, packageId: row.package_id };
}

describe('Freeze Workflow', () => {
  it('should create a freeze request', async () => {
    const { memberId, packageId } = await getActiveMemberWithPackage();
    const today = new Date().toISOString().slice(0, 10);
    const futureDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(`${baseUrl}/api/freezes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        member_package_id: packageId,
        start_date: today,
        end_date: futureDate,
        reason: '出差暂停',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('pending');
    expect(data.data.member_id).toBe(memberId);
  });

  it('should update member status to frozen when approving freeze', async () => {
    const { memberId, packageId } = await getActiveMemberWithPackage();
    const today = new Date().toISOString().slice(0, 10);
    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const freezeRes = await fetch(`${baseUrl}/api/freezes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        member_package_id: packageId,
        start_date: today,
        end_date: futureDate,
        reason: '请假',
      }),
    });
    const freezeData = await freezeRes.json();
    const freezeId = freezeData.data.id;

    const approveRes = await fetch(`${baseUrl}/api/freezes/${freezeId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    });

    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.success).toBe(true);
    expect(approveData.data.status).toBe('approved');

    const memberRes = await fetch(`${baseUrl}/api/members/${memberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const memberData = await memberRes.json();
    expect(memberData.data.status).toBe('frozen');
  });

  it('should extend member_package expiry_date when approving freeze', async () => {
    const { getDb } = await import('../api/db/database.js');
    const db = getDb();

    const row = db.prepare(`
      SELECT mp.id as package_id, mp.member_id, mp.expiry_date
      FROM member_packages mp
      JOIN members m ON m.id = mp.member_id
      WHERE mp.status = 'active' AND mp.remaining_sessions > 0 AND m.status = 'active'
      LIMIT 1
    `).get() as { package_id: number; member_id: number; expiry_date: string } | undefined;

    if (!row) return;

    const originalExpiry = row.expiry_date;
    const today = new Date().toISOString().slice(0, 10);
    const futureDate = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);

    const freezeRes = await fetch(`${baseUrl}/api/freezes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: row.member_id,
        member_package_id: row.package_id,
        start_date: today,
        end_date: futureDate,
        reason: '身体原因',
      }),
    });
    const freezeData = await freezeRes.json();
    const freezeId = freezeData.data.id;

    await fetch(`${baseUrl}/api/freezes/${freezeId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    });

    const pkgAfter = db.prepare('SELECT expiry_date FROM member_packages WHERE id = ?').get(row.package_id) as { expiry_date: string };
    expect(new Date(pkgAfter.expiry_date).getTime()).toBeGreaterThan(new Date(originalExpiry).getTime());
  });

  it('should reject a freeze request', async () => {
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
        reason: '请假',
      }),
    });
    const freezeData = await freezeRes.json();
    const freezeId = freezeData.data.id;

    const rejectRes = await fetch(`${baseUrl}/api/freezes/${freezeId}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    });

    expect(rejectRes.status).toBe(200);
    const rejectData = await rejectRes.json();
    expect(rejectData.success).toBe(true);
    expect(rejectData.data.status).toBe('rejected');
  });
});
