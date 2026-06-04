'use client';

import { useState } from 'react';
import { Calendar, Clock, User, FileText, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const mockBookings = [
  {
    id: '1',
    device: '场发射扫描电子显微镜',
    deviceId: '1',
    project: '纳米材料表面形貌研究',
    projectNumber: '2024KJ001',
    startTime: '2024-06-05 09:00',
    endTime: '2024-06-05 12:00',
    purpose: '观察纳米颗粒的尺寸和分布情况',
    status: 'APPROVED',
    isNightBooking: false,
  },
  {
    id: '2',
    device: 'X射线衍射仪',
    deviceId: '2',
    project: '催化剂晶体结构分析',
    projectNumber: '2024KJ002',
    startTime: '2024-06-06 14:00',
    endTime: '2024-06-06 17:00',
    purpose: 'XRD物相定性分析',
    status: 'PENDING_ADMIN',
    isNightBooking: false,
  },
  {
    id: '3',
    device: '400MHz核磁共振仪',
    deviceId: '3',
    project: '有机化合物结构表征',
    projectNumber: '2024KJ003',
    startTime: '2024-06-07 20:00',
    endTime: '2024-06-08 00:00',
    purpose: 'NMR波谱测试',
    status: 'PENDING_MENTOR',
    isNightBooking: true,
  },
  {
    id: '4',
    device: '高效液相色谱仪',
    deviceId: '4',
    project: '药物含量测定',
    projectNumber: '2024KJ004',
    startTime: '2024-06-03 10:00',
    endTime: '2024-06-03 12:00',
    purpose: 'HPLC定量分析',
    status: 'COMPLETED',
    isNightBooking: false,
  },
  {
    id: '5',
    device: '激光共聚焦显微镜',
    deviceId: '6',
    project: '细胞成像研究',
    projectNumber: '2024KJ005',
    startTime: '2024-06-04 09:00',
    endTime: '2024-06-04 11:00',
    purpose: '活细胞实时成像',
    status: 'CANCELLED',
    cancelledReason: '设备临时维护',
    isNightBooking: false,
  },
];

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

  const filteredBookings = mockBookings.filter((booking) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return booking.status.startsWith('PENDING');
    if (activeTab === 'approved') return booking.status === 'APPROVED';
    if (activeTab === 'history') return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status);
    return true;
  });

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
          <TabsTrigger value="pending">待审批</TabsTrigger>
          <TabsTrigger value="approved">已批准</TabsTrigger>
          <TabsTrigger value="history">历史记录</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {filteredBookings.map((booking) => {
                const config = statusConfig[booking.status];
                return (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-800">{booking.device}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={config.variant as any}>{config.label}</Badge>
                              {booking.isNightBooking && (
                                <Badge variant="outline" className="border-amber-300 text-amber-700">
                                  🌙 夜间预约
                                </Badge>
                              )}
                            </div>
                          </div>
                          {booking.status.startsWith('PENDING') && (
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
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
                              <div className="text-slate-700">{booking.startTime}</div>
                              <div className="text-slate-700">至 {booking.endTime}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                              <div className="text-sm text-slate-500">课题项目</div>
                              <div className="text-slate-700">{booking.project}</div>
                              <div className="text-sm text-slate-500">编号: {booking.projectNumber}</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="text-sm text-slate-500">预约用途</div>
                          <div className="text-slate-700 mt-1">{booking.purpose}</div>
                        </div>

                        {booking.cancelledReason && (
                          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                            <div className="text-sm text-red-600 font-medium">取消原因</div>
                            <div className="text-red-700 mt-1">{booking.cancelledReason}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredBookings.length === 0 && (
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
                      <span className="font-medium">2024年6月</span>
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
                        const hasBooking = [4, 5, 6, 7, 10, 12, 15, 18, 20, 22, 25, 28].includes(day);
                        const isToday = day === 4;
                        return (
                          <div
                            key={i}
                            className={`py-2 rounded-md text-sm ${
                              day < 1 || day > 30
                                ? 'text-slate-300'
                                : isToday
                                ? 'bg-primary-100 text-primary-700 font-semibold'
                                : hasBooking
                                ? 'bg-blue-50 text-blue-700'
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
                    <span className="text-slate-500">本月预约</span>
                    <span className="font-semibold">12 次</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">待审批</span>
                    <span className="font-semibold text-amber-600">2 个</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">已完成</span>
                    <span className="font-semibold text-green-600">8 次</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">使用时长</span>
                    <span className="font-semibold">42 小时</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
