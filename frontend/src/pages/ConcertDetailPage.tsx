import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { concertApi } from '@/api';
import {
  Music,
  Calendar,
  MapPin,
  Clock,
  User,
  Building,
  Ticket,
  ChevronRight,
  ArrowLeft,
  Tag,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn, formatDate, formatMoney, getZoneTypeText } from '@/lib/utils';
import type { Concert, Show, SeatZone } from '@/types';
import dayjs from 'dayjs';

export default function ConcertDetailPage() {
  const { id } = useParams({ from: '/concerts/$id' });
  const navigate = useNavigate();
  const concertId = parseInt(id, 10);

  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  const { data: concert, isLoading } = useQuery({
    queryKey: ['concert', concertId],
    queryFn: () => concertApi.get(concertId),
  });

  const shows: Show[] = concert?.shows || [];

  const selectedShow = selectedShowId
    ? shows.find((s) => s.id === selectedShowId)
    : shows.find((s) => dayjs(s.showDate).isAfter(dayjs())) || shows[0];

  const handleBuyTicket = (showId: number) => {
    navigate({ to: `/shows/${showId}/select-seats` });
  };

  const getShowStatus = (show: Show) => {
    const now = dayjs();
    const showDate = dayjs(`${show.showDate} ${show.startTime}`);
    const salesStart = dayjs(show.salesStartAt);
    const salesEnd = dayjs(show.salesEndAt);

    if (now.isAfter(showDate)) {
      return { text: '已结束', color: 'bg-gray-100 text-gray-600', disabled: true };
    }
    if (now.isBefore(salesStart)) {
      return { text: '即将开售', color: 'bg-blue-100 text-blue-700', disabled: true };
    }
    if (now.isAfter(salesEnd)) {
      return { text: '已结束售票', color: 'bg-gray-100 text-gray-600', disabled: true };
    }
    return { text: '售票中', color: 'bg-green-100 text-green-700', disabled: false };
  };

  const getMinPrice = (show: Show) => {
    if (!show.zones || show.zones.length === 0) return null;
    return show.zones.reduce((min: number, z: SeatZone) => {
      const price = parseFloat(z.basePrice);
      return price < min ? price : min;
    }, Infinity);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: '/concerts' })}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回演出列表
      </button>

      {isLoading ? (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-72 md:h-96 bg-gray-100" />
          <div className="p-6 space-y-4">
            <div className="h-8 bg-gray-100 rounded w-1/2" />
            <div className="h-5 bg-gray-100 rounded w-1/4" />
            <div className="h-5 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ) : !concert ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">演出不存在</h3>
          <p className="text-sm text-gray-500">该演出可能已被删除或不存在</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="relative h-72 md:h-96">
              <img
                src={concert.posterUrl || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600'}
                alt={concert.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {concert.genre && (
                  <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
                    {concert.genre}
                  </span>
                )}
                <span className={cn(
                  'px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-medium',
                  concert.status === 'published'
                    ? 'bg-green-500/90 text-white'
                    : concert.status === 'cancelled'
                    ? 'bg-red-500/90 text-white'
                    : 'bg-gray-500/90 text-white'
                )}>
                  {concert.status === 'published' ? '已发布' : concert.status === 'cancelled' ? '已取消' : '草稿'}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{concert.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-white/80">
                  <span className="inline-flex items-center gap-1.5">
                    <Music className="w-4 h-4 md:w-5 md:h-5" />
                    {concert.artist || '未知艺人'}
                  </span>
                  {concert.organizer && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building className="w-4 h-4 md:w-5 md:h-5" />
                      {concert.organizer}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {concert.description && (
              <div className="p-6 md:p-8 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary-500" />
                  演出介绍
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {concert.description}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                演出场次
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                共 {shows.length} 场演出，选择合适的场次购票
              </p>
            </div>

            {shows.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <h3 className="text-base font-semibold text-gray-700 mb-2">暂未开放场次</h3>
                <p className="text-sm text-gray-500">该演出暂未排期，请稍后关注</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {shows.map((show) => {
                  const status = getShowStatus(show);
                  const minPrice = getMinPrice(show);
                  const isSelected = selectedShow?.id === show.id;

                  return (
                    <div
                      key={show.id}
                      className={cn(
                        'p-5 md:p-6 transition-colors cursor-pointer',
                        isSelected ? 'bg-primary-50/50' : 'hover:bg-gray-50',
                        status.disabled && 'opacity-60'
                      )}
                      onClick={() => !status.disabled && setSelectedShowId(show.id)}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                        <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex flex-col items-center justify-center text-primary-700">
                          <span className="text-lg md:text-xl font-bold">
                            {dayjs(show.showDate).format('MM')}月
                          </span>
                          <span className="text-xl md:text-2xl font-bold -mt-1">
                            {dayjs(show.showDate).format('DD')}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-800 text-lg">
                              {formatDate(show.showDate)} {show.concertTitle !== concert.title ? `· ${show.concertTitle}` : ''}
                            </h4>
                            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', status.color)}>
                              {status.text}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {show.startTime?.substring(0, 5)} - {show.endTime?.substring(0, 5)}
                            </span>
                            {show.doorsOpenTime && (
                              <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                入场 {show.doorsOpenTime.substring(0, 5)}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {show.venueCity ? `${show.venueCity} · ` : ''}
                              {show.venueName || '场馆待定'}
                            </span>
                            {show.venueAddress && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {show.venueAddress}
                              </span>
                            )}
                          </div>
                          {show.zones && show.zones.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {show.zones.map((zone: SeatZone) => (
                                <span
                                  key={zone.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600"
                                >
                                  <Tag className="w-3 h-3" />
                                  {getZoneTypeText(zone.zoneType)}区
                                  <span className="font-semibold text-gray-800 ml-1">
                                    {formatMoney(zone.basePrice)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 lg:gap-2 flex-shrink-0">
                          {minPrice !== null && minPrice !== Infinity && (
                            <div className="text-right">
                              <div className="text-xs text-gray-400">票价</div>
                              <div className="text-2xl font-bold text-primary-600">
                                {formatMoney(minPrice)}
                                <span className="text-xs font-normal text-gray-400 ml-1">起</span>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyTicket(show.id);
                            }}
                            disabled={status.disabled}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md',
                              status.disabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-primary-500 to-primary-700 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5'
                            )}
                          >
                            <Ticket className="w-4 h-4" />
                            {status.disabled ? '不可购票' : '立即购票'}
                            {!status.disabled && <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isSelected && !status.disabled && show.description && (
                        <div className="mt-4 p-4 rounded-xl bg-white border border-primary-100">
                          <p className="text-sm text-gray-600">{show.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedShow && selectedShow.venueCapacity && (
            <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">观演须知</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>· 场馆容量约 {selectedShow.venueCapacity} 人，请提前到场安检入场</li>
                    <li>· 一人一票，对号入座</li>
                    <li>· 儿童一律凭成人票入场</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
