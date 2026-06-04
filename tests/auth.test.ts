import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import app from '../api/app.js';
import { resetDatabase } from './setup.js';

let server: any;
let baseUrl: string;
let adminToken: string;

beforeAll(async () => {
  await resetDatabase();
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address() as { port: number };
  baseUrl = `http://localhost:${addr.port}`;

  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password123' }),
  });
  const adminData = await adminRes.json();
  adminToken = adminData.data.token;
});

afterAll(() => {
  server.close();
});

describe('Auth API', () => {
  it('should login with valid credentials and return token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
    expect(typeof data.data.token).toBe('string');
  });

  it('should return error with invalid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should get current user with valid token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.username).toBe('admin');
    expect(data.data.role).toBe('admin');
  });

  it('should return token with correct user info', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'coach1', password: 'password123' }),
    });

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user.role).toBe('coach');
    expect(data.data.user.coach_id).toBeDefined();
  });
});
