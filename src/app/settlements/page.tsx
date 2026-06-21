"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getSettlementStatusColor,
} from "@/lib/utils";
import type { SettlementStatus } from "@prisma/client";
import {
  Building2,
  User,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
} from "lucide-react";

export default function SettlementsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRemark, setConfirmRemark] = useState("");
  const pageSize = 10;

  const { data, isLoading, refetch } = api.settlement.list.useQuery({
    page,
    pageSize,
    status: statusFilter || undefined,
    search: searchTerm || undefined,
  });

  const { data: stats } = api.settlement.getStats.useQuery();

  const utils = api.useUtils();
  const confirmMutation = api.settlement.confirm.useMutation({
    onSuccess: () => {
      utils.settlement.list.invalidate();
      utils.settlement.getStats.invalidate();
      setSelectedId(null);
      setConfirmRemark("");
    },
  });

  const markPaidMutation = api.settlement.markPaid.useMutation({
    onSuccess: () => {
      utils.settlement.list.invalidate();
      utils.settlement.getStats.invalidate();
      setSelectedId(null);
    },
  });

  const selectedSettlement = useMemo(() => {
    return data?.items.find((s) => s.id === selectedId) || null;
  }, [data?.items, selectedId]);

  const handleConfirm = () => {
    if (!selectedId) return;
    confirmMutation.mutate({
      id: selectedId,
      remark: confirmRemark || undefined,
    });
  };

  const handleMarkPaid = () => {
    if (!selectedId) return;
    markPaidMutation.mutate({ id: selectedId });
  };

  const statusColors: Record<SettlementStatus, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">业主结算</h1>
            <p className="mt-1 text-sm text-slate-500">
              管理业主结算单，确认金额并标记付款
            </p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">待确认</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.pending}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-600">
                金额: {formatCurrency(stats.pendingAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">已确认</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.confirmed}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-blue-600">
                金额: {formatCurrency(stats.confirmedAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">已付款</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.paid}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-emerald-600">
                金额: {formatCurrency(stats.paidAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">总计</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.total}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                金额: {formatCurrency(stats.totalAmount)}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索房源、业主..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as SettlementStatus | "");
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部状态</option>
                  <option value="PENDING">待确认</option>
                  <option value="CONFIRMED">已确认</option>
                  <option value="PAID">已付款</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    结算单号
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    房源
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    业主
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    结算周期
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    结算金额
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      加载中...
                    </td>
                  </tr>
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      暂无结算记录
                    </td>
                  </tr>
                ) : (
                  data?.items.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-900">
                          {settlement.settlementNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {settlement.property.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {settlement.property.address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {settlement.owner.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {settlement.owner.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>
                            {formatDate(settlement.startDate)} ~ {formatDate(settlement.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrency(settlement.amount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          其中租金 {formatCurrency(settlement.rentAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={statusColors[settlement.status]}>
                          {getStatusLabel(settlement.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {formatDateTime(settlement.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Drawer open={selectedId === settlement.id} onOpenChange={(open) => !open && setSelectedId(null)}>
                            <DrawerTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedId(settlement.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                查看
                              </Button>
                            </DrawerTrigger>
                          </Drawer>

                          {settlement.status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedId(settlement.id);
                                setConfirmRemark("");
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              确认
                            </Button>
                          )}

                          {settlement.status === "CONFIRMED" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedId(settlement.id);
                                handleMarkPaid();
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              标记付款
                            </Button>
                          )}
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

      <Drawer open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DrawerContent className="max-w-2xl">
          {selectedSettlement && (
            <>
              <DrawerHeader>
                <DrawerTitle>结算单详情</DrawerTitle>
                <DrawerDescription>
                  {selectedSettlement.settlementNo}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">状态</p>
                    <Badge className={statusColors[selectedSettlement.status]}>
                      {getStatusLabel(selectedSettlement.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">创建时间</p>
                    <p className="text-sm text-slate-900">
                      {formatDateTime(selectedSettlement.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">房源信息</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedSettlement.property.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedSettlement.property.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">业主信息</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedSettlement.owner.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedSettlement.owner.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">结算明细</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">结算周期</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatDate(selectedSettlement.startDate)} ~ {formatDate(selectedSettlement.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">租金收入</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(selectedSettlement.rentAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">管理费用</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(selectedSettlement.managementFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">其他费用</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(selectedSettlement.otherFee)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">应付业主金额</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(selectedSettlement.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedSettlement.remark && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">备注</h3>
                    <p className="text-sm text-slate-600">{selectedSettlement.remark}</p>
                  </div>
                )}

                {selectedSettlement.status === "PENDING" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="text-sm font-semibold text-amber-900 mb-2">确认备注</h3>
                    <textarea
                      value={confirmRemark}
                      onChange={(e) => setConfirmRemark(e.target.value)}
                      placeholder="请输入确认备注（可选）"
                      className="w-full h-20 rounded-md border border-amber-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                )}

                {selectedSettlement.status !== "PENDING" && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">确认信息</h3>
                    <p className="text-sm text-blue-700">
                      当前状态: {getStatusLabel(selectedSettlement.status)}
                    </p>
                  </div>
                )}

                {selectedSettlement.paidDate && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <h3 className="text-sm font-semibold text-emerald-900 mb-2">付款信息</h3>
                    <p className="text-sm text-emerald-700">
                      付款时间: {formatDateTime(selectedSettlement.paidDate)}
                    </p>
                  </div>
                )}
              </div>

              <DrawerFooter>
                <Button variant="outline" onClick={() => setSelectedId(null)}>
                  关闭
                </Button>
                {selectedSettlement.status === "PENDING" && (
                  <Button onClick={handleConfirm} disabled={confirmMutation.isPending}>
                    {confirmMutation.isPending ? "确认中..." : "确认结算"}
                  </Button>
                )}
                {selectedSettlement.status === "CONFIRMED" && (
                  <Button onClick={handleMarkPaid} disabled={markPaidMutation.isPending}>
                    {markPaidMutation.isPending ? "处理中..." : "标记已付款"}
                  </Button>
                )}
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
