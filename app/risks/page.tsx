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
  ShieldAlert,
  Plus,
  Search,
  ChevronRight,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  formatRelative,
  getRiskLabel,
  getRiskColor,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils';
import { RISK_LEVELS, RISK_STATUSES, DEPARTMENTS } from '@/lib/constants';
import { isBefore } from 'date-fns';

export default function RisksPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [riskLevelFilter, setRiskLevelFilter] = useState<string | undefined>();
  const [deptFilter, setDeptFilter] = useState<string | undefined>();

  const { data, isLoading } = trpc.risk.list.useQuery({
    limit: 50,
    status: statusFilter as any,
    riskLevel: riskLevelFilter as any,
    responsibleDept: deptFilter as any,
  });

  const filteredItems = data?.items?.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isOverdue = (dueDate: Date | string | null) => {
    if (!dueDate) return false;
    return isBefore(new Date(dueDate), new Date());
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">风险看板</h1>
            <p className="text-slate-500">管理和跟踪合规风险全流程闭环</p>
          </div>
          <Button onClick={() => router.push('/risks/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新建风险
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索风险..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value || undefined)}
                  className="w-40"
                >
                  <option value="">全部状态</option>
                  {RISK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={riskLevelFilter || ''}
                  onChange={(e) => setRiskLevelFilter(e.target.value || undefined)}
                  className="w-40"
                >
                  <option value="">全部等级</option>
                  {RISK_LEVELS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={deptFilter || ''}
                  onChange={(e) => setDeptFilter(e.target.value || undefined)}
                  className="w-40"
                >
                  <option value="">全部部门</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
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
                <ShieldAlert className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">暂无风险项</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/risks/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  创建第一个风险
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>风险名称</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>责任部门</TableHead>
                    <TableHead>负责人</TableHead>
                    <TableHead>到期日</TableHead>
                    <TableHead>证据/意见</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems?.map((item) => (
                    <TableRow key={item.id} className={item.status === 'CLOSED' ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/risks/${item.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(item.riskLevel)} variant="outline">
                          {getRiskLabel(item.riskLevel)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)} variant="outline">
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {DEPARTMENTS.find((d) => d.value === item.responsibleDept)?.label}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          {item.assignee?.name || '未分配'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isOverdue(item.dueDate) && item.status !== 'CLOSED' && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                          <span className={isOverdue(item.dueDate) && item.status !== 'CLOSED' ? 'text-red-600' : ''}>
                            {item.dueDate ? formatRelative(item.dueDate) : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <span className="text-xs text-slate-500">
                            {item._count?.evidences || 0} 证据
                          </span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs text-slate-500">
                            {item._count?.reviewOpinions || 0} 意见
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatRelative(item.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/risks/${item.id}`}>
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
