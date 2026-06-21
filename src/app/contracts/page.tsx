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
} from "@/lib/utils";
import type { ContractStatus } from "@prisma/client";
import {
  Building2,
  User,
  Calendar,
  FileSignature,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function ContractsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signRemark, setSignRemark] = useState("");
  const pageSize = 10;

  const { data, isLoading, refetch } = api.contract.list.useQuery({
    page,
    pageSize,
    status: statusFilter || undefined,
    search: searchTerm || undefined,
  });

  const { data: stats } = api.contract.getStats.useQuery();

  const utils = api.useUtils();
  const signMutation = api.contract.markSigned.useMutation({
    onSuccess: () => {
      utils.contract.list.invalidate();
      utils.contract.getStats.invalidate();
      setSelectedId(null);
      setSignRemark("");
    },
  });

  const cancelMutation = api.contract.cancel.useMutation({
    onSuccess: () => {
      utils.contract.list.invalidate();
      utils.contract.getStats.invalidate();
      setSelectedId(null);
    },
  });

  const selectedContract = useMemo(() => {
    return data?.items.find((c) => c.id === selectedId) || null;
  }, [data?.items, selectedId]);

  const handleSign = () => {
    if (!selectedId) return;
    signMutation.mutate({
      id: selectedId,
      remark: signRemark || undefined,
    });
  };

  const handleCancel = () => {
    if (!selectedId) return;
    cancelMutation.mutate({ id: selectedId });
  };

  const statusColors: Record<ContractStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    PENDING_SIGN: "bg-amber-100 text-amber-700 border-amber-200",
    SIGNED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-600 border-red-200",
    EXPIRED: "bg-slate-100 text-slate-500 border-slate-200",
  };

  const statusIcons: Record<ContractStatus, React.ReactNode> = {
    DRAFT: <FileText className="h-4 w-4" />,
    PENDING_SIGN: <Clock className="h-4 w-4" />,
    SIGNED: <CheckCircle2 className="h-4 w-4" />,
    CANCELLED: <XCircle className="h-4 w-4" />,
    EXPIRED: <AlertCircle className="h-4 w-4" />,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">合同管理</h1>
            <p className="mt-1 text-sm text-slate-500">
              管理租赁合同，跟踪签署状态
            </p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">待签署</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.pending}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-600">
                合同金额: {formatCurrency(stats.pendingAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">已签署</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.signed}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-emerald-600">
                合同金额: {formatCurrency(stats.signedAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">已取消</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.cancelled}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-red-600">
                合同金额: {formatCurrency(stats.cancelledAmount)}
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
                  <FileSignature className="h-5 w-5 text-slate-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                合同金额: {formatCurrency(stats.totalAmount)}
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
                  placeholder="搜索合同号、租客、房源..."
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
                    setStatusFilter(e.target.value as ContractStatus | "");
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部状态</option>
                  <option value="DRAFT">草稿</option>
                  <option value="PENDING_SIGN">待签署</option>
                  <option value="SIGNED">已签署</option>
                  <option value="CANCELLED">已取消</option>
                  <option value="EXPIRED">已过期</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    合同号
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    房源
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    租客
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    租期
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    月租金
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
                      暂无合同记录
                    </td>
                  </tr>
                ) : (
                  data?.items.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-900">
                          {contract.contractNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {contract.property.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {contract.property.address}
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
                              {contract.tenant.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {contract.tenant.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>
                            {formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrency(contract.monthlyRent)}
                        </div>
                        <div className="text-xs text-slate-500">
                          押金 {formatCurrency(contract.deposit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={statusColors[contract.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[contract.status]}
                            {getStatusLabel(contract.status)}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {formatDateTime(contract.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Drawer open={selectedId === contract.id} onOpenChange={(open) => !open && setSelectedId(null)}>
                            <DrawerTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedId(contract.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                查看
                              </Button>
                            </DrawerTrigger>
                          </Drawer>

                          {contract.status === "PENDING_SIGN" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedId(contract.id);
                                setSignRemark("");
                              }}
                            >
                              <FileSignature className="h-4 w-4 mr-1" />
                              标记签署
                            </Button>
                          )}

                          {contract.status === "DRAFT" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel()}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              取消
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
          {selectedContract && (
            <>
              <DrawerHeader>
                <DrawerTitle>合同详情</DrawerTitle>
                <DrawerDescription>
                  {selectedContract.contractNo}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">状态</p>
                    <Badge className={statusColors[selectedContract.status]}>
                      <span className="flex items-center gap-1">
                        {statusIcons[selectedContract.status]}
                        {getStatusLabel(selectedContract.status)}
                      </span>
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">创建时间</p>
                    <p className="text-sm text-slate-900">
                      {formatDateTime(selectedContract.createdAt)}
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
                        {selectedContract.property.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedContract.property.address}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        面积: {selectedContract.property.area}㎡
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">租客信息</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedContract.tenant.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedContract.tenant.phone}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedContract.tenant.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">合同条款</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">租赁期限</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatDate(selectedContract.startDate)} ~ {formatDate(selectedContract.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">月租金</span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(selectedContract.monthlyRent)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">押金</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(selectedContract.deposit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">付款方式</span>
                      <span className="text-sm font-medium text-slate-900">
                        {selectedContract.paymentTerms}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">合同总金额</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(selectedContract.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedContract.remark && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">备注</h3>
                    <p className="text-sm text-slate-600">{selectedContract.remark}</p>
                  </div>
                )}

                {selectedContract.status === "PENDING_SIGN" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="text-sm font-semibold text-amber-900 mb-2">签署备注</h3>
                    <textarea
                      value={signRemark}
                      onChange={(e) => setSignRemark(e.target.value)}
                      placeholder="请输入签署备注（可选）"
                      className="w-full h-20 rounded-md border border-amber-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                )}

                {selectedContract.signedAt && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <h3 className="text-sm font-semibold text-emerald-900 mb-2">签署信息</h3>
                    <p className="text-sm text-emerald-700">
                      签署时间: {formatDateTime(selectedContract.signedAt)}
                    </p>
                  </div>
                )}
              </div>

              <DrawerFooter>
                <Button variant="outline" onClick={() => setSelectedId(null)}>
                  关闭
                </Button>
                {selectedContract.status === "PENDING_SIGN" && (
                  <Button onClick={handleSign} disabled={signMutation.isPending}>
                    {signMutation.isPending ? "处理中..." : "确认签署"}
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
