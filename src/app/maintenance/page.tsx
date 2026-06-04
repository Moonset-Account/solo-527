'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, MapPin, User, CheckCircle, Plus, Eye, Calendar, Users, Wrench, Search } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: 'warning' | 'default' | 'success'; icon: typeof AlertTriangle }> = {
  REPORTED: { label: '已上报', variant: 'warning', icon: AlertTriangle },
  IN_PROGRESS: { label: '维修中', variant: 'default', icon: Clock },
  RESOLVED: { label: '已解决', variant: 'success', icon: CheckCircle },
};

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState('active');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveTargetId, setResolveTargetId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const [reportForm, setReportForm] = useState({
    deviceId: '',
    description: '',
    startTime: '',
    estimatedEndTime: '',
  });
  const [deviceSearch, setDeviceSearch] = useState('');
  const [showDeviceList, setShowDeviceList] = useState(false);

  const { data: allRecords, isLoading, refetch } = trpc.maintenance.getAll.useQuery(
    {},
    { refetchOnWindowFocus: false }
  );

  const { data: devices } = trpc.device.getAll.useQuery(
    { limit: 100 },
    { refetchOnWindowFocus: false }
  );

  const { data: impactData, isLoading: impactLoading } = trpc.maintenance.getImpact.useQuery(
    { id: selectedMaintenanceId! },
    { enabled: !!selectedMaintenanceId, refetchOnWindowFocus: false }
  );

  const reportMutation = trpc.maintenance.report.useMutation({
    onSuccess: () => {
      refetch();
      setReportDialogOpen(false);
      setReportForm({ deviceId: '', description: '', startTime: '', estimatedEndTime: '' });
    },
  });

  const resolveMutation = trpc.maintenance.resolve.useMutation({
    onSuccess: () => {
      refetch();
      setResolveDialogOpen(false);
      setResolveTargetId(null);
      setResolveNotes('');
    },
  });

  const filteredRecords = allRecords?.filter((record) => {
    if (activeTab === 'active') return ['REPORTED', 'IN_PROGRESS'].includes(record.status);
    if (activeTab === 'resolved') return record.status === 'RESOLVED';
    return true;
  }) || [];

  const activeCount = allRecords?.filter((r) => r.status === 'REPORTED').length ?? 0;
  const inProgressCount = allRecords?.filter((r) => r.status === 'IN_PROGRESS').length ?? 0;
  const totalAffectedBookings = allRecords?.reduce((sum, r) => sum + r._count.affectedBookings, 0) ?? 0;

  const filteredDevices = devices?.filter(
    (d: any) =>
      d.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.model?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.location?.toLowerCase().includes(deviceSearch.toLowerCase())
  ) || [];

  const selectedDevice = devices?.find((d: any) => d.id === reportForm.deviceId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500">加载维护记录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">故障与维护</h1>
          <p className="text-slate-500 mt-1">管理设备故障上报和维护记录</p>
        </div>
        <Button onClick={() => setReportDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          上报故障
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 text-sm">待处理故障</p>
                <p className="text-3xl font-bold text-amber-800 mt-1">{activeCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm">维修中设备</p>
                <p className="text-3xl font-bold text-blue-800 mt-1">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm">受影响预约</p>
                <p className="text-3xl font-bold text-green-800 mt-1">{totalAffectedBookings}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            进行中 ({activeCount + inProgressCount})
          </TabsTrigger>
          <TabsTrigger value="resolved">已解决</TabsTrigger>
          <TabsTrigger value="all">全部记录</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const config = statusConfig[record.status];
              if (!config) return null;
              const StatusIcon = config.icon;
              return (
                <Card key={record.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg text-slate-800">{record.device.name}</h3>
                          <Badge variant={config.variant} className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {record.device.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">{record.device.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">上报人: {record.reporter.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg mb-3">
                          <div className="text-sm text-slate-500">故障描述</div>
                          <div className="text-slate-700 mt-1">{record.description}</div>
                        </div>

                        {record.status !== 'RESOLVED' && record.estimatedEndTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-600">
                              预计完成: {format(new Date(record.estimatedEndTime), 'yyyy-MM-dd HH:mm')}
                            </span>
                          </div>
                        )}

                        {record.resolutionNotes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="text-sm text-green-600 font-medium">解决说明</div>
                            <div className="text-green-700 mt-1">{record.resolutionNotes}</div>
                          </div>
                        )}

                        {record._count.affectedBookings > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>影响 {record._count.affectedBookings} 个预约</span>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMaintenanceId(record.id);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看影响
                        </Button>
                        {record.status !== 'RESOLVED' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              setResolveTargetId(record.id);
                              setResolveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            标记完成
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto" />
                <div className="text-slate-400 text-lg mt-4">暂无维护记录</div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>维护影响范围</DialogTitle>
            <DialogDescription>
              查看此故障影响的预约和用户
            </DialogDescription>
          </DialogHeader>
          {impactLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : impactData ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">{impactData.maintenance.device.name}</h4>
                <p className="text-slate-600">{impactData.maintenance.description}</p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">受影响的预约 ({impactData.affectedBookingCount}个)</span>
                </div>
                {impactData.maintenance.affectedBookings.length > 0 ? (
                  <div className="space-y-2">
                    {impactData.maintenance.affectedBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{booking.user.name}</Badge>
                          <span className="text-sm text-slate-500">
                            {booking.project?.name || '未知课题'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {format(new Date(booking.startTime), 'MM-dd HH:mm')} ~ {format(new Date(booking.endTime), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">暂无受影响的预约</p>
                )}
              </div>
              {impactData.affectedUsers.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-sm">受影响用户</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {impactData.affectedUsers.map((user: any) => (
                        <Badge key={user.id} variant="outline">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>上报设备故障</DialogTitle>
            <DialogDescription>
              填写故障信息，系统将自动通知受影响用户并取消相关预约
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <label className="text-sm font-medium text-slate-700">选择设备</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="搜索设备名称、型号或位置..."
                  value={selectedDevice ? selectedDevice.name : deviceSearch}
                  onChange={(e) => {
                    setDeviceSearch(e.target.value);
                    setReportForm((prev) => ({ ...prev, deviceId: '' }));
                    setShowDeviceList(true);
                  }}
                  onFocus={() => setShowDeviceList(true)}
                />
              </div>
              {showDeviceList && !reportForm.deviceId && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredDevices.length > 0 ? (
                    filteredDevices.map((device: any) => (
                      <button
                        key={device.id}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"
                        onClick={() => {
                          setReportForm((prev) => ({ ...prev, deviceId: device.id }));
                          setDeviceSearch('');
                          setShowDeviceList(false);
                        }}
                      >
                        <span className="text-sm">{device.name}</span>
                        <span className="text-xs text-slate-400">{device.location}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400">未找到匹配设备</div>
                  )}
                </div>
              )}
              {selectedDevice && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md flex items-center justify-between">
                  <span className="text-sm text-blue-700">{selectedDevice.name} - {selectedDevice.location}</span>
                  <button
                    className="text-blue-400 hover:text-blue-600 text-xs"
                    onClick={() => setReportForm((prev) => ({ ...prev, deviceId: '' }))}
                  >
                    更换
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">故障描述</label>
              <Textarea
                className="mt-1"
                rows={4}
                placeholder="请详细描述故障现象（至少10个字符）..."
                value={reportForm.description}
                onChange={(e) => setReportForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">故障开始时间</label>
              <Input
                type="datetime-local"
                className="mt-1"
                value={reportForm.startTime}
                onChange={(e) => setReportForm((prev) => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">预计完成时间（可选）</label>
              <Input
                type="datetime-local"
                className="mt-1"
                value={reportForm.estimatedEndTime}
                onChange={(e) => setReportForm((prev) => ({ ...prev, estimatedEndTime: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                取消
              </Button>
              <Button
                disabled={!reportForm.deviceId || reportForm.description.length < 10 || !reportForm.startTime || reportMutation.isLoading}
                onClick={() => {
                  reportMutation.mutate({
                    deviceId: reportForm.deviceId,
                    description: reportForm.description,
                    startTime: new Date(reportForm.startTime),
                    estimatedEndTime: reportForm.estimatedEndTime ? new Date(reportForm.estimatedEndTime) : undefined,
                  });
                }}
              >
                {reportMutation.isLoading ? '提交中...' : '提交'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>标记维护完成</DialogTitle>
            <DialogDescription>
              设备将恢复为可用状态，受影响用户将收到通知
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">解决说明</label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder="请描述维修结果（至少5个字符）..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                取消
              </Button>
              <Button
                variant="success"
                disabled={resolveNotes.length < 5 || resolveMutation.isLoading}
                onClick={() => {
                  if (resolveTargetId) {
                    resolveMutation.mutate({
                      id: resolveTargetId,
                      resolutionNotes: resolveNotes,
                    });
                  }
                }}
              >
                {resolveMutation.isLoading ? '处理中...' : '确认完成'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
