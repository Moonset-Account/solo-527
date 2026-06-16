'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/components/providers/trpc-provider';
import { ArrowLeft, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { RISK_LEVELS, DEPARTMENTS } from '@/lib/constants';

export default function NewRiskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checklistId = searchParams.get('checklistId');

  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    responsibleDept: 'IT',
    riskLevel: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
  });

  const { data: legalUsers } = trpc.user.getLegalUsers.useQuery();
  const { data: checklist } = trpc.checklist.get.useQuery(
    { id: checklistId || '' },
    { enabled: !!checklistId }
  );

  useEffect(() => {
    if (checklist) {
      setFormData((prev) => ({
        ...prev,
        title: `${checklist.title} - 合规风险`,
        responsibleDept: checklist.department,
      }));
    }
  }, [checklist]);

  const createMutation = trpc.risk.create.useMutation({
    onSuccess: (data) => {
      toast.success('风险创建成功');
      utils.risk.list.invalidate();
      router.push(`/risks/${data.id}`);
    },
    onError: () => {
      toast.error('创建失败');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      checklistId: checklistId || undefined,
      riskLevel: formData.riskLevel as any,
      responsibleDept: formData.responsibleDept as any,
      assigneeId: formData.assigneeId || undefined,
      dueDate: formData.dueDate || undefined,
    });
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
            <h1 className="text-2xl font-bold text-slate-900">新建风险</h1>
            <p className="text-slate-500">创建新的合规风险项</p>
          </div>
        </div>

        {checklist && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">关联清单：</span>
                {checklist.title}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">风险信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">风险名称 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="输入风险名称"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">风险描述 *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="详细描述风险内容"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="riskLevel">风险等级</Label>
                  <Select
                    id="riskLevel"
                    value={formData.riskLevel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        riskLevel: e.target.value,
                      }))
                    }
                  >
                    {RISK_LEVELS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="responsibleDept">责任部门 *</Label>
                  <Select
                    id="responsibleDept"
                    value={formData.responsibleDept}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        responsibleDept: e.target.value,
                      }))
                    }
                    required
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigneeId">负责人</Label>
                  <Select
                    id="assigneeId"
                    value={formData.assigneeId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigneeId: e.target.value,
                      }))
                    }
                  >
                    <option value="">请选择</option>
                    {legalUsers?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dueDate">整改到期日</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
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
                <Button type="submit" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? '创建中...' : '创建风险'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
