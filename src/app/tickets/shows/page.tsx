import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, MapPin, Ticket, Users } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default async function ShowsPage() {
  const shows = await prisma.show.findMany({
    where: {
      startTime: {
        gte: new Date(),
      },
    },
    include: {
      production: true,
      venue: true,
      ticketTiers: true,
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">
          演出购票
        </h1>
        <p className="text-gray-500 mt-1">浏览并购买您喜爱的演出门票</p>
      </div>

      <div className="space-y-6">
        {shows.map((show: any) => (
          <div
            key={show.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 h-48 md:h-auto theater-gradient flex items-center justify-center">
                <Ticket className="h-20 w-20 text-white/80" />
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {show.production.title}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(show.startTime, 'yyyy年MM月dd日 HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{show.venue.name}</span>
                      </div>
                    </div>
                  </div>
                  {show.isSaleOpen ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      售票中
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                      未开售
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  {show.ticketTiers.map((tier: any) => (
                    <div
                      key={tier.id}
                      className="px-4 py-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-500">{tier.name}</span>
                      <span className="ml-2 font-semibold text-primary">
                        {formatCurrency(tier.price.toString())}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>已售 {show._count.orders} 张</span>
                  </div>
                  {show.isSaleOpen && (
                    <Link
                      href={`/tickets/shows/${show.id}/select`}
                      className="btn-primary"
                    >
                      立即选座
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {shows.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无演出
            </h3>
            <p className="text-gray-500">敬请期待更多精彩演出</p>
          </div>
        )}
      </div>
    </div>
  );
}
