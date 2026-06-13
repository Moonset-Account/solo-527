"use client";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Paperclip, Calendar, User, Building2, Clock, CreditCard } from "lucide-react";
import Link from "next/link";

const getBillStatusMeta = (bill: any) => {
  if (bill.status === "PAID") return { label: "已支付", variant: "success" as const, color: "bg-emerald-500" };
  const dueDate = new Date(bill.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  if (bill.status === "PENDING" && dueDate < today) return { label: "已逾期", variant: "destructive" as const, color: "bg-red-500" };
  return { label: "待支付", variant: "warning" as const, color: "bg-amber-500" };
};

const flowSteps = ["PENDING", "PAID"];
const stepLabels: Record<string, string> = {
  PENDING: "待支付",
  PAID: "已支付",
};
const stepColors: Record<string, string> = {
  PENDING: "bg-amber-500",
  PAID: "bg-emerald-500",
};

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const { data: bill } = trpc.bill.get.useQuery({ id: params.id });
  const utils = trpc.useUtils();
  const markPaidMut = trpc.bill.markPaid.useMutation({
    onSuccess: () => utils.bill.get.invalidate(),
  });

  if (!bill) return <div className="p-8">加载中...</div>;

  const statusMeta = getBillStatusMeta(bill);
  const currentIdx = flowSteps.indexOf(bill.status);
  const itemsTotal = bill.items?.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) ?? bill.totalAmount;

  return (
    <div className="animate-fade-in">
      <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-pine-700 mb-4">
        <ArrowLeft className="h-4 w-4" />返回账单列表
      </Link>
      <PageHeader
        title={`${bill.period} 账单`}
        description={bill.tenant?.name ?? ""}
        actions={
          bill.status === "PENDING" ? (
            <Button onClick={() => markPaidMut.mutate({ id: bill.id, operatorId: "clerk_admin_001" })} disabled={markPaidMut.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {markPaidMut.isPending ? "处理中..." : "标记已支付"}
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-3 card-border-left-green">
          <CardContent className="pt-6">
            <div className="mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">账单基本信息</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mb-1"><CreditCard className="h-3 w-3" />账单编号</p>
                  <p className="font-mono text-sm font-semibold text-pine-900">#{bill.id.slice(-6).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" />账期</p>
                  <p className="font-semibold text-pine-900">{bill.period}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mb-1"><Clock className="h-3 w-3" />创建时间</p>
                  <p className="text-sm text-zinc-700">{formatDate(bill.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" />到期日</p>
                  <p className="text-sm text-zinc-700">{formatDate(bill.dueDate)}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">费用明细</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>费用项</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-zinc-800">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                      <TableCell className="text-right font-serif">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {(!bill.items || bill.items.length === 0) && (
                    <TableRow><TableCell colSpan={3} className="text-center text-zinc-400 py-8">暂无费用明细</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-semibold">合计</TableCell>
                    <TableCell className="text-right font-serif text-xl font-bold text-pine-900">{formatCurrency(itemsTotal)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">支付状态</p>
              <div className="flex items-center justify-between bg-pine-50/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${statusMeta.color} text-white`}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-serif text-lg font-bold text-pine-900">{statusMeta.label}</p>
                    <p className="text-xs text-zinc-500">
                      {bill.status === "PAID" ? `支付时间：${bill.paidAt ? formatDate(bill.paidAt) : "-"}` : `请于 ${formatDate(bill.dueDate)} 前完成支付`}
                    </p>
                  </div>
                </div>
                <Badge variant={statusMeta.variant} className="text-base px-4 py-1.5">{statusMeta.label}</Badge>
              </div>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute top-3 left-3 h-1 w-full max-w-[calc(100%-3rem)] rounded-full bg-pine-100" />
                  <div
                    className="absolute top-3 left-3 h-1 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                    style={{ width: `calc(${(Math.max(currentIdx, 0) / (flowSteps.length - 1)) * 100}% - 1.5rem)` }}
                  />
                  <div className="relative flex justify-between">
                    {flowSteps.map((step, i) => {
                      const done = i <= currentIdx;
                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                            done ? stepColors[step] : "bg-zinc-200"
                          }`}>
                            {done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <p className={`mt-3 text-xs font-medium ${done ? "text-pine-800" : "text-zinc-400"}`}>{stepLabels[step]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="h-4 w-4 text-pine-800" />
                <p className="text-sm font-semibold text-pine-900">附件与原始单据</p>
              </div>
              <div className="rounded-xl border border-dashed border-pine-200 p-10 text-center">
                <Paperclip className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
                <p className="text-sm text-zinc-500">暂无附件</p>
                <p className="text-xs text-zinc-400 mt-1">可上传发票、收据、合同扫描件等原始凭证</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="card-border-left-amber">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 flex items-center gap-1"><Building2 className="h-3 w-3" />租户名称</span>
                <p className="font-medium text-pine-900 font-serif">{bill.tenant?.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 flex items-center gap-1"><Building2 className="h-3 w-3" />房间信息</span>
                <p className="font-medium text-zinc-800">{bill.room?.building?.name} · {bill.room?.unitNumber}</p>
                <p className="text-xs text-zinc-500">面积 {bill.room?.area}㎡ · {bill.room?.floor}层</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 flex items-center gap-1"><CreditCard className="h-3 w-3" />月租金参考</span>
                <p className="font-serif font-semibold text-pine-900">{formatCurrency(bill.room?.price ?? 0)}/㎡</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 flex items-center gap-1"><User className="h-3 w-3" />创建人</span>
                <p className="text-zinc-800">{bill.creator?.name ?? "系统管理员"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-pine-700" />支付信息
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-pine-50 to-pine-100/50 p-4 text-center">
                <p className="text-xs text-zinc-500 mb-1">应付金额</p>
                <p className="font-serif text-3xl font-bold text-pine-800">{formatCurrency(bill.totalAmount)}</p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">支付状态</span>
                  <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                </div>
                {bill.status === "PAID" && bill.paidAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 flex items-center gap-1"><Clock className="h-3 w-3" />支付时间</span>
                    <span className="text-zinc-800 font-medium">{formatDate(bill.paidAt)}</span>
                  </div>
                )}
                {bill.status !== "PAID" && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 flex items-center gap-1"><Calendar className="h-3 w-3" />到期日</span>
                    <span className="text-zinc-800 font-medium">{formatDate(bill.dueDate)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
