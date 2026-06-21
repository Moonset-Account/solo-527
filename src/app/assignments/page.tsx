"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerTitle, DrawerHeader, DrawerSection, DrawerFooter } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatDate,
  formatCNY,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
} from "@/lib/utils";
import { AssignmentStatus, AssignmentType, Priority } from "@prisma/client";
import {
  Building2,
  User,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  ClipboardList,
  History,
  Phone,
  CheckCircle2,
  XCircle,
  UserPlus,
  MessageSquare,
  Star,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function AssignmentsPage() {
  const [page, setPage] = useState(1);
  const [selectedStatuses, setSelectedStatuses] = useState<AssignmentStatus[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<AssignmentType[]>([]);
  const [tenantName, setTenantName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [handleNote, setHandleNote] = useState("");
  const [satisfactionScore, setSatisfactionScore] = useState(0);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");

  const pageSize = 10;

  const { data, isLoading, refetch } = api.assignment.list.useQuery({
    page,
    pageSize,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    tenantName: tenantName || undefined,
    propertyName: propertyName || undefined,
    mineOnly,
  });

  const { data: assignmentDetail } = api.assignment.getById.useQuery(
    { id: selectedAssignmentId! },
    { enabled: !!selectedAssignmentId }
  );

  const { data: users } = api.user.list.useQuery(undefined, {
    enabled: assignModalOpen,
  });

  const utils = api.useUtils();

  const completeMutation = api.assignment.complete.useMutation({
    onSuccess: () => {
      utils.assignment.list.invalidate();
      utils.assignment.getById.invalidate({ id: selectedAssignmentId! });
      utils.assignment.getMyTodo.invalidate();
      utils.dashboard.getTodoList.invalidate();
      setCompleteModalOpen(false);
      setHandleNote("");
      setSatisfactionScore(0);
    },
  });

  const assignMutation = api.assignment.assign.useMutation({
    onSuccess: () => {
      utils.assignment.list.invalidate();
      utils.assignment.getById.invalidate({ id: selectedAssignmentId! });
      setAssignModalOpen(false);
      setSelectedAssigneeId("");
    },
  });

  const updateStatusMutation = api.assignment.updateStatus.useMutation({
    onSuccess: () => {
      utils.assignment.list.invalidate();
      utils.assignment.getById.invalidate({ id: selectedAssignmentId! });
    },
  });

  const handleViewDetail = (id: string) => {
    setSelectedAssignmentId(id);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedAssignmentId(null), 300);
  };

  const handleComplete = () => {
    if (!selectedAssignmentId || !handleNote) return;
    completeMutation.mutate({
      id: selectedAssignmentId,
      handleNote,
      satisfactionScore: satisfactionScore > 0 ? satisfactionScore : undefined,
    });
  };

  const handleAssign = () => {
    if (!selectedAssignmentId || !selectedAssigneeId) return;
    assignMutation.mutate({
      id: selectedAssignmentId,
      assigneeId: selectedAssigneeId,
    });
  };

  const toggleStatus = (status: AssignmentStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
    setPage(1);
  };

  const toggleType = (type: AssignmentType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
    setPage(1);
  };

  const statusFilters = useMemo(
    () => [
      { value: AssignmentStatus.PENDING, label: "待处理", color: "bg-amber-100 text-amber-700" },
      { value: AssignmentStatus.IN_PROGRESS, label: "处理中", color: "bg-blue-100 text-blue-700" },
      { value: AssignmentStatus.COMPLETED, label: "已完成", color: "bg-emerald-100 text-emerald-700" },
      { value: AssignmentStatus.CANCELLED, label: "已取消", color: "bg-slate-100 text-slate-700" },
    ],
    []
  );

  const typeFilters = useMemo(
    () => [
      { value: AssignmentType.COLLECTION, label: "催收", icon: DollarSign },
      { value: AssignmentType.REPAIR, label: "维修", icon: Wrench },
      { value: AssignmentType.VISIT, label: "回访", icon: User },
      { value: AssignmentType.COMPLAINT, label: "投诉", icon: AlertTriangle },
    ],
    []
  );

  const frontlineUsers = useMemo(() => {
    return users?.filter((u) => u.role === "FRONTLINE") || [];
  }, [users]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">派工管理</h1>
            <p className="mt-1 text-sm text-slate-500">
              管理工单派发、跟踪处理进度、进行租客回访
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 space-y-4">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((s) => (
                <button
                  key={s.value}
                  onClick={() => toggleStatus(s.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedStatuses.includes(s.value)
                      ? `${s.color} ring-2 ring-offset-1 ring-current`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <div className="w-px h-6 bg-slate-300 mx-2 self-center" />
              {typeFilters.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    selectedTypes.includes(t.value)
                      ? "bg-blue-100 text-blue-700 ring-2 ring-offset-1 ring-blue-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <t.icon className="h-3 w-3" />
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setMineOnly(!mineOnly);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mineOnly
                    ? "bg-purple-100 text-purple-700 ring-2 ring-offset-1 ring-purple-500"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <User className="h-3 w-3 inline mr-1" />
                仅显示我的
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索租客名称..."
                  value={tenantName}
                  onChange={(e) => {
                    setTenantName(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索房源名称..."
                  value={propertyName}
                  onChange={(e) => {
                    setPropertyName(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStatuses([]);
                  setSelectedTypes([]);
                  setTenantName("");
                  setPropertyName("");
                  setMineOnly(false);
                  setPage(1);
                  refetch();
                }}
              >
                重置筛选
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    工单信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    房源/租客
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    负责人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      加载中...
                    </td>
                  </tr>
                ) : data?.assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      暂无工单数据
                    </td>
                  </tr>
                ) : (
                  data?.assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => handleViewDetail(assignment.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              assignment.type === AssignmentType.COLLECTION
                                ? "bg-amber-100"
                                : assignment.type === AssignmentType.REPAIR
                                ? "bg-orange-100"
                                : assignment.type === AssignmentType.VISIT
                                ? "bg-blue-100"
                                : "bg-red-100"
                            }`}
                          >
                            {assignment.type === AssignmentType.COLLECTION ? (
                              <DollarSign className="h-5 w-5 text-amber-600" />
                            ) : assignment.type === AssignmentType.REPAIR ? (
                              <Wrench className="h-5 w-5 text-orange-600" />
                            ) : assignment.type === AssignmentType.VISIT ? (
                              <User className="h-5 w-5 text-blue-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {assignment.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {getStatusLabel(assignment.type)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">
                            {assignment.propertyName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {assignment.tenantName} · {assignment.tenantPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="text-sm text-slate-900">
                            {assignment.assignee.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {formatDate(assignment.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {getStatusLabel(assignment.priority)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusLabel(assignment.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="end">
                              <div className="space-y-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetail(assignment.id);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  查看详情
                                </button>
                                {assignment.status === AssignmentStatus.PENDING && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateStatusMutation.mutate({
                                        id: assignment.id,
                                        status: AssignmentStatus.IN_PROGRESS,
                                        reason: "开始处理",
                                      });
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2 text-blue-600"
                                  >
                                    <Clock className="h-4 w-4" />
                                    开始处理
                                  </button>
                                )}
                                {assignment.status === AssignmentStatus.IN_PROGRESS && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAssignmentId(assignment.id);
                                      setCompleteModalOpen(true);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2 text-emerald-600"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    办结工单
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAssignmentId(assignment.id);
                                    setAssignModalOpen(true);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2 text-purple-600"
                                >
                                  <UserPlus className="h-4 w-4" />
                                  重新派工
                                </button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                共 {data.total} 条，第 {page} / {data.totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => !open && handleCloseDrawer()}
      >
        <DrawerContent className="max-w-3xl">
        {assignmentDetail && (
          <>
            <DrawerHeader>
              <DrawerTitle>工单详情</DrawerTitle>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {assignmentDetail.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {getStatusLabel(assignmentDetail.type)} · {assignmentDetail.lease.property.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(assignmentDetail.priority)}>
                    {getStatusLabel(assignmentDetail.priority)}
                  </Badge>
                  <Badge className={getStatusColor(assignmentDetail.status)}>
                    {getStatusLabel(assignmentDetail.status)}
                  </Badge>
                </div>
              </div>
            </DrawerHeader>

            <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <DrawerSection title="工单信息">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">负责人</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {assignmentDetail.assignee.name}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">创建时间</span>
                    <div className="text-sm font-medium text-slate-900 mt-1">
                      {formatDate(assignmentDetail.createdAt)}
                    </div>
                  </div>
                  {assignmentDetail.completedAt && (
                    <div>
                      <span className="text-sm text-slate-500">完成时间</span>
                      <div className="text-sm font-medium text-slate-900 mt-1">
                        {formatDate(assignmentDetail.completedAt)}
                      </div>
                    </div>
                  )}
                  {assignmentDetail.satisfactionScore && (
                    <div>
                      <span className="text-sm text-slate-500">满意度评分</span>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= assignmentDetail.satisfactionScore!
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {assignmentDetail.description && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-500">工单描述</span>
                    <p className="text-sm text-slate-700 mt-1">
                      {assignmentDetail.description}
                    </p>
                  </div>
                )}
              </DrawerSection>

              <DrawerSection title="租客信息">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="font-medium text-slate-900">
                        {assignmentDetail.lease.tenant.name}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Phone className="h-3 w-3" />
                          {assignmentDetail.lease.tenant.phone}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-1" />
                      联系租客
                    </Button>
                  </div>
                </div>
              </DrawerSection>

              {assignmentDetail.bill && (
                <DrawerSection title="关联账单">
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-amber-600" />
                        <div>
                          <div className="font-medium text-slate-900">
                            {assignmentDetail.bill.billNo}
                          </div>
                          <div className="text-xs text-slate-500">
                            {assignmentDetail.bill.period}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {formatCNY(assignmentDetail.bill.amount.toNumber())}
                        </div>
                        <Badge className={getStatusColor(assignmentDetail.bill.status)}>
                          {getStatusLabel(assignmentDetail.bill.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DrawerSection>
              )}

              {assignmentDetail.handleNote && (
                <DrawerSection title="处理说明">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-700">
                          {assignmentDetail.handleNote}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          处理时间: {formatDate(assignmentDetail.completedAt!)}
                        </p>
                      </div>
                    </div>
                  </div>
                </DrawerSection>
              )}

              <DrawerSection title="变更历史">
                <div className="space-y-2">
                  {assignmentDetail.changeHistory.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">暂无变更记录</div>
                  ) : (
                    assignmentDetail.changeHistory.slice(0, 5).map((change) => (
                      <div
                        key={change.id}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        <History className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium text-slate-900">
                              {change.operatorName}
                            </span>
                            <span className="text-slate-500"> 修改了 </span>
                            <span className="font-medium text-blue-600">
                              {change.fieldName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {change.oldValue && (
                              <span className="text-red-500 line-through mr-2">
                                {change.oldValue}
                              </span>
                            )}
                            <span className="text-emerald-600">→ {change.newValue}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {formatDate(change.changedAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DrawerSection>
            </div>

            <DrawerFooter>
              {assignmentDetail.status === AssignmentStatus.IN_PROGRESS && (
                <Button
                  onClick={() => {
                    setCompleteModalOpen(true);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  办结工单
                </Button>
              )}
              {assignmentDetail.type === AssignmentType.VISIT && assignmentDetail.status === AssignmentStatus.COMPLETED && !assignmentDetail.satisfactionScore && (
                <Button variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  租客回访
                </Button>
              )}
            </DrawerFooter>
          </>
        )}
        </DrawerContent>
      </Drawer>

      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setCompleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-scale-in">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    办结工单
                  </h3>
                  <p className="text-sm text-slate-500">
                    请填写处理说明，长租公寓运营办结时必须留下处理说明
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  处理说明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={handleNote}
                  onChange={(e) => setHandleNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="请详细描述处理过程和结果..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  租客满意度评分
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSatisfactionScore(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          s <= satisfactionScore
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300 hover:text-yellow-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-slate-500 ml-2">
                    {satisfactionScore > 0 ? `${satisfactionScore} 分` : "未评分"}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCompleteModalOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending || !handleNote}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                确认办结
              </Button>
            </div>
          </div>
        </div>
      )}

      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setAssignModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-scale-in">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    重新派工
                  </h3>
                  <p className="text-sm text-slate-500">
                    选择新的负责人处理此工单
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选择负责人
              </label>
              <select
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">请选择负责人</option>
                {frontlineUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending || !selectedAssigneeId}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                确认派工
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function DollarSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function Wrench(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
