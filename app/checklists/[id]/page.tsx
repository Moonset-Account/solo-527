'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/components/providers/trpc-provider';
import {
  ArrowLeft,
  FileCheck,
  Flag,
  Send,
  Plus,
  AlertTriangle,
  Clock,
  User,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  getRiskLabel,
  getRiskColor,
} from '@/lib/utils';
import { CHECKLIST_CATEGORIES, DEPARTMENTS } from '@/lib/constants';
import { toast } from 'sonner';

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: checklist, isLoading } = trpc.checklist.get.useQuery(
    { id: params.id as string },
    { enabled: !!params.id }
  );

  const { data: currentUser } = trpc.user.me.useQuery();

  const [answerValues, setAnswerValues] = useState<Record<string, string>>({});
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});

  const handleAnswerChange = (itemId: string, value: string) => {
    setAnswerValues((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleNoteChange = (itemId: string, value: string) => {
    setNoteValues((prev) => ({ ...prev, [itemId]: value }));
  };

  const saveItem = async (itemId: string) => {
    try {
      await utils.checklist.updateItem.mutateAsync({
        itemId,
        answer: answerValues[itemId],
        notes: noteValues[itemId],
      });
      utils.checklist.get.invalidate({ id: params.id as string });
      toast.success('保存成功');
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const toggleFlag = async (itemId: string, currentFlag: boolean) => {
    try {
      await utils.checklist.updateItem.mutateAsync({
        itemId,
        isFlagged: !currentFlag,
      });
      utils.checklist.get.invalidate({ id: params.id as string });
      toast.success(currentFlag ? '已取消标记' : '已标记');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    if (confirm('确定要提交这个检查清单吗？提交后将无法修改。')) {
      try {
        await utils.checklist.submit.mutateAsync({ id: params.id as string });
        utils.checklist.get.invalidate({ id: params.id as string });
        toast.success('提交成功，等待法务审核');
      } catch (error) {
        toast.error('提交失败');
      }
    }
  };

  const isEditable =
    checklist?.status === 'DRAFT' &&
    (currentUser?.id === checklist?.submitterId ||
      currentUser?.role === 'ADMIN');

  const isLegal = currentUser?.role === 'LEGAL' || currentUser?.role === 'ADMIN';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!checklist) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">检查清单不存在</p>
          <Link href="/checklists" className="text-blue-600 hover:underline mt-2 inline-block">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  const categoryLabel = CHECKLIST_CATEGORIES.find(
    (c) => c.value === checklist.category
  )?.label;

  const departmentLabel = DEPARTMENTS.find(
    (d) => d.value === checklist.department
  )?.label;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {checklist.title}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <FileCheck className="h-4 w-4" />
                  {categoryLabel}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {checklist.submitter?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(checklist.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(checklist.status)} variant="outline">
              {getStatusLabel(checklist.status)}
            </Badge>
            {isEditable && (
              <Button onClick={handleSubmit}>
                <Send className="mr-2 h-4 w-4" />
                提交审核
              </Button>
            )}
          </div>
        </div>

        {checklist.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-slate-600">{checklist.description}</p>
            </CardContent>
          </Card>
        )}

        {checklist.risks?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">关联风险</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.risks.map((risk) => (
                  <Link
                    key={risk.id}
                    href={`/risks/${risk.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">{risk.title}</p>
                        <p className="text-xs text-slate-500">
                          负责人: {risk.assignee?.name || '未分配'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getRiskColor(risk.riskLevel)} variant="outline">
                      {getRiskLabel(risk.riskLevel)}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">检查项 ({checklist.items?.length || 0})</CardTitle>
            {isLegal && checklist.status !== 'DRAFT' && (
              <Link href={`/risks/new?checklistId=${checklist.id}`}>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  关联风险
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {checklist.items?.map((item, index) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {item.question}
                        </h4>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFlag(item.id, item.isFlagged)}
                      className={item.isFlagged ? 'text-red-500' : 'text-slate-400'}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 ml-11">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        回答
                      </label>
                      {isEditable ? (
                        <div className="flex gap-2">
                          <Input
                            value={answerValues[item.id] ?? item.answer ?? ''}
                            onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                            placeholder="输入您的回答"
                          />
                          <Button onClick={() => saveItem(item.id)}>保存</Button>
                        </div>
                      ) : (
                        <p className="text-slate-600 bg-slate-50 p-3 rounded-md">
                          {item.answer || '未填写'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        备注
                      </label>
                      {isEditable ? (
                        <div className="space-y-2">
                          <Textarea
                            value={noteValues[item.id] ?? item.notes ?? ''}
                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                            placeholder="添加备注说明"
                            rows={2}
                          />
                        </div>
                      ) : (
                        <p className="text-slate-600 bg-slate-50 p-3 rounded-md">
                          {item.notes || '无备注'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {item.isFlagged && (
                        <Badge variant="danger" className="text-xs">
                          已标记
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        最后更新: {formatDateTime(item.updatedAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
