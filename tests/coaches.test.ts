import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import app from '../api/app.js';
import { resetDatabase, login } from './setup.js';

let server: any;
let baseUrl: string;
let adminToken: string;
let coach1Token: string;
let coach2Token: string;

beforeAll(async () => {
  await resetDatabase();
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address() as { port: number };
  baseUrl = `http://localhost:${addr.port}`;
  adminToken = await login(baseUrl, 'admin', 'password123');
  coach1Token = await login(baseUrl, 'coach1', 'password123');
  coach2Token = await login(baseUrl, 'coach2', 'password123');
});

afterAll(() => {
  server.close();
});

async function getCoachIds(): Promise<{ coach1Id: number; coach2Id: number }> {
  const res = await fetch(`${baseUrl}/api/coaches`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await res.json();
  return {
    coach1Id: data.data.find((c: any) => c.name === '张教练').id,
    coach2Id: data.data.find((c: any) => c.name === '李教练').id,
  };
}

describe('Coaches API - Access Control', () => {
  it('should deny coach from viewing other coach income data (403)', async () => {
    const { coach2Id } = await getCoachIds();

    const res = await fetch(`${baseUrl}/api/coaches/${coach2Id}/performance`, {
      headers: { Authorization: `Bearer ${coach1Token}` },
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('own performance');
  });

  it('should allow coach to view their own performance data', async () => {
    const { coach1Id } = await getCoachIds();

    const res = await fetch(`${baseUrl}/api/coaches/${coach1Id}/performance`, {
      headers: { Authorization: `Bearer ${coach1Token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(coach1Id);
  });

  it('should allow admin to view any coach performance', async () => {
    const { coach1Id, coach2Id } = await getCoachIds();

    const res1 = await fetch(`${baseUrl}/api/coaches/${coach1Id}/performance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);

    const res2 = await fetch(`${baseUrl}/api/coaches/${coach2Id}/performance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.success).toBe(true);
  });
});
