import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key');

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'audience' | 'admin' | 'box_office';
  name: string;
}

export const createToken = async (payload: JWTPayload): Promise<string> => {
  return await new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
};

export const verifyToken = async (token: string): Promise<JWTPayload> => {
  const { payload } = await jose.jwtVerify(token, JWT_SECRET);
  return payload as unknown as JWTPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
};

export const generateOrderNo = (): string => {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

export const generateRefundNo = (): string => {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REF${timestamp}${random}`;
};

export const generateTicketNo = (orderId: number, itemIndex: number): string => {
  const base = orderId.toString(36).toUpperCase().padStart(6, '0');
  const idx = itemIndex.toString().padStart(3, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `TKT${base}${idx}${random}`;
};
