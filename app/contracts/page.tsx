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
  FileText,
  Plus,
  Search,
  ChevronRight,
  GitBranch,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRelative, getRiskLabel, getRiskColor } from '@/lib/utils';

export default function ContractsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = trpc.contract.list.useQuery({
    limit: 50,
    status: statusFilter,
  });

  const filteredItems = data?.items?.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">草稿</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">审核中</Badge>;
      case 'ACTIVE':
        return <Badge variant="success">生效中</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline">已归档</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">合同管理</h1>
            <p className="text-slate-500">管理合同版本、审查意见，关联风险闭环</p>
          </div>
          <Button onClick={() => router.push('/contracts/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新建合同
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索合同..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value || undefined)}
                className="w-40"
              >
                <option value="">全部状态</option>
                <option value="DRAFT">草稿</option>
                <option value="UNDER_REVIEW">审核中</option>
                <option value="ACTIVE">生效中</option>
                <option value="ARCHIVED">已归档</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItems?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">暂无合同</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/contracts/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  创建第一个合同
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>合同名称</TableHead>
                    <TableHead>版本</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>关联风险</TableHead>
                    <TableHead>最新审查</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/contracts/${item.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-slate-400" />
                          {item.version}
                        </span>
                      </TableCell>
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
                        {item.reviews?.[0] ? (
                          <div>
                            <p className="text-sm">{item.reviews[0].reviewer?.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatRelative(item.reviews[0].createdAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatRelative(item.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/contracts/${item.id}`}>
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
