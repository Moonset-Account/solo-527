import { NextResponse } from 'next/server';
import { getSites, addSite } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organization = searchParams.get('organization');

    const sites = await getSites(organization || undefined);
    return NextResponse.json(sites);
  } catch (error: any) {
    console.error('获取站点错误:', error);
    return NextResponse.json(
      { error: '获取站点失败: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const site = await addSite(body);
    return NextResponse.json(site, { status: 201 });
  } catch (error: any) {
    console.error('添加站点错误:', error);
    return NextResponse.json(
      { error: '添加站点失败: ' + error.message },
      { status: 500 }
    );
  }
}
