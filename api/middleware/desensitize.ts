import { type Request, type Response, type NextFunction } from 'express';

function maskName(name: string): string {
  if (!name || name.length === 0) return name;
  return name.charAt(0) + '**';
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  return local.charAt(0) + '***@' + domain;
}

function maskIdNumber(id: string): string {
  if (!id) return id;
  return '********';
}

function desensitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(desensitizeValue);
  if (typeof value === 'object') return desensitizeObject(value as Record<string, unknown>);
  return value;
}

const NAME_FIELDS = new Set(['name', 'candidateName', 'interviewerName', 'createdBy', 'recruiter']);
const PHONE_FIELDS = new Set(['phone']);
const EMAIL_FIELDS = new Set(['email']);
const ID_FIELDS = new Set(['idNumber', 'id_number']);

function desensitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (NAME_FIELDS.has(key) && typeof value === 'string') {
      result[key] = maskName(value);
    } else if (PHONE_FIELDS.has(key) && typeof value === 'string') {
      result[key] = maskPhone(value);
    } else if (EMAIL_FIELDS.has(key) && typeof value === 'string') {
      result[key] = maskEmail(value);
    } else if (ID_FIELDS.has(key) && typeof value === 'string') {
      result[key] = maskIdNumber(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = desensitizeValue(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function desensitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'object') {
    if (Array.isArray(data)) return data.map(desensitizeValue);
    return desensitizeObject(data as Record<string, unknown>);
  }
  return data;
}

export function desensitizeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown): Response {
    if (body && typeof body === 'object') {
      const desensitized = desensitizeData(body);
      return originalJson(desensitized);
    }
    return originalJson(body);
  };
  next();
}
