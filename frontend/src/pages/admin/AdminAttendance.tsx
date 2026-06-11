import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { concertApi, attendanceApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  QrCode,
  Star,
  StarOff,
  Clock,
  CheckCircle2,
  X,
  RotateCw,
  BarChart3,
  TrendingUp,
  MessageSquare,
  ScanLine,
  Ticket,
  User,
  MapPin,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  cn,
  formatDateTime,
  formatDate,
} from '@/lib/utils';
import type { Show, AttendanceRecord } from '@/types';

export default function AdminAttendance() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showId, setShowId] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [scanModal, setScanModal] = useState(false);
  const [scanTicketNo, setScanTicketNo] = useState('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const { data: showsData } = useQuery({
    queryKey: ['admin-attendance-shows'],
    queryFn: () => concertApi.showList({ pageSize: 100 }),
  });

  const shows: Show[] = showsData?.list || showsData || [];

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-attendance-stats', showId],
    queryFn: () => attendanceApi.stats({ showId: showId === 'all' ? undefined : showId }),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-attendance', showId, page],
    queryFn: () =>
      attendanceApi.list({
        showId: showId === 'all' ? undefined : showId,
        page,
        pageSize,
      }),
  });

  const records: AttendanceRecord[] = data?.list || data || [];
  const total = data?.total || records.length;
  const totalPages = Math.ceil(total / pageSize);

  const stats = statsData || {
    totalScanned: 0,
    attendanceRate: 0,
    avgScore: 0,
    feedbackCount: 0,
  };

  const scanMutation = useMutation({
    mutationFn: (data: any) => attendanceApi.scan(data),
    onSuccess: (result) => {
      setScanResult({
        success: true,
        message: '扫码入场成功',
        data: result,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['admin-attendance-stats'] });
    },
    onError: (e: any) => {
      setScanResult({
        success: false,
        message: e.response?.data?.error || '扫码失败，请检查票号',
      });
    },
  });

  const handleScanSubmit = () => {
    if (!scanTicketNo.trim()) {
      toast.error('请输入票号或扫描二维码');
      return;
    }
    setScanResult(null);
    scanMutation.mutate({
      ticketNo: scanTicketNo.trim(),
      scanType: 'manual',
    });
  };

  const openScanModal = () => {
    setScanModal(true);
    setScanTicketNo('');
    setScanResult(null);
  };

  const renderStars = (score: number | undefined | null, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
    if (!score) {
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarOff key={i} className={cn(sizeClass, 'text-gray-200')} />
          ))}
        </div>
      );
    }
    const rounded = Math.round(score);
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClass,
              i < rounded ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
            )}
          />
        ))}
        {size !== 'sm' && (
          <span className={cn('ml-1 font-medium', size === 'lg' ? 'text-lg' : 'text-sm', 'text-amber-600')}>
            {score.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  const selectedShow = shows.find((s) => s.id === showId);

  const totalTickets =
    showId === 'all'
      ? shows.reduce((sum, s) => {
          const total = s.zones?.reduce((zs, z) => zs + z.totalSeats, 0) || 0;
          return sum + total;
        }, 0)
      : selectedShow?.zones?.reduce((zs, z) => zs + z.totalSeats, 0) || 0;

  const attendanceRateValue =
    totalTickets > 0 ? Math.round(((stats.totalScanned || 0) / totalTickets) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            到场反馈
          </h1>
          <p className="text-sm text-gray-500 mt-1">查看用户签到数据、评价反馈和扫码入场</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openScanModal} className="btn-primary">
            <QrCode className="w-4 h-4" />
            扫码入场
          </button>
          <button onClick={() => refetch()} className="btn-outline">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={showId}
                onChange={(e) => {
                  setShowId(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setPage(1);
                }}
                className="input appearance-none pr-9 min-w-64"
              >
                <option value="all">全部场次</option>
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.concertTitle} - {formatDate(s.showDate)} {s.startTime}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {showId !== 'all' && selectedShow && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {selectedShow.venueName}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-gray-100 space-y-3">
                <div className="h-4 bg-gray-50 rounded w-20 animate-pulse" />
                <div className="h-8 bg-gray-50 rounded w-32 animate-pulse" />
              </div>
            ))
          ) : (
            <>
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-blue-600">总签到</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-700">
                  {stats.totalScanned || 0}
                </div>
                <div className="text-xs text-blue-600/70 mt-1">
                  / 总票数 {totalTickets || '-'}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-emerald-600">签到率</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-emerald-700">
                    {stats.attendanceRate !== undefined
                      ? parseFloat(stats.attendanceRate).toFixed(1)
                      : attendanceRateValue || 0}
                  </span>
                  <span className="text-sm font-medium text-emerald-600">%</span>
                </div>
                <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        stats.attendanceRate !== undefined
                          ? parseFloat(stats.attendanceRate)
                          : attendanceRateValue || 0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-amber-600">平均评分</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-amber-700">
                    {stats.avgScore !== undefined
                      ? parseFloat(String(stats.avgScore)).toFixed(1)
                      : '0.0'}
                  </span>
                  <span className="text-sm text-amber-600">/ 5.0</span>
                </div>
                {renderStars(
                  stats.avgScore !== undefined ? parseFloat(String(stats.avgScore)) : 0,
                  'sm'
                )}
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-purple-600">反馈数</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-700">
                  {stats.feedbackCount || 0}
                </div>
                <div className="text-xs text-purple-600/70 mt-1">
                  {stats.totalScanned > 0
                    ? `反馈率 ${Math.round(
                        ((stats.feedbackCount || 0) / (stats.totalScanned || 1)) * 100
                      )}%`
                    : '暂无反馈'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              用户反馈列表
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              共 <span className="font-semibold text-gray-700">{total}</span> 条到场记录
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>用户</th>
                <th>场次</th>
                <th>座位</th>
                <th>签到方式</th>
                <th>签到状态</th>
                <th>评分</th>
                <th>反馈内容</th>
                <th>签到时间</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-5 bg-gray-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="py-16 text-center">
                      <Users className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-500">暂无到场记录</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {showId === 'all' ? '选择场次或等待用户签到' : '该场次暂无签到记录'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const show = shows.find((s) => s.id === record.showId);
                  const hasFeedback = record.feedbackScore || record.feedbackComment;
                  return (
                    <tr key={record.id} className={cn(hasFeedback && 'bg-amber-50/20')}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                            {(record.userName || 'U')[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 line-clamp-1">
                              {record.userName || '-'}
                            </div>
                            {record.scannedByName && (
                              <div className="text-xs text-gray-400">
                                检票：{record.scannedByName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="max-w-48">
                          <div className="text-sm text-gray-800 line-clamp-1 font-medium">
                            {show?.concertTitle || `场次 #${record.showId}`}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(show?.showDate || '')}
                          </div>
                        </div>
                      </td>
                      <td>
                        {record.seatId ? (
                          <span className="badge bg-gray-100 text-gray-700">
                            <Ticket className="w-3 h-3 mr-1" />
                            座位 #{record.seatId}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">站票</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={cn(
                            'badge',
                            record.scanType === 'qrcode'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-indigo-100 text-indigo-700'
                          )}
                        >
                          {record.scanType === 'qrcode' ? (
                            <>
                              <QrCode className="w-3 h-3 mr-1" />
                              扫码
                            </>
                          ) : record.scanType === 'manual' ? (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              人工
                            </>
                          ) : (
                            record.scanType
                          )}
                        </span>
                      </td>
                      <td>
                        {record.hasAttended ? (
                          <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            已到场
                          </span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" />
                            未到场
                          </span>
                        )}
                      </td>
                      <td>
                        {record.feedbackScore ? (
                          <div className="flex items-center gap-1">
                            {renderStars(record.feedbackScore, 'sm')}
                            <span className="text-xs text-amber-600 font-medium ml-1">
                              {record.feedbackScore.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">未评分</span>
                        )}
                      </td>
                      <td>
                        {record.feedbackComment ? (
                          <div className="max-w-56">
                            <div className="text-sm text-gray-700 line-clamp-2">
                              {record.feedbackComment}
                            </div>
                            {record.feedbackSubmittedAt && (
                              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDateTime(record.feedbackSubmittedAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">无反馈</span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDateTime(record.scannedAt)}
                        </span>
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

      {scanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setScanModal(false);
              setScanTicketNo('');
              setScanResult(null);
            }}
          />
          <div className="relative w-full max-w-md card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary-600" />
                扫码入场
              </h3>
              <button
                onClick={() => {
                  setScanModal(false);
                  setScanTicketNo('');
                  setScanResult(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-center py-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl border-4 border-dashed border-primary-200 bg-primary-50/50 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-primary-400" />
                  </div>
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary-500/50 animate-pulse" />
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700">
                    <div className="font-medium mb-0.5">操作说明</div>
                    <div>请扫描门票二维码或手动输入票号完成入场检票</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  票号
                  <span className="text-gray-400 font-normal ml-1">（或扫码）</span>
                </label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={scanTicketNo}
                    onChange={(e) => {
                      setScanTicketNo(e.target.value);
                      setScanResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleScanSubmit();
                    }}
                    placeholder="请输入票号，如 TK2025061200001"
                    className="input pl-9 font-mono"
                    autoFocus
                  />
                </div>
              </div>

              {scanResult && (
                <div
                  className={cn(
                    'p-4 rounded-xl border',
                    scanResult.success
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {scanResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div
                        className={cn(
                          'font-semibold text-sm',
                          scanResult.success ? 'text-emerald-700' : 'text-rose-700'
                        )}
                      >
                        {scanResult.message}
                      </div>
                      {scanResult.success && scanResult.data && (
                        <div className="mt-2 space-y-1 text-xs text-emerald-600/80">
                          {scanResult.data.userName && (
                            <div>用户：{scanResult.data.userName}</div>
                          )}
                          {scanResult.data.seatLabel && (
                            <div>座位：{scanResult.data.seatLabel}</div>
                          )}
                          {scanResult.data.zoneName && (
                            <div>区域：{scanResult.data.zoneName}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => {
                  setScanTicketNo('');
                  setScanResult(null);
                }}
                className="btn-outline"
                disabled={scanMutation.isPending}
              >
                清空
              </button>
              <button
                onClick={handleScanSubmit}
                disabled={scanMutation.isPending}
                className="btn-primary"
              >
                {scanMutation.isPending ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    检票中...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    确认检票
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
