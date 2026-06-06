import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url === 'your-supabase-url' || !key || key === 'your-supabase-anon-key') {
    return NextResponse.next({ request });
  }

  return NextResponse.next({ request });
}
