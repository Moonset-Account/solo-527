'use client';

import { useEffect, useState } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  Eye,
  Edit,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Car,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { mockRepairs, mockRepairLogs } from '@/lib/mockData';
import { formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

const priorityMap: Record<string, { label: string; variant: string }> = {
  high: { label: '高', variant: 'danger' },
  normal: { label: '中', variant: 'warning' },
  low: { label: '低', variant: 'success' },
};

export default function RepairsPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentPageTitle('返修追踪');
  }, [setCurrentPageTitle]);

  const filteredRepairs = mockRepairs.filter((repair) => {
    if (activeTab !== 'all' && repair.status !== activeTab) return false;
    if (searchQuery && !repair.reason.includes(searchQuery)) return false;
    return true;
  });

  const statusTabs = [
    { value: 'all', label: '全部', count: mockRepairs.length },
    { value: 'pending', label: '待处理', count: mockRepairs.filter((r) => r.status === 'pending').length },
    { value: 'in_progress', label: '处理中', count: mockRepairs.filter((r) => r.status === 'in_progress').length },
    { value: 'completed', label: '已完成', count: mockRepairs.filter((r) => r.status === 'completed').length },
    { value: 'cancelled', label: '已取消', count: mockRepairs.filter((r) => r.status === 'cancelled').length },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">待处理返修</p>
                <p className="text-2xl font-bold text-amber-600 font-display">
                  {mockRepairs.filter((r) => r.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">处理中</p>
                <p className="text-2xl font-bold text-primary-600 font-display">
                  {mockRepairs.filter((r) => r.status === 'in_progress').length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">本月返修率</p>
                <p className="text-2xl font-bold text-success-600 font-display">
                  4.0%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success-50 text-success-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">平均处理时长</p>
                <p className="text-2xl font-bold text-dark-900 font-display">
                  1.5<span className="text-sm font-normal ml-1">天</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <RefreshCw className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">返修工单列表</CardTitle>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="搜索返修原因..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-dark-400" />}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建返修单
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  {tab.label}
                  <Badge variant="secondary" size="sm">{tab.count}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {statusTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>返修单号</TableHead>
                      <TableHead>原工单</TableHead>
                      <TableHead>车辆信息</TableHead>
                      <TableHead>返修原因</TableHead>
                      <TableHead>优先级</TableHead>
                      <TableHead>负责技师</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepairs.map((repair) => (
                      <TableRow key={repair.id}>
                        <TableCell>
                          <span className="font-mono font-medium text-dark-900 text-sm">
                            {repair.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-dark-500 text-sm">
                            {repair.appointment_id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-dark-400" />
                            <div>
                              <div className="text-sm font-medium">{repair.appointment?.car_plate || '-'}</div>
                              <div className="text-xs text-dark-500">{repair.appointment?.car_model || ''}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm" title={repair.reason}>
                            {repair.reason}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={priorityMap[repair.priority]?.variant as any || 'default'}
                            size="sm"
                          >
                            {priorityMap[repair.priority]?.label || repair.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {repair.technician?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(repair.status)} size="sm">
                            {getStatusLabel(repair.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-dark-500 text-sm">
                          {formatDateTime(repair.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
