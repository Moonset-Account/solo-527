import { NextRequest, NextResponse } from 'next/server';
import { checkInVisitor, checkOutVisitor, getVisitorById } from '@/lib/visitor';
import { getCurrentUser } from '@/lib/auth';
import { validateVisitorAccess } from '@/lib/permissions';
import { saveIDPhoto, deleteIDPhoto } from '@/lib/id-photo';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();

    const hasAccess = await validateVisitorAccess(user, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: '无权限查看该访客信息' },
        { status: 403 }
      );
    }

    const visitor = await getVisitorById(params.id, user.id, user.role, user.departmentId);

    return NextResponse.json({ visitor });
  } catch (error) {
    console.error('Error fetching visitor:', error);
    return NextResponse.json(
      { error: '获取访客信息失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    if (body.action === 'checkin') {
      const visitor = await checkInVisitor(params.id, user.id);
      return NextResponse.json({ visitor });
    }

    if (body.action === 'checkout') {
      const visitor = await checkOutVisitor(params.id, user.id);
      return NextResponse.json({ visitor });
    }

    if (body.action === 'upload-photo' && body.photoBase64) {
      const photo = await saveIDPhoto(params.id, body.photoBase64, user.id);
      return NextResponse.json({ photo });
    }

    if (body.action === 'delete-photo') {
      await deleteIDPhoto(params.id, user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating visitor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新访客信息失败' },
      { status: 500 }
    );
  }
}
