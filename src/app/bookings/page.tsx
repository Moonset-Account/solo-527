'use client';

import { useState } from 'react';
import { Calendar, Clock, FileText, X, ChevronLeft, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { formatDateTime } from '@/lib/utils';
import { BookingStatus } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusConfig: Record<string, { label: string; variant: string }> = {
  APPROVED: { label: '已批准', variant: 'success' },
  PENDING_MENTOR: { label: '待导师确认', variant: 'warning' },
  PENDING_ADMIN: { label: '待管理员审核', variant: 'warning' },
  REJECTED: { label: '已拒绝', variant: 'destructive' },
  CANCELLED: { label: '已取消', variant: 'secondary' },
  COMPLETED: { label: '已完成', variant: 'secondary' },
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const router = useRouter();

  const { data: bookings, isLoading, refetch } = trpc.booking.getMyBookings.useQuery(
    activeTab === 'all' ? {} : { status: activeTab as BookingStatus },
    { refetchOnWindowFocus: false }
  );

  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      refetch();
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedBooking(null);
    },
  });

  const handleCancel = () => {
    if (selectedBooking && cancelReason.trim()) {
      cancelBooking.mutate({
        bookingId: selectedBooking.id,
        reason: cancelReason,
      });
    }
  };

  const filteredBookings = bookings || [];

  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b: any) => b.status.startsWith('PENDING')).length || 0,
    approved: bookings?.filter((b: any) => b.status === 'APPROVED').length || 0,
    completed: bookings?.filter((b: any) => b.status === 'COMPLETED').length || 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">我的预约</h1>
          <p className="text-slate-500 mt-1">查看和管理您的设备预约</p>
        </div>
        <Button asChild>
          <Link href="/bookings/new">
            <Plus className="w-4 h-4 mr-2" />
            新建预约
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="PENDING_MENTOR">待导师</TabsTrigger>
          <TabsTrigger value="PENDING_ADMIN">待管理员</TabsTrigger>
          <TabsTrigger value="APPROVED">已批准</TabsTrigger>
          <TabsTrigger value="COMPLETED">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="h-6 bg-slate-200 rounded w-48" />
                            <div className="h-8 bg-slate-200 rounded w-24" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-12 bg-slate-200 rounded" />
                            <div className="h-12 bg-slate-200 rounded" />
                          </div>
                          <div className="h-16 bg-slate-200 rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking: any) => {
                  const config = statusConfig[booking.status];
                  return (
                    <Card key={booking.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg text-slate-800">
                                {booking.device?.name || '未知设备'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={config.variant as any}>{config.label}</Badge>
                                {booking.isNightBooking && (
                                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                                    🌙 夜间预约
                                  </Badge>
                                )}
                                {booking.compensation && (
                                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                                    🎫 有补偿
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {(booking.status === 'PENDING_MENTOR' ||
                              booking.status === 'PENDING_ADMIN' ||
                              booking.status === 'APPROVED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                取消
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                              <div>
                                <div className="text-sm text-slate-500">预约时间</div>
                                <div className="text-slate-700">{formatDateTime(booking.startTime)}</div>
                                <div className="text-slate-700">至 {formatDateTime(booking.endTime)}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                              <div>
                                <div className="text-sm text-slate-500">课题项目</div>
                                <div className="text-slate-700">{booking.project?.name || '未知项目'}</div>
                                <div className="text-sm text-slate-500">
                                  编号: {booking.project?.projectNumber || '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="text-sm text-slate-500">预约用途</div>
                            <div className="text-slate-700 mt-1">{booking.purpose}</div>
                          </div>

                          {booking.cancelledReason && (
                            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                              <div className="flex items-center gap-2 text-red-600 font-medium">
                                <AlertCircle className="w-4 h-4" />
                                取消原因
                              </div>
                              <div className="text-red-700 mt-1">{booking.cancelledReason}</div>
                            </div>
                          )}

                          {booking.rejectedReason && (
                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                              <div className="flex items-center gap-2 text-amber-600 font-medium">
                                <AlertCircle className="w-4 h-4" />
                                驳回原因
                              </div>
                              <div className="text-amber-700 mt-1">{booking.rejectedReason}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="text-slate-400 text-lg mt-4">暂无预约记录</div>
                  <p className="text-slate-500 mt-2">点击"新建预约"开始预约设备</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">日历视图</CardTitle>
                  <CardDescription>本月预约概览</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="font-medium">
                        {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
                      </span>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                        <div key={day} className="text-slate-500 font-medium py-2">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => {
                        const day = i - 5;
                        const hasBooking = filteredBookings.some((b: any) => {
                          const bookingDay = new Date(b.startTime).getDate();
                          return bookingDay === day;
                        });
                        const isToday = day === new Date().getDate();
                        return (
                          <div
                            key={i}
                            className={`py-2 rounded-md text-sm cursor-pointer transition-colors ${
                              day < 1 || day > 30
                                ? 'text-slate-300'
                                : isToday
                                ? 'bg-primary-100 text-primary-700 font-semibold'
                                : hasBooking
                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {day >= 1 && day <= 30 ? day : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">快速统计</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">总预约数</span>
                    <span className="font-semibold">{stats.total} 次</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">待审批</span>
                    <span className="font-semibold text-amber-600">{stats.pending} 个</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">已批准</span>
                    <span className="font-semibold text-green-600">{stats.approved} 次</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">已完成</span>
                    <span className="font-semibold text-slate-700">{stats.completed} 次</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取消预约</DialogTitle>
            <DialogDescription>
              请填写取消原因，该原因将被记录
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="font-medium text-slate-800">
                  {selectedBooking.device?.name}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {formatDateTime(selectedBooking.startTime)} -{' '}
                  {formatDateTime(selectedBooking.endTime)}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700">取消原因</label>
              <Input
                className="mt-1"
                placeholder="请输入取消原因..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              放弃
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!cancelReason.trim() || cancelBooking.isLoading}
            >
              {cancelBooking.isLoading ? '取消中...' : '确认取消'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
