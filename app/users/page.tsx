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
import { Users, Search, Shield, Mail, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { DEPARTMENTS, USER_ROLES } from '@/lib/constants';
import { getRoleLabel } from '@/lib/utils';

export default function UsersPage() {
  const utils = trpc.useUtils();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [deptFilter, setDeptFilter] = useState<string | undefined>();

  const { data, isLoading } = trpc.user.list.useQuery({
    limit: 50,
    role: roleFilter as any,
    department: deptFilter as any,
  });

  const filteredItems = data?.items?.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success('角色已更新');
      utils.user.list.invalidate();
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    if (confirm('确定要更改此用户的角色吗？')) {
      updateRoleMutation.mutate({ id: userId, role: newRole as any });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
          <p className="text-slate-500">管理系统用户和权限</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索用户..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={roleFilter || ''}
                  onChange={(e) => setRoleFilter(e.target.value || undefined)}
                  className="w-40"
                >
                  <option value="">全部角色</option>
                  {USER_ROLES.map((r) => (
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
            {filteredItems?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">暂无用户</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>清单数</TableHead>
                    <TableHead>提交风险</TableHead>
                    <TableHead>负责风险</TableHead>
                    <TableHead>加入时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">
                              {(user.name || user.email[0]).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {user.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Shield className="h-3 w-3 inline mr-1" />
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.department
                          ? DEPARTMENTS.find((d) => d.value === user.department)?.label
                          : '-'}
                      </TableCell>
                      <TableCell>{user._count?.checklists || 0}</TableCell>
                      <TableCell>{user._count?.submittedRisks || 0}</TableCell>
                      <TableCell>{user._count?.assignedRisks || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="w-28 text-sm"
                        >
                          {USER_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </Select>
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
