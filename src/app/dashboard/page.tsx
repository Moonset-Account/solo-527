import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Calendar,
  Users,
  Ticket,
  TrendingUp,
  Clock,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await auth();
  
  const [productions, rehearsals, shows, financeStats] = await Promise.all([
    prisma.production.count({
      where: { status: { not: 'COMPLETED' } },
    }),
    prisma.rehearsal.count({
      where: {
        startTime: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
    }),
    prisma.show.count({
      where: {
        startTime: {
          gte: new Date(),
        },
      },
    }),
    prisma.financeRecord.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        type: 'INCOME',
        recordedAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    }),
  ]);

  const upcomingRehearsals = await prisma.rehearsal.findMany({
    where: {
      startTime: {
        gte: new Date(),
      },
    },
    include: {
      production: true,
      venue: true,
    },
    orderBy: {
      startTime: 'asc',
    },
    take: 5,
  });

  const recentShows = await prisma.show.findMany({
    where: {
      startTime: {
        gte: new Date(),
      },
    },
    include: {
      production: true,
      venue: true,
    },
    orderBy: {
      startTime: 'asc',
    },
    take: 3,
  });

  const stats = [
    {
      title: '进行中剧目',
      value: productions,
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
      href: '/productions',
    },
    {
      title: '待进行排练',
      value: rehearsals,
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-green-500',
      href: '/rehearsals/calendar',
    },
    {
      title: '即将上演',
      value: shows,
      icon: <Ticket className="h-6 w-6" />,
      color: 'bg-purple-500',
      href: '/tickets/shows',
    },
    {
      title: '本月收入',
      value: formatCurrency(financeStats._sum.amount?.toString() || '0'),
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-orange-500',
      href: '/finance/records',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">
          欢迎回来，{session?.user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {formatDate(new Date(), 'yyyy年MM月dd日')} · 美好的一天从排练开始
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Link
            key={index}
            href={stat.href}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl text-white`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              即将进行的排练
            </h2>
            <Link
              href="/rehearsals/calendar"
              className="text-primary hover:text-primary-light text-sm flex items-center"
            >
              查看全部 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingRehearsals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无排练安排</p>
            ) : (
              upcomingRehearsals.map((rehearsal) => (
                <div
                  key={rehearsal.id}
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="bg-primary/10 p-3 rounded-lg mr-4">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {rehearsal.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {rehearsal.production.title} · {rehearsal.venue.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(rehearsal.startTime, 'MM-dd')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(rehearsal.startTime, 'HH:mm')} -{' '}
                      {formatDate(rehearsal.endTime, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">近期演出</h2>
            <Link
              href="/tickets/shows"
              className="text-primary hover:text-primary-light text-sm flex items-center"
            >
              购票 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentShows.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无演出安排</p>
            ) : (
              recentShows.map((show) => (
                <div
                  key={show.id}
                  className="border border-gray-100 rounded-lg p-4 hover:border-primary/30 transition-colors"
                >
                  <p className="font-medium text-gray-900">
                    {show.production.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(show.startTime, 'MM月dd日 HH:mm')}
                  </p>
                  <p className="text-sm text-gray-500">{show.venue.name}</p>
                  {show.isSaleOpen && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      售票中
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
