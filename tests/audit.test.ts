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

describe('Audit Trail', () => {
  it('should record status changes in audit_logs', async () => {
    const membersRes = await fetch(`${baseUrl}/api/members?status=active`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const membersData = await membersRes.json();
    const memberId = membersData.data[0].id;

    await fetch(`${baseUrl}/api/members/${memberId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    const auditRes = await fetch(`${baseUrl}/api/audit-logs?entity_type=member_status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    expect(auditData.success).toBe(true);

    const statusLog = auditData.data.find(
      (log: any) => log.action === 'status_change' && log.entity_id === memberId
    );
    expect(statusLog).toBeDefined();
  });

  it('should contain old_value and new_value in audit logs', async () => {
    const membersRes = await fetch(`${baseUrl}/api/members?status=active`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const membersData = await membersRes.json();
    const memberId = membersData.data[0].id;

    await fetch(`${baseUrl}/api/members/${memberId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'expired' }),
    });

    const auditRes = await fetch(`${baseUrl}/api/audit-logs?entity_type=member_status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();

    const log = auditData.data.find(
      (l: any) => l.action === 'status_change' && l.entity_id === memberId && l.new_value === 'expired'
    );
    expect(log).toBeDefined();
    expect(log.old_value).toBe('active');
    expect(log.new_value).toBe('expired');
  });

  it('should filter audit logs by entity_type and entity_id', async () => {
    const membersRes = await fetch(`${baseUrl}/api/members?status=active`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const membersData = await membersRes.json();
    const memberId = membersData.data[0].id;

    await fetch(`${baseUrl}/api/members/${memberId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'frozen' }),
    });

    const auditRes = await fetch(`${baseUrl}/api/audit-logs?entity_type=member_status&entity_id=${memberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    expect(auditData.success).toBe(true);

    for (const log of auditData.data) {
      expect(log.entity_type).toBe('member_status');
      expect(log.entity_id).toBe(memberId);
    }
  });
});
