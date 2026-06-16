'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { trpc } from '@/components/providers/trpc-provider';
import { ArrowLeft, Bell } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function NewAlertPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const riskId = searchParams.get('riskId');

  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    type: 'PERMISSION_ESCALATION',
    title: '',
    description: '',
    assigneeId: '',
  });

  const { data: proBonoLawyers } = trpc.user.getProBonoLawyers.useQuery();
  const { data: risk } = trpc.risk.get.useQuery(
    { id: riskId || '' },
    { enabled: !!riskId } as any
  );

  useEffect(() => {
    if (risk) {
      setFormData((prev) => ({
        ...prev,
        title: `${risk.title} - 越权提醒`,
      }));
    }
  }, [risk]);

  const createMutation = trpc.alert.create.useMutation({
    onSuccess: (data) => {
      toast.success('提醒已发送');
      utils.alert.list.invalidate();
      router.push(`/alerts/${data.id}`);
    },
    onError: () => {
      toast.error('发送失败');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      type: formData.type as any,
      riskId: riskId || undefined,
      assigneeId: formData.assigneeId || undefined,
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PERMISSION_ESCALATION':
        return '权限越权';
      case 'UNAUTHORIZED_ACCESS':
        return '未授权访问';
      case 'DATA_BREACH':
        return '数据泄露';
      case 'POLICY_VIOLATION':
        return '策略违规';
      default:
        return type;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">发送越权提醒</h1>
            <p className="text-slate-500">向公益律师发送越权提醒</p>
          </div>
        </div>

        {risk && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800">
                <span className="font-medium">关联风险：</span>
                {risk.title}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                发送提醒后，风险状态将更新为“已升级”
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">提醒信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="type">提醒类型 *</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={(e: any) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                  >
                    <option value="PERMISSION_ESCALATION">权限越权</option>
                    <option value="UNAUTHORIZED_ACCESS">未授权访问</option>
                    <option value="DATA_BREACH">数据泄露</option>
                    <option value="POLICY_VIOLATION">策略违规</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigneeId">指派给（公益律师）</Label>
                  <Select
                    id="assigneeId"
                    value={formData.assigneeId}
                    onChange={(e: any) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigneeId: e.target.value,
                      }))
                    }
                  >
                    <option value="">自动分配</option>
                    {proBonoLawyers?.map((lawyer) => (
                      <option key={lawyer.id} value={lawyer.id}>
                        {lawyer.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="title">标题 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: any) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="输入提醒标题"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">详细描述 *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: any) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="详细描述越权情况，包括涉及的权限、用户、数据范围等"
                    rows={6}
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-2">提醒类型说明</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white rounded">
                    <span className="font-medium text-purple-600">权限越权：</span>
                    <span className="text-slate-600">
                      用户获得超出其职责范围的访问权限
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded">
                    <span className="font-medium text-red-600">未授权访问：</span>
                    <span className="text-slate-600">
                      未授权用户尝试访问敏感数据
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded">
                    <span className="font-medium text-red-600">数据泄露：</span>
                    <span className="text-slate-600">
                      敏感数据可能已被泄露或滥用
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded">
                    <span className="font-medium text-amber-600">策略违规：</span>
                    <span className="text-slate-600">
                      违反数据处理或安全策略
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending} variant="warning">
                  <Bell className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? '发送中...' : '发送提醒'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
