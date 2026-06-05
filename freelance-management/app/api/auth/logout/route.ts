import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: -1,
    path: '/',
  });
  
  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': cookie,
      },
    }
  );
}
