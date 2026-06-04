'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Search,
  MapPin,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusConfig: Record<string, { label: string; variant: string }> = {
  AVAILABLE: { label: '可用', variant: 'success' },
  IN_USE: { label: '使用中', variant: 'default' },
  MAINTENANCE: { label: '维护中', variant: 'warning' },
  BROKEN: { label: '故障', variant: 'destructive' },
};

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<any>(null);

  const { data: devices, isLoading: devicesLoading } = trpc.device.getAll.useQuery(
    { limit: 50 },
    { refetchOnWindowFocus: false }
  );

  const { data: projects, isLoading: projectsLoading } = trpc.user.getMyProjects.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const checkConflictInput = selectedDevice && startDate && startTime && endDate && endTime
    ? {
        deviceId: selectedDevice.id,
        startTime: new Date(`${startDate}T${startTime}`),
        endTime: new Date(`${endDate}T${endTime}`),
      }
    : { deviceId: '', startTime: new Date(), endTime: new Date() };

  const checkConflict = trpc.booking.checkConflict.useQuery(checkConflictInput, {
    enabled: !!(selectedDevice && startDate && startTime && endDate && endTime),
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setConflictInfo(data);
    },
  });

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: () => {
      setConfirmDialogOpen(false);
      router.push('/bookings');
    },
  });

  const filteredDevices =
    devices?.filter(
      (d: any) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.model?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const canProceedToStep2 = selectedDevice && selectedDevice.status === 'AVAILABLE';
  const canProceedToStep3 = selectedProject && startDate && startTime && endDate && endTime;
  const canSubmit =
    purpose.length >= 10 &&
    !conflictInfo?.hasConflict &&
    !conflictInfo?.hasMaintenanceConflict;

  const handleSubmit = () => {
    if (canSubmit) {
      createBooking.mutate({
        deviceId: selectedDevice.id,
        projectId: selectedProject.id,
        startTime: new Date(`${startDate}T${startTime}`),
        endTime: new Date(`${endDate}T${endTime}`),
        purpose,
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bookings">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">新建预约</h1>
          <p className="text-slate-500 mt-1">选择设备、时间和课题完成预约申请</p>
        </div>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            1
          </div>
          <div
            className={`w-20 h-1 ${
              step >= 2 ? 'bg-primary-500' : 'bg-slate-200'
            }`}
          />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            2
          </div>
          <div
            className={`w-20 h-1 ${
              step >= 3 ? 'bg-primary-500' : 'bg-slate-200'
            }`}
          />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 3 ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            3
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择设备</CardTitle>
              <CardDescription>选择您要预约的实验室设备</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索设备名称或型号..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {devicesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-slate-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDevices.map((device: any) => {
                    const config = statusConfig[device.status];
                    const isSelected = selectedDevice?.id === device.id;
                    return (
                      <div
                        key={device.id}
                        onClick={() => device.status === 'AVAILABLE' && setSelectedDevice(device)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : device.status === 'AVAILABLE'
                            ? 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                            : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-slate-800">{device.name}</h3>
                            <p className="text-sm text-slate-500">{device.model}</p>
                          </div>
                          <Badge variant={config.variant as any}>{config.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="w-4 h-4" />
                          {device.location}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          已预约 {device._count?.bookings || 0} 次
                        </div>
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-2 text-primary-600 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            已选择
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              disabled={!canProceedToStep2}
              onClick={() => setStep(2)}
            >
              下一步
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>选择课题</CardTitle>
                <CardDescription>选择本次预约关联的研究课题</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectsLoading ? (
                  [1, 2].map((i) => (
                    <div key={i} className="animate-pulse h-20 bg-slate-200 rounded-lg" />
                  ))
                ) : projects?.length ? (
                  projects.map((project: any) => {
                    const isSelected = selectedProject?.id === project.id;
                    return (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-slate-800">{project.name}</h4>
                            <p className="text-sm text-slate-500">编号: {project.projectNumber}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {project._count?.bookings || 0} 次预约 · {project._count?.members || 0} 位成员
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary-500" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-slate-500 mt-2">暂无可用课题</p>
                    <p className="text-slate-400 text-sm">请联系您的导师添加课题</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>选择时间</CardTitle>
                <CardDescription>选择预约的开始和结束时间</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">开始日期</label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">开始时间</label>
                    <Input
                      type="time"
                      className="mt-1"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">结束日期</label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">结束时间</label>
                    <Input
                      type="time"
                      className="mt-1"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {conflictInfo && (
                  <div className="space-y-2 mt-4">
                    {conflictInfo.hasConflict && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="text-sm text-red-700">
                          该时段已被其他预约占用，请选择其他时间
                        </div>
                      </div>
                    )}
                    {conflictInfo.hasMaintenanceConflict && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div className="text-sm text-amber-700">
                          该时段设备处于维护状态，请选择其他时间
                        </div>
                      </div>
                    )}
                    {conflictInfo.isNightBooking && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="text-sm text-blue-700">
                          该预约为夜间时段（20:00-08:00），需要管理员额外授权
                        </div>
                      </div>
                    )}
                    {!conflictInfo.hasConflict && !conflictInfo.hasMaintenanceConflict && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="text-sm text-green-700">
                          该时段可以预约
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              上一步
            </Button>
            <Button disabled={!canProceedToStep3} onClick={() => setStep(3)}>
              下一步
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>确认预约信息</CardTitle>
              <CardDescription>请确认以下预约信息并填写用途说明</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-500 mb-1">预约设备</div>
                    <div className="font-semibold text-slate-800">{selectedDevice?.name}</div>
                    <div className="text-sm text-slate-500 mt-1">{selectedDevice?.model}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-500 mb-1">课题项目</div>
                    <div className="font-semibold text-slate-800">{selectedProject?.name}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      编号: {selectedProject?.projectNumber}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      预约时间
                    </div>
                    <div className="font-semibold text-slate-800">
                      {formatDateTime(new Date(`${startDate}T${startTime}`))}
                    </div>
                    <div className="text-slate-600">
                      至 {formatDateTime(new Date(`${endDate}T${endTime}`))}
                    </div>
                    {conflictInfo?.isNightBooking && (
                      <Badge variant="outline" className="mt-2 border-amber-300 text-amber-700">
                        🌙 夜间预约
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  预约用途 <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full mt-2 p-3 border border-slate-200 rounded-lg min-h-[120px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="请详细描述预约用途、实验内容等信息（至少10个字）..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>{purpose.length}/10</span>
                  {purpose.length < 10 && (
                    <span className="text-red-500">请至少输入10个字</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              上一步
            </Button>
            <Button
              disabled={!canSubmit || createBooking.isLoading}
              onClick={() => setConfirmDialogOpen(true)}
            >
              {createBooking.isLoading ? '提交中...' : '提交预约申请'}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认提交预约</DialogTitle>
            <DialogDescription>
              提交后将发送通知给您的导师进行课题确认
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">设备</span>
                <span className="font-medium">{selectedDevice?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">课题</span>
                <span className="font-medium">{selectedProject?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">时间</span>
                <span className="font-medium">
                  {startDate} {startTime} - {endDate} {endTime}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={createBooking.isLoading}>
              {createBooking.isLoading ? '提交中...' : '确认提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
