'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/components/providers/trpc-provider';
import { User, Shield, Building2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { DEPARTMENTS, USER_ROLES } from '@/lib/constants';
import { getRoleLabel } from '@/lib/utils';

export default function SettingsPage() {
  const utils = trpc.useUtils();

  const { data: currentUser, isLoading } = trpc.user.me.useQuery();
  const { data: userStats } = trpc.user.list.useQuery(
    { limit: 10 },
    { enabled: currentUser?.role === 'ADMIN' }
  );

  const [name, setName] = useState(currentUser?.name || '');
  const [department, setDepartment] = useState(currentUser?.department || '');

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('个人信息已更新');
      utils.user.me.invalidate();
    },
  });

  const updateDepartmentMutation = trpc.user.updateDepartment.useMutation({
    onSuccess: () => {
      toast.success('部门已更新');
      utils.user.me.invalidate();
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ name: name || undefined });
  };

  const handleSaveDepartment = () => {
    if (currentUser && department) {
      updateDepartmentMutation.mutate({
        id: currentUser.id,
        department: department as any,
      });
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
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">设置</h1>
          <p className="text-slate-500">管理您的账号和偏好设置</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              个人信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>邮箱</Label>
                <div className="mt-1 flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{currentUser?.email}</span>
                </div>
              </div>
              <div>
                <Label>角色</Label>
                <div className="mt-1 flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <Badge variant="outline">
                    {getRoleLabel(currentUser?.role || '')}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="name">显示名称</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入您的名称"
                  className="flex-1"
                />
                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isLoading}>
                  {updateProfileMutation.isLoading ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="department">所属部门</Label>
              <div className="mt-1 flex gap-2">
                <Select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="flex-1"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
                <Button
                  onClick={handleSaveDepartment}
                  disabled={updateDepartmentMutation.isLoading}
                >
                  {updateDepartmentMutation.isLoading ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentUser?.role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                角色说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {USER_ROLES.map((role) => (
                  <div
                    key={role.value}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
                  >
                    <div className="mt-0.5">
                      <Badge variant="outline">{role.label}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              系统信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium">应用名称：</span>合规清单台
            </p>
            <p>
              <span className="font-medium">版本：</span>1.0.0
            </p>
            <p>
              <span className="font-medium">描述：</span>
              企业级数据合规风险看板，实现风险识别、评估、整改全流程闭环管理
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
