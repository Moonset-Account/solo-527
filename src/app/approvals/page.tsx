'use client';

import { useState } from 'react';
import {
  Check,
  X,
  User,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  GraduationCap,
  Shield,
} from 'lucide-react';
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

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('mentor');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  const { data: mentorApprovals, isLoading: mentorLoading, refetch: refetchMentor } =
    trpc.booking.getForMentorApproval.useQuery({}, {
      refetchOnWindowFocus: false,
    });

  const { data: adminApprovals, isLoading: adminLoading, refetch: refetchAdmin } =
    trpc.booking.getForAdminApproval.useQuery({}, {
      refetchOnWindowFocus: false,
    });

  const approveByMentor = trpc.booking.approveByMentor.useMutation({
    onSuccess: () => {
      refetchMentor();
      closeDialogs();
    },
  });

  const approveByAdmin = trpc.booking.approveByAdmin.useMutation({
    onSuccess: () => {
      refetchAdmin();
      closeDialogs();
    },
  });

  const closeDialogs = () => {
    setRejectDialogOpen(false);
    setApproveDialogOpen(false);
    setRejectReason('');
    setSelectedBooking(null);
  };

  const handleApprove = () => {
    if (!selectedBooking) return;

    if (activeTab === 'mentor') {
      approveByMentor.mutate({
        bookingId: selectedBooking.id,
        approved: true,
      });
    } else {
      approveByAdmin.mutate({
        bookingId: selectedBooking.id,
        approved: true,
        nightAuthorized: selectedBooking.isNightBooking,
      });
    }
  };

  const handleReject = () => {
    if (!selectedBooking || !rejectReason.trim()) return;

    if (activeTab === 'mentor') {
      approveByMentor.mutate({
        bookingId: selectedBooking.id,
        approved: false,
        reason: rejectReason,
      });
    } else {
      approveByAdmin.mutate({
        bookingId: selectedBooking.id,
        approved: false,
        nightAuthorized: false,
        reason: rejectReason,
      });
    }
  };

  const openRejectDialog = (booking: any) => {
    setSelectedBooking(booking);
    setActionType('reject');
    setRejectDialogOpen(true);
  };

  const openApproveDialog = (booking: any) => {
    setSelectedBooking(booking);
    setActionType('approve');
    setApproveDialogOpen(true);
  };

  const isLoading = activeTab === 'mentor' ? mentorLoading : adminLoading;
  const bookings = activeTab === 'mentor' ? mentorApprovals : adminApprovals;

  const renderBookingCard = (booking: any, isAdmin: boolean = false) => (
    <Card key={booking.id} className={`overflow-hidden ${isAdmin && booking.isNightBooking ? 'border-l-4 border-l-amber-400' : ''}`}>
      <CardContent className="p-6">
        {isAdmin && booking.isNightBooking && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-amber-800">夜间预约提醒</div>
              <div className="text-sm text-amber-700">
                该预约时段在20:00-08:00，需要特殊授权
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="font-semibold text-slate-800 text-lg">
                {booking.user?.name || '未知用户'}
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                <GraduationCap className="w-3 h-3 mr-1" />
                {booking.user?.studentId || '-'}
              </Badge>
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              {booking.user?.email || ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-slate-500">预约设备</div>
              <div className="text-slate-700 font-medium">
                {booking.device?.name || '未知设备'}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-slate-500">预约时间</div>
              <div className="text-slate-700">{formatDateTime(booking.startTime)}</div>
              <div className="text-slate-700">至 {formatDateTime(booking.endTime)}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Shield className="w-4 h-4" />
            课题项目信息
          </div>
          <div className="font-medium text-slate-800">{booking.project?.name}</div>
          <div className="text-sm text-slate-500 mt-1">
            课题编号: <span className="text-slate-700 font-mono">{booking.project?.projectNumber || '-'}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-slate-500 mb-1">预约用途</div>
          <div className="text-slate-700 p-3 bg-slate-50 rounded-lg">{booking.purpose}</div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button className="flex-1" onClick={() => openApproveDialog(booking)}>
            <Check className="w-4 h-4 mr-2" />
            {isAdmin
              ? booking.isNightBooking
                ? '批准并授权夜间使用'
                : '批准'
              : '通过'}
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => openRejectDialog(booking)}
          >
            <X className="w-4 h-4 mr-2" />
            驳回
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">审批中心</h1>
        <p className="text-slate-500 mt-1">审批学生的设备预约申请</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm">待导师确认</p>
                <p className="text-3xl font-bold text-blue-800 mt-1">{mentorApprovals?.length || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm">待管理员审核</p>
                <p className="text-3xl font-bold text-purple-800 mt-1">{adminApprovals?.length || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mentor">导师审批 ({mentorApprovals?.length || 0})</TabsTrigger>
          <TabsTrigger value="admin">管理员审核 ({adminApprovals?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="mentor" className="mt-6">
          <div className="space-y-4">
            {isLoading ? (
              [1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-slate-200 rounded w-48" />
                          <div className="h-4 bg-slate-200 rounded w-32" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-16 bg-slate-200 rounded" />
                        <div className="h-16 bg-slate-200 rounded" />
                      </div>
                      <div className="h-20 bg-slate-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : bookings?.length ? (
              bookings.map((booking: any) => renderBookingCard(booking, false))
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg">暂无待审批的预约</div>
                <p className="text-slate-500 mt-2">所有申请都已处理完毕</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <div className="space-y-4">
            {isLoading ? (
              [1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-slate-200 rounded w-48" />
                          <div className="h-4 bg-slate-200 rounded w-32" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-16 bg-slate-200 rounded" />
                        <div className="h-16 bg-slate-200 rounded" />
                      </div>
                      <div className="h-20 bg-slate-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : bookings?.length ? (
              bookings.map((booking: any) => renderBookingCard(booking, true))
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg">暂无待审核的预约</div>
                <p className="text-slate-500 mt-2">所有申请都已处理完毕</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认通过</DialogTitle>
            <DialogDescription>
              确认通过此预约申请？
              {selectedBooking?.isNightBooking && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="w-4 h-4" />
                    此为夜间预约，通过将同时授权夜间使用权限
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">申请人</span>
                <span className="font-medium">{selectedBooking.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">设备</span>
                <span className="font-medium">{selectedBooking.device?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">时间</span>
                <span className="font-medium">
                  {formatDateTime(selectedBooking.startTime)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              取消
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveByMentor.isLoading || approveByAdmin.isLoading}
            >
              {(approveByMentor.isLoading || approveByAdmin.isLoading) ? '处理中...' : '确认通过'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回预约申请</DialogTitle>
            <DialogDescription>
              请填写驳回原因，该原因将通知给学生
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
              <label className="text-sm font-medium text-slate-700">驳回原因</label>
              <Input
                className="mt-1"
                placeholder="请输入驳回原因..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || approveByMentor.isLoading || approveByAdmin.isLoading}
            >
              {(approveByMentor.isLoading || approveByAdmin.isLoading) ? '处理中...' : '确认驳回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
