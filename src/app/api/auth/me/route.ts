import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/server/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, data: null });
    }
    return NextResponse.json({ success: true, data: session });
  } catch {
    return NextResponse.json({ success: false, data: null });
  }
}
