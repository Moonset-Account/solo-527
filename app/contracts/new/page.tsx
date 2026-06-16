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
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function NewContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const riskId = searchParams.get('riskId');
  const checklistId = searchParams.get('checklistId');

  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    version: '1.0',
    title: '',
    content: '',
    status: 'DRAFT',
  });

  const { data: risk } = trpc.risk.get.useQuery(
    { id: riskId || '' },
    { enabled: !!riskId }
  );

  const { data: checklist } = trpc.checklist.get.useQuery(
    { id: checklistId || '' },
    { enabled: !!checklistId }
  );

  useEffect(() => {
    if (risk) {
      setFormData((prev) => ({
        ...prev,
        title: `${risk.title} - 合同`,
      }));
    }
  }, [risk]);

  const createMutation = trpc.contract.create.useMutation({
    onSuccess: (data) => {
      toast.success('合同创建成功');
      utils.contract.list.invalidate();
      router.push(`/contracts/${data.id}`);
    },
    onError: () => {
      toast.error('创建失败');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      riskId: riskId || undefined,
      checklistId: checklistId || undefined,
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
            <h1 className="text-2xl font-bold text-slate-900">新建合同</h1>
            <p className="text-slate-500">创建新合同版本并关联风险闭环</p>
          </div>
        </div>

        {(risk || checklist) && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              {risk && (
                <p className="text-sm text-blue-800">
                  <span className="font-medium">关联风险：</span>
                  {risk.title}
                </p>
              )}
              {checklist && (
                <p className="text-sm text-blue-800 mt-1">
                  <span className="font-medium">关联清单：</span>
                  {checklist.title}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">合同信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">合同名称 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="输入合同名称"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="version">版本号 *</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, version: e.target.value }))
                    }
                    placeholder="例如：1.0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="DRAFT">草稿</option>
                    <option value="UNDER_REVIEW">审核中</option>
                    <option value="ACTIVE">生效中</option>
                    <option value="ARCHIVED">已归档</option>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="content">合同内容</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="粘贴或输入合同内容"
                    rows={12}
                    className="font-mono text-sm"
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
                  {createMutation.isLoading ? '创建中...' : '创建合同'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
