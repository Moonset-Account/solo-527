import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { configService } from '@/services/configService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermissionAsync, invalidatePermissionCache } from '@/lib/permissions';
import type { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!await hasPermissionAsync(user.role as Role, 'config', 'view')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const [metrics, permissions, users] = await Promise.all([
      configService.getMetricConfigs(),
      configService.getRolePermissions(),
      configService.getUsers(),
    ]);

    return NextResponse.json({ metrics, permissions, users });
  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!await hasPermissionAsync(user.role as Role, 'config', 'edit')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (type === 'metric') {
      const config = await configService.updateMetricConfig(data.key, {
        name: data.name,
        description: data.description,
        formula: data.formula,
        unit: data.unit,
        category: data.category,
      });
      return NextResponse.json(config);
    }

    if (type === 'permission') {
      const { role, resource, action, enabled } = data;
      if (enabled) {
        const perm = await prisma.rolePermission.create({
          data: { role, resource, action },
        });
        await invalidatePermissionCache();
        return NextResponse.json(perm);
      } else {
        await prisma.rolePermission.deleteMany({
          where: { role, resource, action },
        });
        await invalidatePermissionCache();
        return NextResponse.json({ success: true });
      }
    }

    if (type === 'user') {
      const created = await configService.createUser(data);
      return NextResponse.json(created);
    }

    return NextResponse.json({ error: '未知操作类型' }, { status: 400 });
  } catch (error) {
    console.error('Config update API error:', error);
    return NextResponse.json({ error: '保存配置失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!await hasPermissionAsync(user.role as Role, 'config', 'edit')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const key = searchParams.get('key');

    if (type === 'metric' && key) {
      await configService.deleteMetricConfig(key);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '参数错误' }, { status: 400 });
  } catch (error) {
    console.error('Config delete API error:', error);
    return NextResponse.json({ error: '删除配置失败' }, { status: 500 });
  }
}
