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
  FileCheck,
  Plus,
  Search,
  Filter,
  ChevronRight,
  MoreVertical,
  Trash2,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import {
  formatRelative,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils';
import { CHECKLIST_CATEGORIES, RISK_STATUSES, DEPARTMENTS } from '@/lib/constants';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ChecklistsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, refetch } = trpc.checklist.list.useQuery({
    limit: 50,
    status: statusFilter as any,
    category: categoryFilter as any,
    department: departmentFilter as any,
  });

  const utils = trpc.useUtils();

  const filteredItems = data?.items?.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个检查清单吗？')) {
      try {
        await utils.checklist.delete.mutateAsync({ id });
        toast.success('删除成功');
        refetch();
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const handleSubmit = async (id: string) => {
    if (confirm('确定要提交这个检查清单吗？提交后将无法修改。')) {
      try {
        await utils.checklist.submit.mutateAsync({ id });
        toast.success('提交成功，等待法务审核');
        refetch();
      } catch (error) {
        toast.error('提交失败');
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">检查清单</h1>
            <p className="text-slate-500">管理和填写合规检查清单</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新建清单
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索清单..."
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
                  value={categoryFilter || ''}
                  onChange={(e) => setCategoryFilter(e.target.value || undefined)}
                  className="w-40"
                >
                  <option value="">全部类别</option>
                  {CHECKLIST_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={departmentFilter || ''}
                  onChange={(e) => setDepartmentFilter(e.target.value || undefined)}
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
                <FileCheck className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">暂无检查清单</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  创建第一个清单
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交人</TableHead>
                    <TableHead>风险数</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>

                </TableHeader>
                <TableBody>
                  {filteredItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/checklists/${item.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {
                          CHECKLIST_CATEGORIES.find(
                            (c) => c.value === item.category
                          )?.label
                        }
                      </TableCell>
                      <TableCell>
                        {
                          DEPARTMENTS.find((d) => d.value === item.department)
                            ?.label
                        }
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(item.status)}
                          variant="outline"
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.submitter?.name || '-'}</TableCell>
                      <TableCell>{item._count?.risks || 0}</TableCell>
                      <TableCell>{formatRelative(item.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleSubmit(item.id)}
                            >
                              <Send className="mr-1 h-3 w-3" />
                              提交
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <Link href={`/checklists/${item.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {showCreateModal && (
        <CreateChecklistModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </AppLayout>
  );
}

function CreateChecklistModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('DATA_PRIVACY');
  const [department, setDepartment] = useState('IT');
  const [description, setDescription] = useState('');

  const createMutation = trpc.checklist.create.useMutation({
    onSuccess: () => {
      toast.success('创建成功');
      onSuccess();
    },
    onError: () => {
      toast.error('创建失败');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      category: category as any,
      department: department as any,
      description: description || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">新建检查清单</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              标题
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入清单标题"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              类别
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CHECKLIST_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              部门
            </label>
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              描述
            </label>
            <textarea
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选描述"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? '创建中...' : '创建'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
