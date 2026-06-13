"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Receipt, Calendar, Eye } from "lucide-react";
import Link from "next/link";

const getBillStatus = (bill: any) => {
  if (bill.status === "PAID") return { label: "已支付", variant: "success" as const };
  const dueDate = new Date(bill.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  if (bill.status === "PENDING" && dueDate < today) return { label: "已逾期", variant: "destructive" as const };
  return { label: "待支付", variant: "warning" as const };
};

export default function BillsPage() {
  const [statusTab, setStatusTab] = useState<string>("all");
  const [month, setMonth] = useState<string>("");
  const [search, setSearch] = useState("");
  const { data: bills, refetch: refetchBills } = trpc.bill.list.useQuery({ month: month || undefined });
  const { data: tenants, refetch: refetchTenants } = trpc.tenant.list.useQuery({ search: search || undefined });

  const filteredBills = bills?.filter((b: any) => {
    if (search) {
      const tenantMatch = b.tenant?.name?.toLowerCase().includes(search.toLowerCase());
      if (!tenantMatch) return false;
    }
    if (statusTab === "all") return true;
    const status = getBillStatus(b);
    if (statusTab === "PAID") return b.status === "PAID";
    if (statusTab === "PENDING") {
      const dueDate = new Date(b.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return b.status === "PENDING" && dueDate >= today;
    }
    if (statusTab === "OVERDUE") {
      const dueDate = new Date(b.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return b.status === "PENDING" && dueDate < today;
    }
    return true;
  });

  const tabs = [
    { key: "all", label: "全部", count: bills?.length ?? 0 },
    { key: "PENDING", label: "待支付", count: bills?.filter((b: any) => {
      const dueDate = new Date(b.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return b.status === "PENDING" && dueDate >= today;
    }).length ?? 0 },
    { key: "PAID", label: "已支付", count: bills?.filter((b: any) => b.status === "PAID").length ?? 0 },
    { key: "OVERDUE", label: "已逾期", count: bills?.filter((b: any) => {
      const dueDate = new Date(b.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return b.status === "PENDING" && dueDate < today;
    }).length ?? 0 },
  ];

  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ value: m, label: `${d.getFullYear()}年${d.getMonth() + 1}月` });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="费用账单"
        description="园区租户费用账单生成、支付跟踪与原始单据归档"
        actions={
          <Link href="/bills/new">
            <Button><Plus className="h-4 w-4" />新增账单</Button>
          </Link>
        }
      />

      <Card className="card-border-left-green">
        <CardContent className="pt-0">
          <div className="flex items-center gap-1 border-b border-pine-100 -mx-6 px-6 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`px-4 py-4 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  statusTab === tab.key
                    ? "border-pine-800 text-pine-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${statusTab === tab.key ? "bg-pine-100 text-pine-800" : "bg-zinc-100 text-zinc-500"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="relative max-w-xs">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Select value={month} onValueChange={(v) => { setMonth(v); refetchBills(); }}>
                <SelectTrigger className="pl-10"><SelectValue placeholder="选择月份" /></SelectTrigger>
                <SelectContent>
                  {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input className="pl-10" placeholder="搜索租户名称..." value={search} onChange={(e) => { setSearch(e.target.value); refetchTenants(); }} />
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Receipt className="h-3 w-3" />{filteredBills?.length ?? 0} 条账单
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账单编号</TableHead>
                <TableHead>账期</TableHead>
                <TableHead>租户</TableHead>
                <TableHead>房号</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>到期日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills?.map((b: any, i: number) => {
                const status = getBillStatus(b);
                return (
                  <TableRow key={b.id} className="animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                    <TableCell className="font-mono text-xs text-pine-700">#{b.id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-pine-800">{b.period}</TableCell>
                    <TableCell>{b.tenant?.name}</TableCell>
                    <TableCell className="text-sm">{b.room?.building?.name} {b.room?.unitNumber}</TableCell>
                    <TableCell className="font-semibold font-serif text-pine-900">{formatCurrency(b.totalAmount)}</TableCell>
                    <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    <TableCell className="text-sm text-zinc-500">{formatDate(b.dueDate)}</TableCell>
                    <TableCell>
                      <Link href={`/bills/${b.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" />查看</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!filteredBills || filteredBills.length === 0) && (
                <TableRow><TableCell colSpan={8} className="text-center text-zinc-400 py-12">暂无账单数据</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
