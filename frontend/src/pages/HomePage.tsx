import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { concertApi } from '@/api';
import {
  Music,
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Ticket,
  LayoutDashboard,
  FileCheck,
  RefreshCw,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import type { Show } from '@/types';

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: showsData, isLoading } = useQuery({
    queryKey: ['home-shows'],
    queryFn: () => concertApi.showList({ status: 'published', pageSize: 12 }),
  });

  const shows: Show[] = showsData?.list || [];
  const carouselShows = shows.slice(0, 5);

  useEffect(() => {
    if (carouselShows.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselShows.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselShows.length]);

  const prevSlide = () => {
    if (carouselShows.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + carouselShows.length) % carouselShows.length);
  };

  const nextSlide = () => {
    if (carouselShows.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % carouselShows.length);
  };

  const isAdmin = user?.role !== 'audience';

  const audienceQuickLinks = [
    { to: '/concerts', icon: Music, label: '演出列表', desc: '浏览全部演出', color: 'from-blue-500 to-indigo-600' },
    { to: '/my-orders', icon: Ticket, label: '我的订单', desc: '查看购票记录', color: 'from-purple-500 to-pink-600' },
  ];

  const adminQuickLinks = [
    { to: '/admin', icon: LayoutDashboard, label: '工作台', desc: '数据概览', color: 'from-blue-500 to-cyan-600' },
    { to: '/admin/verifications', icon: FileCheck, label: '实名审核', desc: '审核用户信息', color: 'from-amber-500 to-orange-600' },
    { to: '/admin/refunds', icon: RefreshCw, label: '退款处理', desc: '处理退票申请', color: 'from-rose-500 to-red-600' },
  ];

  const quickLinks = isAdmin ? adminQuickLinks : audienceQuickLinks;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 p-6 md:p-8 text-white shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span>{isAdmin ? '管理后台' : '欢迎回来'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {isAdmin ? `${user?.fullName || '管理员'}，您好！` : `您好，${user?.fullName || '用户'}！`}
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            {isAdmin
              ? '今天有新的订单和审核任务等待处理'
              : '发现精彩演出，开启您的音乐之旅'}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary-500" />
            热门演出
          </h2>
          <Link to="/concerts" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {carouselShows.length > 0 ? (
          <div className="relative rounded-2xl overflow-hidden shadow-lg group">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselShows.map((show) => (
                <div key={show.id} className="w-full flex-shrink-0">
                  <div
                    onClick={() => navigate({ to: `/concerts/${show.concertId}` })}
                    className="relative h-64 md:h-80 cursor-pointer"
                  >
                    <img
                      src={show.posterUrl || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200'}
                      alt={show.concertTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <Music className="w-4 h-4" />
                          {show.artist || '未知艺人'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(show.showDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {show.venueName || '待定'}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-2">{show.concertTitle}</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-amber-300">
                          票价 {formatMoney(show.zones?.[0]?.basePrice)} 起
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                          立即购票
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {carouselShows.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 right-6 flex gap-2">
                  {carouselShows.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        idx === currentSlide ? 'w-8 bg-white' : 'w-4 bg-white/50 hover:bg-white/70'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-64 md:h-80 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
            {isLoading ? '加载中...' : '暂无演出'}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full bg-primary-500" />
          快捷入口
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="group p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center mb-4 shadow-md', link.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{link.label}</h3>
                    <p className="text-sm text-gray-500">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary-500" />
            近期演出
          </h2>
          <Link to="/concerts" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            更多演出 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : shows.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center text-gray-400">
            <Music className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p>暂无演出信息</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shows.slice(0, 6).map((show) => (
              <Link
                key={show.id}
                to={`/concerts/${show.concertId}`}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={show.posterUrl || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600'}
                    alt={show.concertTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {show.genre && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
                      {show.genre}
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 text-xs font-bold">
                    <Tag className="w-3 h-3 inline mr-1" />
                    {formatMoney(show.zones?.[0]?.basePrice)}起
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {show.concertTitle}
                  </h3>
                  <div className="space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-gray-400" />
                      <span className="line-clamp-1">{show.artist || '未知艺人'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(show.showDate)}</span>
                      <Clock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                      <span>{show.startTime?.substring(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="line-clamp-1">{show.venueCity || ''} {show.venueName || '待定'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
