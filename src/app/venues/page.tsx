import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MapPin, Users, Plus, Calendar, Edit } from 'lucide-react';
import Link from 'next/link';
import { hasPermission } from '@/lib/utils';

export default async function VenuesPage() {
  const session = await auth();
  const canManage = hasPermission(session?.user?.role || 'USER', [
    'SUPER_ADMIN',
    'COMMITTEE',
  ]);

  const venues = await prisma.venue.findMany({
    include: {
      _count: {
        select: { rehearsals: true, shows: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const typeLabels: Record<string, string> = {
    REHEARSAL: '排练场地',
    PERFORMANCE: '演出场地',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            场地管理
          </h1>
          <p className="text-gray-500 mt-1">管理排练和演出场地</p>
        </div>
        {canManage && (
          <Link
            href="/venues/new"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>新建场地</span>
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="h-32 theater-gradient flex items-center justify-center">
              <MapPin className="h-16 w-16 text-white/80" />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {venue.name}
                </h3>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {typeLabels[venue.type] || venue.type}
                </span>
              </div>
              {venue.location && (
                <p className="text-gray-500 text-sm mb-3">{venue.location}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{venue.capacity} 人</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{venue._count.rehearsals + venue._count.shows} 次使用</span>
                </div>
              </div>
              {venue.facilities && (
                <p className="text-xs text-gray-400 mb-4">
                  设施：{venue.facilities}
                </p>
              )}
              {canManage && (
                <Link
                  href={`/venues/${venue.id}/edit`}
                  className="flex items-center justify-center w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Link>
              )}
            </div>
          </div>
        ))}

        {venues.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-xl">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无场地</h3>
            <p className="text-gray-500">点击上方按钮添加第一个场地</p>
          </div>
        )}
      </div>
    </div>
  );
}
