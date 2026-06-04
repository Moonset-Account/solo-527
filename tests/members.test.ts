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

describe('Members API', () => {
  it('should list members', async () => {
    const res = await fetch(`${baseUrl}/api/members`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  it('should create a member', async () => {
    const res = await fetch(`${baseUrl}/api/members`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '测试会员', phone: '13999999999', email: 'test@test.com', status: 'active' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('测试会员');
    expect(data.data.phone).toBe('13999999999');
  });

  it('should update a member', async () => {
    const listRes = await fetch(`${baseUrl}/api/members`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    const memberId = listData.data[0].id;

    const res = await fetch(`${baseUrl}/api/members/${memberId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '更新后的名字' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('更新后的名字');
  });

  it('should delete a member', async () => {
    const createRes = await fetch(`${baseUrl}/api/members`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '待删除会员', phone: '13888888888', status: 'active' }),
    });
    const createData = await createRes.json();
    const memberId = createData.data.id;

    const res = await fetch(`${baseUrl}/api/members/${memberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('should log member status change to audit_logs', async () => {
    const listRes = await fetch(`${baseUrl}/api/members?status=active`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    const activeMember = listData.data[0];

    await fetch(`${baseUrl}/api/members/${activeMember.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'expired' }),
    });

    const auditRes = await fetch(`${baseUrl}/api/audit-logs?entity_type=member_status&entity_id=${activeMember.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    expect(auditData.success).toBe(true);
    const statusChange = auditData.data.find(
      (log: any) => log.action === 'status_change' && log.entity_id === activeMember.id
    );
    expect(statusChange).toBeDefined();
    expect(statusChange.old_value).toBe('active');
    expect(statusChange.new_value).toBe('expired');
  });
});
