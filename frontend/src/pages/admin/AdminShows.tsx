import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { concertApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  LayoutGrid,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  MapPin,
  Eye,
  X,
  Users,
  Ticket,
  Lock,
  CheckCircle2,
  RotateCw,
  Info,
} from 'lucide-react';
import {
  cn,
  formatDateTime,
  getZoneTypeText,
  getSeatStatusText,
  getSeatStatusClass,
  formatDate,
} from '@/lib/utils';
import type { Show, SeatZone, Seat, ShowStats } from '@/types';

export default function AdminShows() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [detailShow, setDetailShow] = useState<Show | null>(null);
  const [detailStats, setDetailStats] = useState<ShowStats | null>(null);
  const [detailSeats, setDetailSeats] = useState<Record<number, Seat[]>>({});
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [loadingSeatsZone, setLoadingSeatsZone] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-shows', searchText, statusFilter, page],
    queryFn: () =>
      concertApi.showList({
        keyword: searchText || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        pageSize,
      }),
  });

  const shows: Show[] = data?.list || data || [];
  const total = data?.total || shows.length;
  const totalPages = Math.ceil(total / pageSize);

  const syncStatsMutation = useMutation({
    mutationFn: (showId: number) => concertApi.syncShowStats(showId),
    onSuccess: (_, showId) => {
      toast.success('场次统计已同步');
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] });
      if (detailShow?.id === showId) {
        loadShowDetail(detailShow);
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '同步失败'),
  });

  const loadShowDetail = async (show: Show) => {
    setDetailShow(show);
    setDetailSeats({});
    setSelectedZoneId(show.zones?.[0]?.id || null);
    try {
      const stats = await concertApi.getShowStats(show.id);
      setDetailStats(stats);
    } catch {
      setDetailStats(null);
    }
  };

  const loadZoneSeats = async (zoneId: number) => {
    if (detailSeats[zoneId] || !detailShow) return;
    setLoadingSeatsZone(zoneId);
    try {
      const seats = await concertApi.getSeats(detailShow.id, zoneId);
      setDetailSeats((prev) => ({ ...prev, [zoneId]: seats?.list || seats || [] }));
    } catch {
      toast.error('加载座位数据失败');
    } finally {
      setLoadingSeatsZone(null);
    }
  };

  const handleViewDetail = (show: Show) => {
    loadShowDetail(show);
  };

  const renderSeatStatusLegend = () => (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      {['available', 'held', 'sold', 'refunded', 'scanned'].map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <div className={cn('w-3 h-3 rounded', getSeatStatusClass(status))} />
          <span className="text-gray-600">{getSeatStatusText(status)}</span>
        </div>
      ))}
    </div>
  );

  const renderSeatGrid = (zone: SeatZone) => {
    const seats = detailSeats[zone.id] || [];
    if (loadingSeatsZone === zone.id) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <RotateCw className="w-5 h-5 animate-spin mr-2" />
          加载座位中...
        </div>
      );
    }
    if (seats.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Info className="w-8 h-8 mb-2 text-gray-200" />
          <p className="text-sm">点击上方区域加载座位数据</p>
        </div>
      );
    }
    const rows: Record<string, Seat[]> = {};
    seats.forEach((seat) => {
      const key = String(seat.rowNumber);
      if (!rows[key]) rows[key] = [];
      rows[key].push(seat);
    });
    const rowKeys = Object.keys(rows).sort((a, b) => Number(a) - Number(b));
    return (
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full p-4 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100">
          <div className="mb-6 text-center">
            <div className="inline-block px-16 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-medium rounded-full shadow-sm">
              舞 台
            </div>
          </div>
          <div className="space-y-1.5">
            {rowKeys.map((rowKey) => (
              <div key={rowKey} className="flex items-center justify-center gap-1">
                <span className="w-8 text-xs text-gray-400 text-right pr-2">{rowKey}排</span>
                <div className="flex gap-1 flex-wrap justify-center">
                  {rows[rowKey]
                    .sort((a, b) => a.seatNumber - b.seatNumber)
                    .map((seat) => (
                      <div
                        key={seat.id}
                        className={cn(
                          'w-5 h-5 rounded-t-md flex items-center justify-center text-[8px] text-white cursor-default transition-transform hover:scale-110',
                          getSeatStatusClass(seat.status),
                          'shadow-sm'
                        )}
                        title={`${seat.seatLabel} - ${getSeatStatusText(seat.status)}`}
                      >
                        {seat.seatNumber}
                      </div>
                    ))}
                </div>
                <span className="w-8 text-xs text-gray-400 text-left pl-2">{rowKey}排</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary-600" />
            场次座位管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">查看场次座位分布、销售情况和上座率统计</p>
        </div>
        <button onClick={() => refetch()} className="btn-outline">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索演出名称、场馆、艺人..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                className="input pl-9"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="input appearance-none pr-9 min-w-40"
              >
                <option value="all">全部状态</option>
                <option value="on_sale">售票中</option>
                <option value="upcoming">即将开售</option>
                <option value="ended">已结束</option>
                <option value="cancelled">已取消</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>演出名称</th>
                <th>日期时间</th>
                <th>场馆</th>
                <th>总座位</th>
                <th>已售/可用</th>
                <th>上座率</th>
                <th>状态</th>
                <th>最后同步</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-5 bg-gray-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : shows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="py-16 text-center">
                      <LayoutGrid className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-500">暂无场次数据</p>
                    </div>
                  </td>
                </tr>
              ) : (
                shows.map((show) => {
                  const totalSeats = show.zones?.reduce((s, z) => s + z.totalSeats, 0) || 0;
                  const soldSeats = show.zones?.reduce((s, z) => s + z.soldSeats, 0) || 0;
                  const availableSeats = show.zones?.reduce((s, z) => s + z.availableSeats, 0) || 0;
                  const rate = totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 100) : 0;
                  return (
                    <tr key={show.id}>
                      <td>
                        <div className="font-medium text-gray-800 line-clamp-1 max-w-56">
                          {show.concertTitle}
                        </div>
                        {show.artist && (
                          <div className="text-xs text-gray-400 mt-0.5">{show.artist}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(show.showDate)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 ml-5">
                          {show.startTime} - {show.endTime}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-start gap-1.5 max-w-40">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-gray-600 line-clamp-1">
                              {show.venueName || '-'}
                            </span>
                            {show.venueCity && (
                              <div className="text-xs text-gray-400 mt-0.5">{show.venueCity}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm font-medium text-gray-700">{totalSeats}</td>
                      <td>
                        <div className="space-y-0.5">
                          <div className="text-sm">
                            <span className="font-medium text-blue-600">{soldSeats}</span>
                            <span className="text-gray-400 mx-1">/</span>
                            <span className="text-emerald-600">{availableSeats}</span>
                          </div>
                          <div className="text-xs text-gray-400">已售 / 可用</div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                rate >= 80
                                  ? 'bg-emerald-500'
                                  : rate >= 50
                                  ? 'bg-blue-500'
                                  : rate >= 20
                                  ? 'bg-amber-500'
                                  : 'bg-gray-400'
                              )}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10">{rate}%</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={cn(
                            'badge',
                            show.status === 'on_sale'
                              ? 'bg-green-100 text-green-700'
                              : show.status === 'upcoming'
                              ? 'bg-blue-100 text-blue-700'
                              : show.status === 'ended'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {show.status === 'on_sale'
                            ? '售票中'
                            : show.status === 'upcoming'
                            ? '即将开售'
                            : show.status === 'ended'
                            ? '已结束'
                            : '已取消'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {detailStats && detailStats.showId === show.id
                            ? formatDateTime(detailStats.lastSyncedAt)
                            : '-'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDetail(show)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => syncStatsMutation.mutate(show.id)}
                            disabled={syncStatsMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                            title="同步统计"
                          >
                            <RotateCw
                              className={cn(
                                'w-4 h-4',
                                syncStatsMutation.isPending && 'animate-spin'
                              )}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              共 <span className="font-medium text-gray-700">{total}</span> 条，
              第 <span className="font-medium text-gray-700">{page}</span> / {totalPages} 页
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-outline !py-1.5 !px-3 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      '!py-1.5 !px-3 text-sm rounded-lg font-medium transition-all',
                      page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-outline !py-1.5 !px-3 text-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setDetailShow(null);
              setDetailStats(null);
              setDetailSeats({});
              setSelectedZoneId(null);
            }}
          />
          <div className="relative w-full max-w-5xl card shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
                  <LayoutGrid className="w-5 h-5 text-primary-600" />
                  {detailShow.concertTitle}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(detailShow.showDate)} {detailShow.startTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {detailShow.venueName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncStatsMutation.mutate(detailShow.id)}
                  disabled={syncStatsMutation.isPending}
                  className="btn-outline !py-1.5 text-sm"
                >
                  <RotateCw
                    className={cn('w-4 h-4', syncStatsMutation.isPending && 'animate-spin')}
                  />
                  同步统计
                </button>
                <button
                  onClick={() => {
                    setDetailShow(null);
                    setDetailStats(null);
                    setDetailSeats({});
                    setSelectedZoneId(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="p-5 space-y-6">
                {detailStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Ticket className="w-3.5 h-3.5" />
                        总票数
                      </div>
                      <div className="text-2xl font-bold text-blue-700 mt-2">
                        {detailStats.totalTickets}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                      <div className="flex items-center gap-2 text-xs text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已售出
                      </div>
                      <div className="text-2xl font-bold text-emerald-700 mt-2">
                        {detailStats.soldTickets}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                      <div className="flex items-center gap-2 text-xs text-amber-600">
                        <Lock className="w-3.5 h-3.5" />
                        已入场
                      </div>
                      <div className="text-2xl font-bold text-amber-700 mt-2">
                        {detailStats.scannedTickets}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                      <div className="flex items-center gap-2 text-xs text-purple-600">
                        <Users className="w-3.5 h-3.5" />
                        上座率
                      </div>
                      <div className="text-2xl font-bold text-purple-700 mt-2">
                        {parseFloat(detailStats.attendanceRate || '0').toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-primary-600" />
                      区域座位分布
                    </h4>
                    {renderSeatStatusLegend()}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(detailShow.zones || []).map((zone) => {
                      const sold = zone.soldSeats || 0;
                      const total = zone.totalSeats || 0;
                      const available = zone.availableSeats || 0;
                      const held = total - sold - available;
                      const rate = total > 0 ? Math.round((sold / total) * 100) : 0;
                      const isSelected = selectedZoneId === zone.id;
                      return (
                        <div
                          key={zone.id}
                          onClick={() => {
                            setSelectedZoneId(zone.id);
                            loadZoneSeats(zone.id);
                          }}
                          className={cn(
                            'p-4 rounded-xl border-2 cursor-pointer transition-all',
                            isSelected
                              ? 'border-primary-500 bg-primary-50/50 shadow-md'
                              : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-semibold text-gray-800">{zone.name}</div>
                              <span
                                className={cn(
                                  'text-xs badge mt-1',
                                  zone.zoneType === 'vip'
                                    ? 'bg-amber-100 text-amber-700'
                                    : zone.zoneType === 'premium'
                                    ? 'bg-purple-100 text-purple-700'
                                    : zone.zoneType === 'standard'
                                    ? 'bg-blue-100 text-blue-700'
                                    : zone.zoneType === 'economy'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                )}
                              >
                                {getZoneTypeText(zone.zoneType)}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                            <div>
                              <div className="font-bold text-emerald-600">{available}</div>
                              <div className="text-gray-400 mt-0.5">可用</div>
                            </div>
                            <div>
                              <div className="font-bold text-amber-600">{held}</div>
                              <div className="text-gray-400 mt-0.5">锁定</div>
                            </div>
                            <div>
                              <div className="font-bold text-gray-600">{sold}</div>
                              <div className="text-gray-400 mt-0.5">已售</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">上座率</span>
                              <span className="font-medium text-gray-700">{rate}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  rate >= 80
                                    ? 'bg-emerald-500'
                                    : rate >= 50
                                    ? 'bg-blue-500'
                                    : rate >= 20
                                    ? 'bg-amber-500'
                                    : 'bg-gray-400'
                                )}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedZoneId &&
                    (() => {
                      const zone = detailShow.zones?.find((z) => z.id === selectedZoneId);
                      if (!zone) return null;
                      return (
                        <div className="card overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-gray-800">{zone.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {zone.rows} 排 × {zone.seatsPerRow} 座 = {zone.totalSeats} 座
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">{renderSeatGrid(zone)}</div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
