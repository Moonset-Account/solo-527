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
  Bell,
  User,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  formatDateTime,
  formatDate,
  getRiskLabel,
  getRiskColor,
  getStatusColor,
} from '@/lib/utils';

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: alert, isLoading } = trpc.alert.get.useQuery(
    { id: params.id as string },
    { enabled: !!params.id }
  );

  const { data: currentUser } = trpc.user.me.useQuery();
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const isProBono =
    currentUser?.role === 'PRO_BONO_LAWYER' || currentUser?.role === 'ADMIN';
  const canEdit =
    isProBono &&
    (alert?.assigneeId === currentUser?.id || currentUser?.role === 'ADMIN');

  const updateStatusMutation = trpc.alert.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('状态已更新');
      utils.alert.get.invalidate({ id: params.id as string });
      utils.alert.list.invalidate();
      utils.risk.list.invalidate();
      setShowResolutionModal(false);
    },
  });

  const assignMutation = trpc.alert.assign.useMutation({
    onSuccess: () => {
      toast.success('已分配');
      utils.alert.get.invalidate({ id: params.id as string });
    },
  });

  const handleStatusUpdate = () => {
    if (!newStatus) {
      toast.error('请选择状态');
      return;
    }
    updateStatusMutation.mutate({
      id: alert!.id,
      status: newStatus as any,
      resolution: resolution || undefined,
    });
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

  if (!alert) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">提醒不存在</p>
          <Link href="/alerts" className="text-blue-600 hover:underline mt-2 inline-block">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{alert.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  报告人: {alert.reporter?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(alert.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">{getTypeLabel(alert.type)}</Badge>
            {getStatusBadge(alert.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">报告人</p>
              <p className="text-lg font-semibold mt-1">{alert.reporter?.name}</p>
              <p className="text-sm text-slate-500">{alert.reporter?.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">指派人</p>
              <p className="text-lg font-semibold mt-1">
                {alert.assignee?.name || '未分配'}
              </p>
              {alert.assignee && (
                <p className="text-sm text-slate-500">{alert.assignee.email}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">处理时间</p>
              {alert.resolvedAt ? (
                <div>
                  <p className="text-lg font-semibold mt-1 text-green-600">
                    {formatDate(alert.resolvedAt)}
                  </p>
                  <p className="text-sm text-slate-500">已处理</p>
                </div>
              ) : (
                <p className="text-lg font-semibold mt-1 text-amber-600">处理中</p>
              )}
            </CardContent>
          </Card>
        </div>

        {alert.risk && (
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <span className="font-medium">关联风险</span>
              </div>
              <Link
                href={`/risks/${alert.risk.id}`}
                className="text-blue-600 hover:underline text-lg"
              >
                {alert.risk.title}
              </Link>
              <div className="flex items-center gap-4 mt-2">
                <Badge className={getRiskColor(alert.risk.riskLevel)} variant="outline">
                  {getRiskLabel(alert.risk.riskLevel)}
                </Badge>
                <Badge className={getStatusColor(alert.risk.status)} variant="outline">
                  {alert.risk.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mt-2">{alert.risk.description}</p>
              {alert.status === 'CLOSED' && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    此提醒已关闭，关联风险已回流至风险闭环看板并标记为已闭环
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">详细描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">{alert.description}</p>
          </CardContent>
        </Card>

        {alert.resolution && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-lg">处理结果</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 whitespace-pre-wrap">{alert.resolution}</p>
              {alert.closedBy && (
                <p className="text-sm text-slate-500 mt-2">
                  处理人: {alert.assignee?.name} · {formatDateTime(alert.resolvedAt)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {canEdit && alert.status !== 'CLOSED' && (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setNewStatus('ACKNOWLEDGED');
                setShowResolutionModal(true);
              }}
            >
              <Clock className="mr-2 h-4 w-4" />
              确认收到
            </Button>
            <Button
              variant="warning"
              onClick={() => {
                setNewStatus('INVESTIGATING');
                setShowResolutionModal(true);
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              开始调查
            </Button>
            <Button
              variant="success"
              onClick={() => {
                setNewStatus('RESOLVED');
                setShowResolutionModal(true);
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              标记已解决
            </Button>
            <Button
              onClick={() => {
                setNewStatus('CLOSED');
                setShowResolutionModal(true);
              }}
            >
              <Bell className="mr-2 h-4 w-4" />
              关闭提醒
            </Button>
          </div>
        )}

        {alert.status === 'CLOSED' && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              此提醒已关闭，处理结果已回流至风险闭环看板
            </p>
          </div>
        )}
      </div>

      {showResolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {newStatus === 'ACKNOWLEDGED' && '确认收到'}
              {newStatus === 'INVESTIGATING' && '开始调查'}
              {newStatus === 'RESOLVED' && '标记已解决'}
              {newStatus === 'CLOSED' && '关闭提醒'}
            </h2>
            <div className="space-y-4">
              {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
                <div>
                  <Label>处理说明 *</Label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="请输入处理结果说明"
                    rows={4}
                    required
                  />
                </div>
              )}
              {newStatus !== 'RESOLVED' && newStatus !== 'CLOSED' && (
                <div>
                  <Label>备注（可选）</Label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="输入备注信息"
                    rows={3}
                  />
                </div>
              )}
              {newStatus === 'CLOSED' && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    关闭提醒后，关联的风险项将自动标记为“已闭环”，并回流到风险闭环看板。
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResolutionModal(false)}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={
                    updateStatusMutation.isLoading ||
                    ((newStatus === 'RESOLVED' || newStatus === 'CLOSED') &&
                      !resolution)
                  }
                >
                  {updateStatusMutation.isLoading ? '处理中...' : '确认'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
