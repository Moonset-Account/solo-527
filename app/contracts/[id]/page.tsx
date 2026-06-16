'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/components/providers/trpc-provider';
import {
  ArrowLeft,
  FileText,
  GitBranch,
  Calendar,
  User,
  Plus,
  Edit3,
  Trash2,
  Copy,
  MessageSquare,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { formatDateTime, getRiskLabel, getRiskColor } from '@/lib/utils';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: contract, isLoading } = trpc.contract.get.useQuery(
    { id: params.id as string },
    { enabled: !!params.id }
  );

  const { data: currentUser } = trpc.user.me.useQuery();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);

  const isLegal = currentUser?.role === 'LEGAL' || currentUser?.role === 'ADMIN';

  const updateMutation = trpc.contract.update.useMutation({
    onSuccess: () => {
      toast.success('更新成功');
      utils.contract.get.invalidate({ id: params.id as string });
      utils.contract.list.invalidate();
      setShowEditModal(false);
    },
  });

  const addReviewMutation = trpc.contract.addReview.useMutation({
    onSuccess: () => {
      toast.success('审查意见已保存');
      utils.contract.get.invalidate({ id: params.id as string });
      setShowReviewModal(false);
    },
  });

  const newVersionMutation = trpc.contract.createNewVersion.useMutation({
    onSuccess: (data) => {
      toast.success('新版本已创建');
      utils.contract.list.invalidate();
      router.push(`/contracts/${data.id}`);
    },
  });

  const deleteMutation = trpc.contract.delete.useMutation({
    onSuccess: () => {
      toast.success('合同已删除');
      utils.contract.list.invalidate();
      router.push('/contracts');
    },
  });

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!contract) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">合同不存在</p>
          <Link href="/contracts" className="text-blue-600 hover:underline mt-2 inline-block">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{contract.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4" />
                  版本 {contract.version}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(contract.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(contract.status)}
            {isLegal && (
              <>
                <Button variant="outline" onClick={() => setShowEditModal(true)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  编辑
                </Button>
                <Button variant="outline" onClick={() => setShowNewVersionModal(true)}>
                  <Copy className="mr-2 h-4 w-4" />
                  新版本
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('确定要删除这个合同吗？')) {
                      deleteMutation.mutate({ id: contract.id });
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contract.risk && (
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-slate-500">关联风险</span>
                </div>
                <Link
                  href={`/risks/${contract.risk.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {contract.risk.title}
                </Link>
                <div className="mt-2">
                  <Badge className={getRiskColor(contract.risk.riskLevel)} variant="outline">
                    {getRiskLabel(contract.risk.riskLevel)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {contract.checklist && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-slate-500">关联清单</span>
                </div>
                <Link
                  href={`/checklists/${contract.checklist.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {contract.checklist.title}
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-500">审查意见</span>
              </div>
              <p className="text-2xl font-bold">
                {contract.reviews?.length || 0}
              </p>
              {isLegal && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setShowReviewModal(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  添加审查
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">合同内容</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.content ? (
              <pre className="bg-slate-50 p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap font-mono">
                {contract.content}
              </pre>
            ) : (
              <p className="text-slate-500 text-center py-8">暂无合同内容</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">审查历史</CardTitle>
            {isLegal && (
              <Button size="sm" onClick={() => setShowReviewModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                添加审查意见
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {contract.reviews?.length === 0 ? (
              <p className="text-slate-500 text-center py-8">暂无审查意见</p>
            ) : (
              <div className="space-y-4">
                {contract.reviews.map((review) => (
                  <Card key={review.id} className="border-l-4 border-indigo-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{review.reviewer?.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {review.reviewer?.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {review.opinion}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          variant={
                            review.status === 'APPROVED'
                              ? 'success'
                              : review.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {review.status === 'APPROVED'
                            ? '已通过'
                            : review.status === 'REJECTED'
                            ? '已驳回'
                            : '待处理'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showEditModal && (
        <EditContractModal
          contract={contract}
          onClose={() => setShowEditModal(false)}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isLoading}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          contractId={contract.id}
          onClose={() => setShowReviewModal(false)}
          onSubmit={(data) => addReviewMutation.mutate(data)}
          isLoading={addReviewMutation.isLoading}
        />
      )}

      {showNewVersionModal && (
        <NewVersionModal
          contract={contract}
          onClose={() => setShowNewVersionModal(false)}
          onSubmit={(data) => newVersionMutation.mutate(data)}
          isLoading={newVersionMutation.isLoading}
        />
      )}
    </AppLayout>
  );
}

function EditContractModal({
  contract,
  onClose,
  onSubmit,
  isLoading,
}: {
  contract: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    id: contract.id,
    version: contract.version,
    title: contract.title,
    content: contract.content || '',
    status: contract.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">编辑合同</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>合同名称 *</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>版本号 *</Label>
              <Input
                value={formData.version}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, version: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>状态</Label>
              <Select
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
          </div>
          <div>
            <Label>合同内容</Label>
            <Textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewModal({
  contractId,
  onClose,
  onSubmit,
  isLoading,
}: {
  contractId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    opinion: '',
    status: 'PENDING',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ contractId, ...formData });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">合同审查意见</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>审查意见 *</Label>
            <Textarea
              value={formData.opinion}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, opinion: e.target.value }))
              }
              placeholder="请输入审查意见"
              rows={5}
              required
            />
          </div>
          <div>
            <Label>审查结果</Label>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="PENDING">待处理</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已驳回</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存审查'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewVersionModal({
  contract,
  onClose,
  onSubmit,
  isLoading,
}: {
  contract: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    contractId: contract.id,
    newVersion: '',
    content: contract.content || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">创建新版本</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              当前版本: <span className="font-medium">{contract.version}</span>
            </p>
          </div>
          <div>
            <Label>新版本号 *</Label>
            <Input
              value={formData.newVersion}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, newVersion: e.target.value }))
              }
              placeholder="例如：1.1"
              required
            />
          </div>
          <div>
            <Label>合同内容（可编辑）</Label>
            <Textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '创建中...' : '创建新版本'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input(props: any) {
  return (
    <input
      {...props}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
