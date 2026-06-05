import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Theater, Calendar, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { hasPermission } from '@/lib/utils';

export default async function ProductionsPage() {
  const session = await auth();
  const canCreate = hasPermission(session?.user?.role || 'USER', [
    'COMMITTEE',
    'SUPER_ADMIN',
  ]);

  const productions = await prisma.production.findMany({
    include: {
      _count: {
        select: { characters: true, rehearsals: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusConfig: Record<string, { label: string; className: string }> = {
    DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-700' },
    REHEARSING: { label: '排练中', className: 'bg-blue-100 text-blue-700' },
    PERFORMING: { label: '演出中', className: 'bg-green-100 text-green-700' },
    COMPLETED: { label: '已完成', className: 'bg-gray-100 text-gray-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            剧目管理
          </h1>
          <p className="text-gray-500 mt-1">管理所有剧目和相关信息</p>
        </div>
        {canCreate && (
          <Link
            href="/productions/new"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>新建剧目</span>
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productions.map((production: any) => (
          <Link
            key={production.id}
            href={`/productions/${production.id}`}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 card-hover"
          >
            <div className="h-40 theater-gradient flex items-center justify-center">
              <Theater className="h-16 w-16 text-white/80" />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {production.title}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusConfig[production.status]?.className
                  }`}
                >
                  {statusConfig[production.status]?.label}
                </span>
              </div>
              {production.description && (
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                  {production.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{production._count.characters} 个角色</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{production._count.rehearsals} 次排练</span>
                </div>
              </div>
              {production.startDate && (
                <p className="text-xs text-gray-400 mt-3">
                  {formatDate(production.startDate)} -{' '}
                  {production.endDate && formatDate(production.endDate)}
                </p>
              )}
            </div>
          </Link>
        ))}

        {productions.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-xl">
            <Theater className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无剧目
            </h3>
            <p className="text-gray-500 mb-4">点击上方按钮创建第一个剧目</p>
          </div>
        )}
      </div>
    </div>
  );
}
