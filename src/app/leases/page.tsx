"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerHeader, DrawerSection, DrawerFooter } from "@/components/ui/drawer";
import {
  formatCurrency,
  formatDate,
  formatCNY,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
} from "@/lib/utils";
import { LeaseStatus } from "@prisma/client";
import {
  Building2,
  User,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  ClipboardList,
  History,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";

export default function LeasesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LeaseStatus | undefined>();
  const [tenantName, setTenantName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pageSize = 10;

  const { data, isLoading, refetch } = api.lease.list.useQuery({
    page,
    pageSize,
    status,
    tenantName: tenantName || undefined,
    propertyName: propertyName || undefined,
  });

  const { data: leaseDetail } = api.lease.getById.useQuery(
    { id: selectedLeaseId! },
    { enabled: !!selectedLeaseId }
  );

  const handleViewDetail = (id: string) => {
    setSelectedLeaseId(id);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedLeaseId(null), 300);
  };

  const filters = useMemo(
    () => [
      { value: undefined, label: "全部" },
      { value: LeaseStatus.ACTIVE, label: "有效" },
      { value: LeaseStatus.PENDING, label: "待生效" },
      { value: LeaseStatus.EXPIRED, label: "已到期" },
      { value: LeaseStatus.TERMINATED, label: "已终止" },
    ],
    []
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">租约管理</h1>
            <p className="mt-1 text-sm text-slate-500">管理所有联合办公房源的租约信息</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={status || ""}
                  onChange={(e) => {
                    setStatus(e.target.value as LeaseStatus || undefined);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filters.map((f) => (
                    <option key={f.value || "all"} value={f.value || ""}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

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
                  setStatus(undefined);
                  setTenantName("");
                  setPropertyName("");
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
                    房源信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    租客信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    月租金
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    租期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    关联
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
                ) : data?.leases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      暂无租约数据
                    </td>
                  </tr>
                ) : (
                  data?.leases.map((lease) => (
                    <tr
                      key={lease.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => handleViewDetail(lease.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{lease.propertyName}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">
                              {lease.propertyAddress}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{lease.tenantName}</div>
                            <div className="text-xs text-slate-500">
                              {lease.tenantCompany || lease.tenantPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {formatCNY(lease.monthlyRent)}
                        </div>
                        <div className="text-xs text-slate-500">
                          押金: {formatCNY(lease.deposit)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="text-sm text-slate-900">
                              {formatDate(lease.startDate)}
                            </div>
                            <div className="text-xs text-slate-500">
                              至 {formatDate(lease.endDate)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(lease.status)}>
                          {getStatusLabel(lease.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-semibold text-slate-900">{lease.billCount}</div>
                            <div className="text-xs text-slate-500">账单</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-slate-900">
                              {lease.assignmentCount}
                            </div>
                            <div className="text-xs text-slate-500">工单</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(lease.id);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            详情
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            账单
                          </Button>
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
        title="租约详情"
        width="max-w-3xl"
      >
        {leaseDetail && (
          <>
            <DrawerHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {leaseDetail.property.name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {leaseDetail.property.address}
                  </p>
                </div>
                <Badge className={getStatusColor(leaseDetail.status)}>
                  {getStatusLabel(leaseDetail.status)}
                </Badge>
              </div>
            </DrawerHeader>

            <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <DrawerSection title="基本信息">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-500">起租日期:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatDate(leaseDetail.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-500">到期日期:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatDate(leaseDetail.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">月租金:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCNY(leaseDetail.monthlyRent)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">押金:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCNY(leaseDetail.deposit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">付款日:</span>
                    <span className="text-sm font-medium text-slate-900">
                      每月 {leaseDetail.paymentDay} 日
                    </span>
                  </div>
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
                        {leaseDetail.tenant.name}
                      </div>
                      {leaseDetail.tenant.company && (
                        <div className="text-sm text-slate-600">
                          {leaseDetail.tenant.company}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Phone className="h-3 w-3" />
                          {leaseDetail.tenant.phone}
                        </div>
                        {leaseDetail.tenant.email && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Mail className="h-3 w-3" />
                            {leaseDetail.tenant.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DrawerSection>

              <DrawerSection title="业主信息">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="font-medium text-slate-900">
                        {leaseDetail.owner.name}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Phone className="h-3 w-3" />
                          {leaseDetail.owner.phone}
                        </div>
                        {leaseDetail.owner.email && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Mail className="h-3 w-3" />
                            {leaseDetail.owner.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DrawerSection>

              <DrawerSection title="最近账单">
                <div className="space-y-2">
                  {leaseDetail.bills.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">暂无账单</div>
                  ) : (
                    leaseDetail.bills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {bill.period}
                            </div>
                            <div className="text-xs text-slate-500">
                              账单号: {bill.billNo}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">
                              {formatCNY(bill.amount)}
                            </div>
                            <div className="text-xs text-slate-500">
                              已付: {formatCNY(bill.paidAmount)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {bill.hasException && (
                              <Badge className="bg-red-100 text-red-700">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                异常
                              </Badge>
                            )}
                            <Badge className={getStatusColor(bill.status)}>
                              {getStatusLabel(bill.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DrawerSection>

              <DrawerSection title="最近工单">
                <div className="space-y-2">
                  {leaseDetail.assignments.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">暂无工单</div>
                  ) : (
                    leaseDetail.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ClipboardList className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {assignment.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {getStatusLabel(assignment.type)} · {assignment.assigneeName}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(assignment.priority)}>
                            {getStatusLabel(assignment.priority)}
                          </Badge>
                          <Badge className={getStatusColor(assignment.status)}>
                            {getStatusLabel(assignment.status)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DrawerSection>

              <DrawerSection title="变更历史">
                <div className="space-y-2">
                  {leaseDetail.changeHistory.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">暂无变更记录</div>
                  ) : (
                    leaseDetail.changeHistory.slice(0, 5).map((change) => (
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
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                查看全部账单
              </Button>
            </DrawerFooter>
          </>
        )}
      </Drawer>
    </AppLayout>
  );
}
