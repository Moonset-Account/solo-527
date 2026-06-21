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
  getOverdueBadgeStyle,
} from "@/lib/utils";
import {
  AssignmentStatus,
  AssignmentType,
  SettlementStatus,
  ContractStatus,
  BillStatus,
} from "@prisma/client";
import {
  Building2,
  User,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  ClipboardList,
  History,
  Phone,
  CheckCircle2,
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  Home,
  CreditCard,
  FileCheck,
  ListTodo,
  Receipt,
  Handshake,
  Star,
  MessageSquare,
  UserPlus,
  Wrench,
} from "lucide-react";

type TabType = "todo" | "settlement" | "bill" | "contract";

export default function WorkbenchPage() {
  const [activeTab, setActiveTab] = useState<TabType>("todo");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"assignment" | "settlement" | "bill" | "contract" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [handleNote, setHandleNote] = useState("");
  const [satisfactionScore, setSatisfactionScore] = useState(0);

  const pageSize = 8;

  const { data: workbenchData } = api.assignment.getWorkbenchData.useQuery();

  const { data: todoData, refetch: refetchTodo } = api.assignment.list.useQuery(
    {
      page,
      pageSize,
      mineOnly: true,
      status: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
    },
    { enabled: activeTab === "todo" }
  );

  const { data: settlementData, refetch: refetchSettlement } = api.settlement.list.useQuery(
    {
      page,
      pageSize,
      status: [SettlementStatus.PENDING, SettlementStatus.CONFIRMED],
    },
    { enabled: activeTab === "settlement" }
  );

  const { data: billData, refetch: refetchBill } = api.bill.list.useQuery(
    {
      page,
      pageSize,
      status: [BillStatus.UNPAID, BillStatus.PARTIAL, BillStatus.OVERDUE],
    },
    { enabled: activeTab === "bill" }
  );

  const { data: contractData, refetch: refetchContract } = api.contract.list.useQuery(
    {
      page,
      pageSize,
      status: [ContractStatus.DRAFT, ContractStatus.PENDING_SIGN],
    },
    { enabled: activeTab === "contract" }
  );

  const { data: assignmentDetail } = api.assignment.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId && selectedType === "assignment" }
  );

  const { data: settlementDetail } = api.settlement.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId && selectedType === "settlement" }
  );

  const { data: billDetail } = api.bill.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId && selectedType === "bill" }
  );

  const { data: contractDetail } = api.contract.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId && selectedType === "contract" }
  );

  const utils = api.useUtils();

  const completeMutation = api.assignment.complete.useMutation({
    onSuccess: () => {
      utils.assignment.list.invalidate();
      utils.assignment.getMyTodo.invalidate();
      utils.assignment.getWorkbenchData.invalidate();
      utils.dashboard.getTodoList.invalidate();
      setCompleteModalOpen(false);
      setHandleNote("");
      setSatisfactionScore(0);
    },
  });

  const confirmSettlementMutation = api.settlement.confirm.useMutation({
    onSuccess: () => {
      utils.settlement.list.invalidate();
      utils.settlement.getById.invalidate({ id: selectedId! });
    },
  });

  const markSettlementPaidMutation = api.settlement.markPaid.useMutation({
    onSuccess: () => {
      utils.settlement.list.invalidate();
      utils.settlement.getById.invalidate({ id: selectedId! });
    },
  });

  const updateStatusMutation = api.assignment.updateStatus.useMutation({
    onSuccess: () => {
      utils.assignment.list.invalidate();
      utils.assignment.getById.invalidate({ id: selectedId! });
    },
  });

  const payMutation = api.bill.pay.useMutation({
    onSuccess: () => {
      utils.bill.list.invalidate();
      utils.bill.getById.invalidate({ id: selectedId! });
      utils.dashboard.getStats.invalidate();
    },
  });

  const updateContractStatusMutation = api.contract.updateStatus.useMutation({
    onSuccess: () => {
      utils.contract.list.invalidate();
      utils.contract.getById.invalidate({ id: selectedId! });
    },
  });

  const tabs = useMemo(
    () => [
      {
        key: "todo" as TabType,
        label: "我的待办",
        icon: ListTodo,
        count: workbenchData?.pending ?? 0 + workbenchData?.inProgress ?? 0,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        key: "settlement" as TabType,
        label: "业主结算",
        icon: Receipt,
        count: settlementData?.total ?? 0,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
      },
      {
        key: "bill" as TabType,
        label: "租约账单",
        icon: CreditCard,
        count: billData?.total ?? 0,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
      },
      {
        key: "contract" as TabType,
        label: "合同签署",
        icon: FileCheck,
        count: contractData?.total ?? 0,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
    ],
    [workbenchData, settlementData, billData, contractData]
  );

  const handleViewDetail = (id: string, type: typeof selectedType) => {
    setSelectedId(id);
    setSelectedType(type);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedId(null);
      setSelectedType(null);
    }, 300);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setSearchKeyword("");
  };

  const handleComplete = () => {
    if (!selectedId || !handleNote) return;
    completeMutation.mutate({
      id: selectedId,
      handleNote,
      satisfactionScore: satisfactionScore > 0 ? satisfactionScore : undefined,
    });
  };

  const handleQuickPay = (billId: string, amount: number) => {
    payMutation.mutate({
      id: billId,
      amount,
      paymentMethod: "BANK_TRANSFER",
    });
  };

  const currentData = useMemo(() => {
    switch (activeTab) {
      case "todo":
        return todoData;
      case "settlement":
        return settlementData;
      case "bill":
        return billData;
      case "contract":
        return contractData;
      default:
        return null;
    }
  }, [activeTab, todoData, settlementData, billData, contractData]);

  const totalPages = currentData?.totalPages ?? 1;
  const totalItems = currentData?.total ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">一线工作台</h1>
            <p className="mt-1 text-sm text-slate-500">
              集中处理待办工单、业主结算、租约账单和合同签署
            </p>
          </div>
          {workbenchData && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {workbenchData.pending + workbenchData.inProgress}
                </div>
                <div className="text-xs text-slate-500">待处理</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {workbenchData.completedToday}
                </div>
                <div className="text-xs text-slate-500">今日完成</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === tab.key
                      ? `${tab.color} border-current bg-slate-50`
                      : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${tab.bgColor}`}>
                    <tab.icon className={`h-4 w-4 ${tab.color}`} />
                  </div>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge className={tab.bgColor + " " + tab.color}>
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="搜索房源、租客、业主名称..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {activeTab === "todo" &&
              todoData?.assignments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => handleViewDetail(item.id, "assignment")}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        item.type === AssignmentType.COLLECTION
                          ? "bg-amber-100"
                          : item.type === AssignmentType.REPAIR
                          ? "bg-orange-100"
                          : item.type === AssignmentType.VISIT
                          ? "bg-blue-100"
                          : "bg-red-100"
                      }`}
                    >
                      {item.type === AssignmentType.COLLECTION ? (
                        <DollarSign className="h-6 w-6 text-amber-600" />
                      ) : item.type === AssignmentType.REPAIR ? (
                        <Wrench className="h-6 w-6 text-orange-600" />
                      ) : item.type === AssignmentType.VISIT ? (
                        <User className="h-6 w-6 text-blue-600" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 truncate">
                          {item.title}
                        </h3>
                        <Badge className={getPriorityColor(item.priority)}>
                          {getStatusLabel(item.priority)}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {item.propertyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.tenantName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {item.tenantPhone}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === "settlement" &&
              settlementData?.settlements.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => handleViewDetail(item.id, "settlement")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Handshake className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">
                          {item.settlementNo}
                        </h3>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {item.propertyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.ownerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.periodFrom)} - {formatDate(item.periodTo)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {formatCNY(item.ownerAmount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          租金: {formatCNY(item.totalRent)}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === "bill" &&
              billData?.bills.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => handleViewDetail(item.id, "bill")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">
                          {item.billNo}
                        </h3>
                        <span className="text-sm text-slate-500">{item.period}</span>
                        {item.overdueDays > 0 && (
                          <Badge className={getOverdueBadgeStyle(item.overdueDays)}>
                            逾期{item.overdueDays}天
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {item.propertyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.tenantName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          到期日: {formatDate(item.dueDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {formatCNY(item.amount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          已付: {formatCNY(item.paidAmount)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2" align="end">
                              <div className="space-y-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetail(item.id, "bill");
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  查看详情
                                </button>
                                {item.status !== BillStatus.PAID && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickPay(
                                        item.id,
                                        item.amount - item.paidAmount
                                      );
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2 text-emerald-600"
                                  >
                                    <DollarSign className="h-4 w-4" />
                                    快速收款
                                  </button>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === "contract" &&
              contractData?.contracts.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => handleViewDetail(item.id, "contract")}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <FileCheck className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">
                          {item.contractNo}
                        </h3>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {item.propertyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.tenantName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {item.tenantPhone}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-500">
                        创建于 {formatDate(item.createdAt)}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {!currentData ||
              (currentData.total === 0 && (
                <div className="py-12 text-center text-slate-500">
                  暂无数据
                </div>
              ))}
          </div>

          {totalItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                共 {totalItems} 条，第 {page} / {totalPages} 页
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
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
        {selectedType === "assignment" && assignmentDetail && (
          <>
            <DrawerHeader>
              <DrawerTitle className="sr-only">详情</DrawerTitle>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {assignmentDetail.lease.tenant.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {assignmentDetail.lease.tenant.phone}
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      联系租客
                    </Button>
                  </div>
                </div>
              </DrawerSection>

              {assignmentDetail.handleNote && (
                <DrawerSection title="处理说明">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-700">
                          {assignmentDetail.handleNote}
                        </p>
                      </div>
                    </div>
                  </div>
                </DrawerSection>
              )}
            </div>

            <DrawerFooter>
              {assignmentDetail.status === AssignmentStatus.PENDING && (
                <Button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: assignmentDetail.id,
                      status: AssignmentStatus.IN_PROGRESS,
                      reason: "开始处理",
                    })
                  }
                >
                  <Clock className="h-4 w-4 mr-2" />
                  开始处理
                </Button>
              )}
              {assignmentDetail.status === AssignmentStatus.IN_PROGRESS && (
                <Button
                  onClick={() => {
                    setSelectedId(assignmentDetail.id);
                    setCompleteModalOpen(true);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  办结工单
                </Button>
              )}
            </DrawerFooter>
          </>
        )}

        {selectedType === "settlement" && settlementDetail && (
          <>
            <DrawerHeader>
              <DrawerTitle className="sr-only">详情</DrawerTitle>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {settlementDetail.settlementNo}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {formatDate(settlementDetail.periodFrom)} - {formatDate(settlementDetail.periodTo)}
                  </p>
                </div>
                <Badge className={getStatusColor(settlementDetail.status)}>
                  {getStatusLabel(settlementDetail.status)}
                </Badge>
              </div>
            </DrawerHeader>

            <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <DrawerSection title="结算明细">
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">应收租金</span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatCNY(settlementDetail.totalRent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">管理费</span>
                    <span className="text-sm font-medium text-orange-600">
                      - {formatCNY(settlementDetail.managementFee)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">其他扣款</span>
                    <span className="text-sm font-medium text-orange-600">
                      - {formatCNY(settlementDetail.otherDeductions)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">
                      应付业主
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCNY(settlementDetail.ownerAmount)}
                    </span>
                  </div>
                </div>
              </DrawerSection>

              <DrawerSection title="业主信息">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {settlementDetail.lease.owner.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {settlementDetail.lease.owner.phone}
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      联系业主
                    </Button>
                  </div>
                </div>
              </DrawerSection>
            </div>

            <DrawerFooter>
              {settlementDetail.status === SettlementStatus.PENDING && (
                <Button
                  onClick={() =>
                    confirmSettlementMutation.mutate({ id: settlementDetail.id })
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  确认结算
                </Button>
              )}
              {settlementDetail.status === SettlementStatus.CONFIRMED && (
                <Button
                  onClick={() =>
                    markSettlementPaidMutation.mutate({ id: settlementDetail.id })
                  }
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  标记已付款
                </Button>
              )}
            </DrawerFooter>
          </>
        )}

        {selectedType === "bill" && billDetail && (
          <>
            <DrawerHeader>
              <DrawerTitle className="sr-only">详情</DrawerTitle>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {billDetail.billNo}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {billDetail.period} · {billDetail.lease.property.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {billDetail.exception && (
                    <Badge className="bg-red-100 text-red-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      异常
                    </Badge>
                  )}
                  <Badge className={getStatusColor(billDetail.status)}>
                    {getStatusLabel(billDetail.status)}
                  </Badge>
                </div>
              </div>
            </DrawerHeader>

            <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <DrawerSection title="账单信息">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">应收金额</span>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {formatCNY(billDetail.amount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">已收金额</span>
                    <div className="text-lg font-bold text-emerald-600 mt-1">
                      {formatCNY(billDetail.paidAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">待收金额</span>
                    <div className="text-lg font-bold text-orange-600 mt-1">
                      {formatCNY(billDetail.amount - billDetail.paidAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">到期日</span>
                    <div className="text-sm font-medium text-slate-900 mt-1">
                      {formatDate(billDetail.dueDate)}
                    </div>
                  </div>
                </div>
              </DrawerSection>

              <DrawerSection title="租客信息">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {billDetail.lease.tenant.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {billDetail.lease.tenant.phone}
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      联系租客
                    </Button>
                  </div>
                </div>
              </DrawerSection>
            </div>

            <DrawerFooter>
              {billDetail.status !== BillStatus.PAID && (
                <Button
                  onClick={() =>
                    handleQuickPay(
                      billDetail.id,
                      billDetail.amount - billDetail.paidAmount
                    )
                  }
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  登记收款
                </Button>
              )}
            </DrawerFooter>
          </>
        )}

        {selectedType === "contract" && contractDetail && (
          <>
            <DrawerHeader>
              <DrawerTitle className="sr-only">详情</DrawerTitle>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {contractDetail.contractNo}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {contractDetail.lease.property.name}
                  </p>
                </div>
                <Badge className={getStatusColor(contractDetail.status)}>
                  {getStatusLabel(contractDetail.status)}
                </Badge>
              </div>
            </DrawerHeader>

            <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <DrawerSection title="合同信息">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">创建时间</span>
                    <div className="text-sm font-medium text-slate-900 mt-1">
                      {formatDate(contractDetail.createdAt)}
                    </div>
                  </div>
                  {contractDetail.signedAt && (
                    <div>
                      <span className="text-sm text-slate-500">签署时间</span>
                      <div className="text-sm font-medium text-slate-900 mt-1">
                        {formatDate(contractDetail.signedAt)}
                      </div>
                    </div>
                  )}
                </div>
                {contractDetail.remark && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-500">备注</span>
                    <p className="text-sm text-slate-700 mt-1">
                      {contractDetail.remark}
                    </p>
                  </div>
                )}
              </DrawerSection>

              <DrawerSection title="租客信息">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {contractDetail.lease.tenant.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {contractDetail.lease.tenant.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </DrawerSection>
            </div>

            <DrawerFooter>
              {contractDetail.status === ContractStatus.DRAFT && (
                <Button
                  onClick={() =>
                    updateContractStatusMutation.mutate({
                      id: contractDetail.id,
                      status: ContractStatus.PENDING_SIGN,
                    })
                  }
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  发起签署
                </Button>
              )}
              {contractDetail.status === ContractStatus.PENDING_SIGN && (
                <Button
                  onClick={() =>
                    updateContractStatusMutation.mutate({
                      id: contractDetail.id,
                      status: ContractStatus.SIGNED,
                      signedAt: new Date(),
                    })
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  标记已签署
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
    </AppLayout>
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
