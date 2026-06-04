'use client';

import { useState } from 'react';
import { Check, X, User, FileText, Calendar, Clock, AlertCircle } from 'lucide-react';
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

const mockMentorApprovals = [
  {
    id: '1',
    student: '张三',
    studentId: '2021001',
    department: '材料科学与工程',
    device: '场发射扫描电子显微镜',
    project: '纳米材料表面形貌研究',
    projectNumber: '2024KJ001',
    startTime: '2024-06-05 09:00',
    endTime: '2024-06-05 12:00',
    purpose: '观察纳米颗粒的尺寸和分布情况，研究不同制备工艺对颗粒形貌的影响',
    certificateStatus: 'verified',
    safetyTraining: true,
  },
  {
    id: '2',
    student: '李四',
    studentId: '2021002',
    department: '化学化工学院',
    device: 'X射线衍射仪',
    project: '催化剂晶体结构分析',
    projectNumber: '2024KJ002',
    startTime: '2024-06-06 14:00',
    endTime: '2024-06-06 17:00',
    purpose: 'XRD物相定性分析，确定催化剂的晶体结构和相组成',
    certificateStatus: 'pending',
    safetyTraining: true,
  },
];

const mockAdminApprovals = [
  {
    id: '3',
    student: '王五',
    studentId: '2021003',
    department: '物理学院',
    device: '400MHz核磁共振仪',
    project: '有机化合物结构表征',
    projectNumber: '2024KJ003',
    startTime: '2024-06-07 20:00',
    endTime: '2024-06-08 00:00',
    purpose: 'NMR波谱测试，确定有机化合物的分子结构',
    certificateStatus: 'verified',
    safetyTraining: true,
    isNightBooking: true,
  },
];

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('mentor');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">审批中心</h1>
        <p className="text-slate-500 mt-1">审批学生的设备预约申请</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mentor">
        </TabsTrigger>
        <TabsTrigger value="admin">管理员审核 ({mockAdminApprovals.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="mentor" className="mt-6">
        <div className="space-y-4">
          {mockMentorApprovals.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{booking.student}</div>
                        <div className="text-sm text-slate-500">
                          {booking.studentId} · {booking.department}
                        </div>
                      </div>
                      <Badge variant={booking.certificateStatus === 'verified' ? 'success' : 'warning'} className="ml-4">
                        {booking.certificateStatus === 'verified' ? '证书已验证' : '证书待验证'}
                      </Badge>
                      {booking.safetyTraining && (
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          安全培训已完成
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-slate-500">预约设备</div>
                          <div className="text-slate-700 font-medium">{booking.device}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-slate-500">预约时间</div>
                          <div className="text-slate-700">{booking.startTime}</div>
                          <div className="text-slate-700">至 {booking.endTime}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-sm text-slate-500">
                        课题项目: <span className="text-slate-700">{booking.project}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        课题编号: <span className="text-slate-700">{booking.projectNumber}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm text-slate-500">预约用途:</div>
                      <div className="text-slate-700 mt-1">{booking.purpose}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                  <Button
                    className="flex-1"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    通过
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setRejectDialogOpen(true);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    驳回
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {mockMentorApprovals.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg">暂无待审批的预约</div>
              <p className="text-slate-500 mt-2">所有申请都已处理完毕</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="admin" className="mt-6">
        <div className="space-y-4">
          {mockAdminApprovals.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-l-4 border-l-amber-400">
              <CardContent className="p-6">
                {booking.isNightBooking && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-medium text-amber-800">夜间预约提醒</div>
                      <div className="text-sm text-amber-700">
                        该预约时段在20:00-00:00，需要特殊授权</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{booking.student}</div>
                    <div className="text-sm text-slate-500">
                      {booking.studentId} · {booking.department}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-500">预约设备</div>
                      <div className="text-slate-700 font-medium">{booking.device}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-500">预约时间</div>
                      <div className="text-slate-700">{booking.startTime}</div>
                      <div className="text-slate-700">至 {booking.endTime}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                  <Button
                    className="flex-1"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    批准并授权夜间使用
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setRejectDialogOpen(true);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    驳回
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>

    <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>驳回预约申请</DialogTitle>
          <DialogDescription>
            请填写驳回原因，该原因将通知给学生
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">驳回原因</label>
            <textarea
              className="w-full mt-2 p-3 border border-slate-200 rounded-lg"
              rows={4}
              placeholder="请输入驳回原因..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive">
              确认驳回
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
