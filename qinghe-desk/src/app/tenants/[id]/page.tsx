"use client";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, FileText, Building2, Calendar, Wrench, Headphones } from "lucide-react";
import Link from "next/link";

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const { data: tenant } = trpc.tenant.get.useQuery({ id: params.id });

  if (!tenant) return <div className="p-8">加载中...</div>;

  return (
    <div className="animate-fade-in">
      <Link href="/tenants" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-pine-700 mb-4">
        <ArrowLeft className="h-4 w-4" />返回租户列表
      </Link>
      <PageHeader
        title={tenant.name}
        description={`${tenant.industry ?? ""} · ${tenant.contact} · ${tenant.phone}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-1 card-border-left-green">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pine-800 to-pine-600 text-white font-serif text-2xl font-bold">
                {tenant.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-pine-900">{tenant.contact}</h2>
                <p className="text-sm text-zinc-500">主要联系人</p>
                <Badge variant={tenant.status === "ACTIVE" ? "success" : "outline"} className="mt-2">
                  {tenant.status === "ACTIVE" ? "入驻中" : "已迁出"}
                </Badge>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-zinc-700"><Phone className="h-4 w-4 text-pine-700" />{tenant.phone}</div>
              {tenant.email && <div className="flex items-center gap-3 text-zinc-700"><Mail className="h-4 w-4 text-pine-700" />{tenant.email}</div>}
              {tenant.industry && <div className="flex items-center gap-3 text-zinc-700"><FileText className="h-4 w-4 text-pine-700" />{tenant.industry}</div>}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-pine-100 bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2"><Building2 className="h-3.5 w-3.5" />使用房间</div>
            <p className="font-serif text-3xl font-bold text-pine-800">{tenant.rooms?.length ?? 0}</p>
          </div>
          <div className="rounded-xl border border-pine-100 bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2"><Headphones className="h-3.5 w-3.5" />服务申请</div>
            <p className="font-serif text-3xl font-bold text-amber-600">{tenant.serviceRequests?.length ?? 0}</p>
          </div>
          <div className="rounded-xl border border-pine-100 bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2"><Wrench className="h-3.5 w-3.5" />报修工单</div>
            <p className="font-serif text-3xl font-bold text-red-600">{tenant.repairs?.length ?? 0}</p>
          </div>
        </div>
      </div>

      <Card className="card-border-left-amber">
        <CardContent className="pt-6">
          <Tabs defaultValue="rooms">
            <TabsList>
              <TabsTrigger value="rooms">关联房间</TabsTrigger>
              <TabsTrigger value="contracts">合同信息</TabsTrigger>
              <TabsTrigger value="bills">账单记录</TabsTrigger>
              <TabsTrigger value="notes">档案备注</TabsTrigger>
            </TabsList>

            <TabsContent value="rooms">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>楼栋</TableHead><TableHead>房号</TableHead><TableHead>楼层</TableHead><TableHead>面积 (㎡)</TableHead><TableHead>单价</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.rooms?.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.building?.name}</TableCell>
                      <TableCell className="font-medium text-pine-800">{r.unitNumber}</TableCell>
                      <TableCell>{r.floor} 层</TableCell>
                      <TableCell>{r.area}</TableCell>
                      <TableCell>{formatCurrency(r.price)}/㎡</TableCell>
                    </TableRow>
                  ))}
                  {(!tenant.rooms || tenant.rooms.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-zinc-400 py-8">暂无房间数据</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="contracts">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>房号</TableHead><TableHead>起租日</TableHead><TableHead>到期日</TableHead><TableHead>月租金</TableHead><TableHead>状态</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.contracts?.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-pine-800">{c.room?.building?.name} {c.room?.unitNumber}</TableCell>
                      <TableCell>{formatDate(c.startDate)}</TableCell>
                      <TableCell>{formatDate(c.endDate)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(c.monthlyRent)}</TableCell>
                      <TableCell><Badge variant={c.status === "ACTIVE" ? "success" : "outline"}>{c.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {(!tenant.contracts || tenant.contracts.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-zinc-400 py-8">暂无合同数据</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="bills">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>账期</TableHead><TableHead>房号</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead><TableHead>创建日期</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.bills?.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-pine-800">{b.period}</TableCell>
                      <TableCell>{formatCurrency(b.totalAmount)}</TableCell>
                      <TableCell>{b.room?.unitNumber ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={b.status === "PAID" ? "success" : b.status === "PENDING" ? "warning" : "destructive"}>
                          {b.status === "PAID" ? "已支付" : b.status === "PENDING" ? "待支付" : "逾期"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(b.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {(!tenant.bills || tenant.bills.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-zinc-400 py-8">暂无账单数据</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="notes">
              <div className="rounded-lg border border-dashed border-pine-200 p-12 text-center text-zinc-500">
                <FileText className="h-8 w-8 mx-auto mb-3 text-zinc-300" />
                <p>附件与备注功能预留</p>
                <p className="text-xs mt-1">原始单据、照片、合同扫描件等可在此归档</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
