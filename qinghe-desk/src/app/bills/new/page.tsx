"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Check, Plus, Trash2, ChevronRight, ChevronLeft, Building2 } from "lucide-react";
import Link from "next/link";

const billCategories = ["租金", "物业费", "水电费", "网络费", "停车费", "空调费", "其他"];

export default function NewBillPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { data: tenants } = trpc.tenant.list.useQuery();
  const { data: rooms } = trpc.room.list.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    tenantId: "",
    roomId: "",
    period: "",
    dueDate: "",
    items: [{ name: "", amount: 0, category: "租金" }],
  });

  const createMutation = trpc.bill.create.useMutation({
    onSuccess: () => {
      utils.bill.list.invalidate();
      router.push("/bills");
    },
  });

  const filteredRooms = useMemo(() => {
    if (!form.tenantId) return rooms ?? [];
    return (rooms ?? []).filter((r: any) => r.tenantId === form.tenantId);
  }, [form.tenantId, rooms]);

  const totalAmount = form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { name: "", amount: 0, category: "其他" }] });
  };

  const removeItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const canNextStep1 = form.tenantId && form.roomId && form.period && form.dueDate;
  const canNextStep2 = form.items.length > 0 && form.items.every((i) => i.name && i.amount > 0);

  const handleCreate = () => {
    createMutation.mutate({
      tenantId: form.tenantId,
      roomId: form.roomId,
      period: form.period,
      dueDate: form.dueDate,
      items: form.items.map((i) => ({ name: i.name, amount: Number(i.amount), category: i.category })),
    });
  };

  const selectedTenant = tenants?.find((t: any) => t.id === form.tenantId);
  const selectedRoom = rooms?.find((r: any) => r.id === form.roomId);

  return (
    <div className="animate-fade-in">
      <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-pine-700 mb-4">
        <ArrowLeft className="h-4 w-4" />返回账单列表
      </Link>
      <PageHeader
        title="生成新账单"
        description="选择租户与房间，录入费用项并生成账单"
      />

      <div className="mb-8">
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-3 ${step >= s ? "text-pine-900" : "text-zinc-400"}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  step >= s
                    ? i === step - 1
                      ? "bg-pine-800 text-white"
                      : "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-500"
                }`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                <span className="text-sm font-medium">
                  {s === 1 ? "选择租户与房间" : s === 2 ? "录入费用项" : "预览确认"}
                </span>
              </div>
              {i < 2 && <div className={`w-16 h-0.5 mx-4 ${step > s ? "bg-emerald-500" : "bg-zinc-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card className="card-border-left-green">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-pine-700" />第一步：选择租户与房间
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <div>
                <Label>选择租户 *</Label>
                <Select value={form.tenantId} onValueChange={(v) => setForm({ ...form, tenantId: v, roomId: "" })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="请选择租户" /></SelectTrigger>
                  <SelectContent>
                    {tenants?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>选择房间 *</Label>
                <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v })} disabled={!form.tenantId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={form.tenantId ? "请选择房间" : "请先选择租户"} /></SelectTrigger>
                  <SelectContent>
                    {filteredRooms.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.building?.name} · {r.unitNumber} · {r.area}㎡
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>账期 *</Label>
                <Input className="mt-1" placeholder="YYYY-MM，如 2026-06" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </div>
              <div>
                <Label>到期日 *</Label>
                <Input type="date" className="mt-1" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <Separator className="my-8" />
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canNextStep1}>
                下一步<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="card-border-left-green">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">第二步：录入费用项</CardTitle>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4" />添加费用项
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    <Label className="text-xs">费用名称 *</Label>
                    <Input className="mt-1" placeholder="如：6月租金" value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">金额 (元) *</Label>
                    <Input className="mt-1" type="number" min="0" step="0.01" value={item.amount || ""} onChange={(e) => updateItem(idx, "amount", e.target.value)} />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">分类</Label>
                    <Select value={item.category} onValueChange={(v) => updateItem(idx, "category", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {billCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={form.items.length === 1} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-8" />

            <div className="flex items-center justify-between bg-pine-50/50 rounded-lg p-4">
              <div>
                <p className="text-sm text-zinc-500">账单合计金额</p>
                <p className="font-serif text-2xl font-bold text-pine-900 mt-1">{formatCurrency(totalAmount)}</p>
              </div>
              <Badge variant={totalAmount > 0 ? "success" : "outline"} className="text-sm">
                {form.items.length} 项费用
              </Badge>
            </div>

            <Separator className="my-8" />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" />上一步
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canNextStep2}>
                下一步<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card className="card-border-left-green">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />第三步：预览确认
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="rounded-xl border border-pine-100 bg-white p-4">
                  <p className="text-xs text-zinc-500 mb-1">租户</p>
                  <p className="font-semibold text-pine-900">{selectedTenant?.name ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-pine-100 bg-white p-4">
                  <p className="text-xs text-zinc-500 mb-1">房间</p>
                  <p className="font-semibold text-pine-900">
                    {selectedRoom ? `${selectedRoom.building?.name} ${selectedRoom.unitNumber}` : "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-pine-100 bg-white p-4">
                  <p className="text-xs text-zinc-500 mb-1">账期</p>
                  <p className="font-semibold text-pine-900">{form.period || "-"}</p>
                </div>
                <div className="rounded-xl border border-pine-100 bg-white p-4">
                  <p className="text-xs text-zinc-500 mb-1">到期日</p>
                  <p className="font-semibold text-pine-900">{form.dueDate || "-"}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>费用项</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-zinc-800">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                      <TableCell className="text-right font-serif">{formatCurrency(Number(item.amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-semibold">合计</TableCell>
                    <TableCell className="text-right font-serif text-xl font-bold text-pine-900">{formatCurrency(totalAmount)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              <Separator className="my-8" />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="h-4 w-4" />上一步
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending || totalAmount <= 0}>
                  <Check className="h-4 w-4" />
                  {createMutation.isPending ? "生成中..." : "生成账单"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
