'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/components/providers/trpc-provider';
import {
  Bell,
  AlertTriangle,
  Search,
  ChevronRight,
  User,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  formatRelative,
  getRiskLabel,
  getRiskColor,
} from '@/lib/utils';

export default function AlertsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const { data, isLoading } = trpc.alert.list.useQuery({
    limit: 50,
    status: statusFilter as any,
    type: typeFilter as any,
  });

  const { data: currentUser } = trpc.user.me.useQuery();
  const isLegal = currentUser?.role === 'LEGAL' || currentUser?.role === 'ADMIN';

  const filteredItems = data?.items?.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="danger">待处理</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge variant="info">已确认</Badge>;
      case 'INVESTIGATING':
        return <Badge variant="warning">调查中</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">已解决</Badge>;
      case 'CLOSED':
        return <Badge variant="success">已关闭</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PERMISSION_ESCALATION':
        return <Badge variant="purple">权限越权</Badge>;
      case 'UNAUTHORIZED_ACCESS':
        return <Badge variant="danger">未授权访问</Badge>;
      case 'DATA_BREACH':
        return <Badge variant="danger">数据泄露</Badge>;
      case 'POLICY_VIOLATION':
        return <Badge variant="warning">策略违规</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">越权提醒</h1>
            <p className="text-slate-500">
              {currentUser?.role === 'PRO_BONO_LAWYER'
                ? '处理分配给您的权限越权提醒'
                : '管理和跟踪所有越权提醒'}
            </p>
          </div>
          {isLegal && (
            <Button onClick={() => router.push('/alerts/new')}>
              <Bell className="mr-2 h-4 w-4" />
              发送提醒
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索提醒..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={statusFilter || ''}
                  onChange={(e: any) => setStatusFilter(e.target.value || undefined)}
                  className="w-40"
                >
                  <option value="">全部状态</option>
                  <option value="OPEN">待处理</option>
                  <option value="ACKNOWLEDGED">已确认</option>
                  <option value="INVESTIGATING">调查中</option>
                  <option value="RESOLVED">已解决</option>
                  <option value="CLOSED">已关闭</option>
                </Select>
                <Select
                  value={typeFilter || ''}
                  onChange={(e: any) => setTypeFilter(e.target.value || undefined)}
                  className="w-40"
                >
                  <option value="">全部类型</option>
                  <option value="PERMISSION_ESCALATION">权限越权</option>
                  <option value="UNAUTHORIZED_ACCESS">未授权访问</option>
                  <option value="DATA_BREACH">数据泄露</option>
                  <option value="POLICY_VIOLATION">策略违规</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItems?.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">暂无越权提醒</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>提醒标题</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>关联风险</TableHead>
                    <TableHead>报告人</TableHead>
                    <TableHead>指派人</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems?.map((item) => (
                    <TableRow
                      key={item.id}
                      className={item.status === 'CLOSED' ? 'opacity-60' : ''}
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/alerts/${item.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>{getTypeBadge(item.type)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {item.risk ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getRiskColor(item.risk.riskLevel)}
                              variant="outline"
                            >
                              {getRiskLabel(item.risk.riskLevel)}
                            </Badge>
                            <span className="text-sm text-slate-600">
                              {item.risk.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          {item.reporter?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          {item.assignee?.name || '未分配'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatRelative(item.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/alerts/${item.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
