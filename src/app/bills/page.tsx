"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerHeader, DrawerSection, DrawerFooter } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatCurrency,
  formatDate,
  formatCNY,
  getStatusColor,
  getStatusLabel,
  getOverdueDays,
  getOverdueBadgeStyle,
  getPriorityColor,
} from "@/lib/utils";
import { BillStatus } from "@prisma/client";
import {
  Building2,
  User,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign,
  AlertTriangle,
  MoreHorizontal,
  FileText,
  History,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ClipboardList,
} from "lucide-react";

export default function BillsPage() {
  const [page, setPage] = useState(1);
  const [selectedStatuses, setSelectedStatuses] = useState<BillStatus[]>([]);
  const [tenantName, setTenantName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [exceptionDescription, setExceptionDescription] = useState("");

  const pageSize = 10;

  const { data, isLoading, refetch } = api.bill.list.useQuery({
    page,
    pageSize,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    tenantName: tenantName || undefined,
    propertyName: propertyName || undefined,
    isOverdue: isOverdueOnly || undefined,
  });

  const { data: billDetail } = api.bill.getById.useQuery(
    { id: selectedBillId! },
    { enabled: !!selectedBillId }
  );

  const utils = api.useUtils();

  const payMutation = api.bill.pay.useMutation({
    onSuccess: () => {
      utils.bill.list.invalidate();
      utils.bill.getById.invalidate({ id: selectedBillId! });
      utils.dashboard.getStats.invalidate();
      setPayModalOpen(false);
      setPayAmount("");
      setPayMethod("BANK_TRANSFER");
    },
  });

  const generateExceptionMutation = api.bill.generateException.useMutation({
    onSuccess: () => {
      utils.bill.list.invalidate();
      utils.bill.getById.invalidate({ id: selectedBillId! });
      utils.assignment.list.invalidate();
      setExceptionModalOpen(false);
      setExceptionDescription("");
    },
  });

  const handleViewDetail = (id: string) => {
    setSelectedBillId(id);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedBillId(null), 300);
  };

  const handlePay = () => {
    if (!selectedBillId || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    payMutation.mutate({
      id: selectedBillId,
      amount,
      paymentMethod: payMethod,
    });
  };

  const handleGenerateException = () => {
    if (!selectedBillId || !exceptionDescription) return;
    generateExceptionMutation.mutate({
      billId: selectedBillId,
      description: exceptionDescription,
    });
  };

  const toggleStatus = (status: BillStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
    setPage(1);
  };

  const statusFilters = useMemo(
    () => [
      { value: BillStatus.UNPAID, label: "未支付", color: "bg-amber-100 text-amber-700" },
      { value: BillStatus.PARTIAL, label: "部分支付", color: "bg-purple-100 text-purple-700" },
      { value: BillStatus.PAID, label: "已支付", color: "bg-emerald-100 text-emerald-700" },
      { value: BillStatus.OVERDUE, label: "已逾期", color: "bg-orange-100 text-orange-700" },
      { value: BillStatus.EXCEPTION, label: "异常", color: "bg-red-100 text-red-700" },
    ],
    []
  );

  const paymentMethods = useMemo(
    () => [
      { value: "BANK_TRANSFER", label: "银行转账" },
      { value: "ALIPAY", label: "支付宝" },
      { value: "WECHAT", label: "微信支付" },
      { value: "CASH", label: "现金" },
    ],
    []
  );

  const remainingAmount = billDetail
    ? billDetail.amount - billDetail.paidAmount
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">账单管理</h1>
            <p className="mt-1 text-sm text-slate-500">
              管理所有租金账单，跟踪收租进度，处理逾期异常
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
              <button
                onClick={() => {
                  setIsOverdueOnly(!isOverdueOnly);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isOverdueOnly
                    ? "bg-red-100 text-red-700 ring-2 ring-offset-1 ring-red-500"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                仅显示逾期
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
                  setTenantName("");
                  setPropertyName("");
                  setIsOverdueOnly(false);
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
                    账单信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    房源/租客
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    应收金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    到期日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    逾期天数
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
                ) : data?.bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      暂无账单数据
                    </td>
                  </tr>
                ) : (
                  data?.bills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => handleViewDetail(bill.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {bill.billNo}
                            </div>
                            <div className="text-xs text-slate-500">
                              {bill.period}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">
                            {bill.propertyName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {bill.tenantName} · {bill.tenantPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {formatCNY(bill.amount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          已付: {formatCNY(bill.paidAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {formatDate(bill.dueDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {bill.overdueDays > 0 ? (
                          <Badge className={getOverdueBadgeStyle(bill.overdueDays)}>
                            <Clock className="h-3 w-3 mr-1" />
                            {bill.overdueDays} 天
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {bill.hasException && (
                            <Badge className="bg-red-100 text-red-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              异常
                            </Badge>
                          )}
                          <Badge className={getStatusColor(bill.status)}>
                            {getStatusLabel(bill.status)}
                          </Badge>
                        </div>
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
                                    handleViewDetail(bill.id);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  查看详情
                                </button>
                                {bill.status !== BillStatus.PAID && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBillId(bill.id);
                                      setPayAmount(
                                        (bill.amount - bill.paidAmount).toFixed(2)
                                      );
                                      setPayModalOpen(true);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2 text-emerald-600"
                                  >
                                    <DollarSign className="h-4 w-4" />
                                    登记收款
                                  </button>
                                )}
                                {bill.overdueDays > 0 && !bill.hasException && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBillId(bill.id);
                                      setExceptionDescription(
                                        `租金逾期${bill.overdueDays}天，请及时催收`
                                      );
                                      setExceptionModalOpen(true);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 flex items-center gap-2 text-red-600"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                    生成异常单
                                  </button>
                                )}
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
        onClose={handleCloseDrawer}
        title="账单详情"
        width="max-w-3xl"
      >
        {billDetail && (
          <>
            <DrawerHeader>
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
                      {formatCNY(remainingAmount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">到期日</div>
                      <div className="text-sm font-medium text-slate-900">
                        {formatDate(billDetail.dueDate)}
                      </div>
                    </div>
                  </div>
                  {billDetail.overdueDays > 0 && (
                    <div className="col-span-2">
                      <Badge className={getOverdueBadgeStyle(billDetail.overdueDays)}>
                        <Clock className="h-3 w-3 mr-1" />
                        已逾期 {billDetail.overdueDays} 天
                      </Badge>
                    </div>
                  )}
                </div>
              </DrawerSection>

              <DrawerSection title="租客信息">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="font-medium text-slate-900">
                        {billDetail.lease.tenant.name}
                      </div>
                      {billDetail.lease.tenant.company && (
                        <div className="text-sm text-slate-600">
                          {billDetail.lease.tenant.company}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Phone className="h-3 w-3" />
                          {billDetail.lease.tenant.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DrawerSection>

              {billDetail.exception && (
                <DrawerSection title="异常单信息">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(billDetail.exception.level)}>
                            {getStatusLabel(billDetail.exception.level)}
                          </Badge>
                          <Badge className={getStatusColor(billDetail.exception.status)}>
                            {getStatusLabel(billDetail.exception.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700">
                          {billDetail.exception.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          创建时间: {formatDate(billDetail.exception.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </DrawerSection>
              )}

              <DrawerSection title="关联工单">
                <div className="space-y-2">
                  {billDetail.assignments.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">暂无工单</div>
                  ) : (
                    billDetail.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <ClipboardList className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {assignment.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {getStatusLabel(assignment.type)} · {assignment.assignee.name}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusLabel(assignment.status)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </DrawerSection>

              <DrawerSection title="变更历史">
                <div className="space-y-2">
                  {billDetail.changeHistory.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">暂无变更记录</div>
                  ) : (
                    billDetail.changeHistory.slice(0, 5).map((change) => (
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
              <Button variant="outline" onClick={handleCloseDrawer}>
                关闭
              </Button>
              {billDetail.status !== BillStatus.PAID && (
                <Button
                  onClick={() => {
                    setPayAmount(remainingAmount.toFixed(2));
                    setPayModalOpen(true);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  登记收款
                </Button>
              )}
              {billDetail.overdueDays > 0 && !billDetail.exception && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setExceptionDescription(
                      `租金逾期${billDetail.overdueDays}天，请及时催收`
                    );
                    setExceptionModalOpen(true);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  生成异常单
                </Button>
              )}
            </DrawerFooter>
          </>
        )}
      </Drawer>

      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setPayModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-scale-in">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">登记收款</h3>
              <p className="text-sm text-slate-500 mt-1">
                {billDetail?.billNo} · 待收 {formatCNY(remainingAmount)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  收款金额
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ¥
                  </span>
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                    step="0.01"
                    min="0.01"
                    max={remainingAmount}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  支付方式
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentMethods.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPayModalOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handlePay}
                disabled={payMutation.isPending || !payAmount}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                确认收款
              </Button>
            </div>
          </div>
        </div>
      )}

      {exceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setExceptionModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-scale-in">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    生成租金逾期异常单
                  </h3>
                  <p className="text-sm text-slate-500">
                    将自动创建催收工单并派发给一线人员
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                异常说明
              </label>
              <textarea
                value={exceptionDescription}
                onChange={(e) => setExceptionDescription(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="请输入异常说明..."
              />
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setExceptionModalOpen(false)}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleGenerateException}
                disabled={generateExceptionMutation.isPending || !exceptionDescription}
              >
                <XCircle className="h-4 w-4 mr-2" />
                确认生成
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
