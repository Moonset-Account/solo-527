import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { concertApi } from '@/api';
import {
  Music,
  Calendar,
  MapPin,
  Clock,
  Search,
  Tag,
  Filter,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import type { Show } from '@/types';

export default function ConcertListPage() {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const pageSize = 12;

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'on_sale', label: '售票中' },
    { value: 'upcoming', label: '即将开始' },
    { value: 'ended', label: '已结束' },
  ];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['concerts', keyword, statusFilter, page],
    queryFn: () =>
      concertApi.showList({
        keyword: keyword || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        pageSize,
      }),
  });

  const shows: Show[] = data?.list || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setShowFilterDropdown(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">演出列表</h1>
          <p className="text-sm text-gray-500 mt-1">发现精彩演出，选择心仪的场次</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>共找到</span>
          <span className="font-semibold text-primary-600">{total}</span>
          <span>场演出</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索演出名称、艺人、场馆..."
            className="w-full pl-12 pr-24 py-3 rounded-xl border border-gray-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            搜索
          </button>
        </form>

        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm"
          >
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 font-medium">
              {statusOptions.find((o) => o.value === statusFilter)?.label}
            </span>
            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showFilterDropdown && 'rotate-180')} />
          </button>
          {showFilterDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors',
                      statusFilter === opt.value
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : shows.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <Music className="w-20 h-20 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无匹配的演出</h3>
          <p className="text-sm text-gray-500 mb-4">试试调整搜索条件或清除筛选</p>
          {(keyword || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setKeyword('');
                setStatusFilter('all');
                setPage(1);
              }}
              className="px-5 py-2 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors"
            >
              清除条件
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shows.map((show) => (
              <Link
                key={show.id}
                to={`/concerts/${show.concertId}`}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={show.posterUrl || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600'}
                    alt={show.concertTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {show.genre && (
                      <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
                        {show.genre}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
                      售票中
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-amber-400 text-amber-900 text-xs font-bold shadow-lg">
                    <Tag className="w-3 h-3 inline mr-1" />
                    {formatMoney(show.zones?.[0]?.basePrice)}起
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {show.concertTitle}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-1">{show.artist || '未知艺人'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{formatDate(show.showDate)}</span>
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
                      <span>{show.startTime?.substring(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {show.venueCity ? `${show.venueCity} · ` : ''}
                        {show.venueName || '场馆待定'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">最低票价</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatMoney(show.zones?.[0]?.basePrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-primary-600 font-medium group-hover:gap-2 transition-all">
                      查看详情
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
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
                        'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                        page === pageNum
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
