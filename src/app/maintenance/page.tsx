'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, MapPin, User, CheckCircle, Plus, Eye, Calendar, Users } from 'lucide-react';
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

const mockMaintenanceRecords = [
  {
    id: '1',
    device: '400MHz核磁共振仪',
    deviceId: '3',
    location: 'B栋101室',
    reportedBy: '李工程师',
    reportedAt: '2024-06-03 14:30',
    description: '仪器无法正常启动，显示电源故障错误代码',
    status: 'IN_PROGRESS',
    estimatedEnd: '2024-06-06 18:00',
    affectedBookings: 5,
    affectedUsers: ['张三', '李四', '王五'],
  },
  {
    id: '2',
    device: 'X射线衍射仪',
    deviceId: '2',
    location: 'A栋305室',
    reportedBy: '王技术员',
    reportedAt: '2024-06-02 09:15',
    description: '探测器灵敏度下降，需要校准',
    status: 'REPORTED',
    estimatedEnd: '2024-06-05 12:00',
    affectedBookings: 3,
    affectedUsers: ['赵六', '孙七'],
  },
  {
    id: '3',
    device: '场发射扫描电子显微镜',
    deviceId: '1',
    location: 'A栋302室',
    reportedBy: '张工程师',
    reportedAt: '2024-05-28 10:00',
    description: '定期维护保养',
    status: 'RESOLVED',
    actualEnd: '2024-05-30 16:00',
    affectedBookings: 2,
    affectedUsers: ['周八'],
    resolutionNotes: '完成灯丝更换和真空系统维护',
  },
];

const statusConfig: Record<string, { label: string; variant: string; icon: any }> = {
  REPORTED: { label: '已上报', variant: 'warning', icon: AlertTriangle },
  IN_PROGRESS: { label: '维修中', variant: 'default', icon: Clock },
  RESOLVED: { label: '已解决', variant: 'success', icon: CheckCircle },
};

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const filteredRecords = mockMaintenanceRecords.filter((record) => {
    if (activeTab === 'active') return ['REPORTED', 'IN_PROGRESS'].includes(record.status);
    if (activeTab === 'resolved') return record.status === 'RESOLVED';
    return true;
  });

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
                <p className="text-3xl font-bold text-amber-800 mt-1">
                  {mockMaintenanceRecords.filter((r) => r.status === 'REPORTED').length}
                </p>
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
                <p className="text-3xl font-bold text-blue-800 mt-1">
                  {mockMaintenanceRecords.filter((r) => r.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm">受影响预约</p>
                <p className="text-3xl font-bold text-green-800 mt-1">
                  {mockMaintenanceRecords.reduce((sum, r) => sum + r.affectedBookings, 0)}
                </p>
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
            进行中 ({mockMaintenanceRecords.filter((r) => ['REPORTED', 'IN_PROGRESS'].includes(r.status)).length})
          </TabsTrigger>
          <TabsTrigger value="resolved">已解决</TabsTrigger>
          <TabsTrigger value="all">全部记录</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const config = statusConfig[record.status];
              const StatusIcon = config.icon;
              return (
                <Card key={record.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg text-slate-800">{record.device}</h3>
                          <Badge variant={config.variant as any} className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{record.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">上报人: {record.reportedBy}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{record.reportedAt}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg mb-3">
                          <div className="text-sm text-slate-500">故障描述</div>
                          <div className="text-slate-700 mt-1">{record.description}</div>
                        </div>

                        {record.status !== 'RESOLVED' && record.estimatedEnd && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-600">预计完成: {record.estimatedEnd}</span>
                          </div>
                        )}

                        {record.resolutionNotes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="text-sm text-green-600 font-medium">解决说明</div>
                            <div className="text-green-700 mt-1">{record.resolutionNotes}</div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看影响
                        </Button>
                        {record.status === 'IN_PROGRESS' && (
                          <Button size="sm" variant="success">
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
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">{selectedRecord.device}</h4>
                <p className="text-slate-600">{selectedRecord.description}</p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">受影响的预约 ({selectedRecord.affectedBookings}个)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.affectedUsers.map((user: string) => (
                    <Badge key={user} variant="outline">
                      {user}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>上报设备故障</DialogTitle>
            <DialogDescription>
              填写故障信息，系统将自动通知相关人员
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">选择设备</label>
              <Input className="mt-1" placeholder="搜索或选择设备..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">故障描述</label>
              <Textarea
                className="mt-1"
                rows={4}
                placeholder="请详细描述故障现象..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">预计完成时间（可选）</label>
              <Input type="datetime-local" className="mt-1" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                取消
              </Button>
              <Button>提交</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-px bg-slate-200 ${className}`} />;
}

function Textarea({ className, ...props }: any) {
  return (
    <textarea
      className={`w-full min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
