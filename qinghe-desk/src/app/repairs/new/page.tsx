"use client";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Paperclip, Upload, AlertTriangle, Building2, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewRepairPage() {
  const router = useRouter();
  const [form, setForm] = useState<{
    tenantId: string;
    roomId: string;
    urgency: "HIGH" | "MEDIUM" | "LOW";
    description: string;
  }>({
    tenantId: "",
    roomId: "",
    urgency: "MEDIUM",
    description: "",
  });
  const { data: tenants } = trpc.tenant.list.useQuery();
  const { data: rooms } = trpc.room.list.useQuery();
  const utils = trpc.useUtils();
  const createMut = trpc.repair.create.useMutation({
    onSuccess: () => {
      utils.repair.list.invalidate();
      router.push("/repairs");
    },
  });

  const filteredRooms = useMemo(() => {
    if (!form.tenantId) return rooms ?? [];
    return (rooms ?? []).filter((r: any) => r.tenantId === form.tenantId);
  }, [rooms, form.tenantId]);

  const canSubmit = form.tenantId && form.roomId && form.description.trim();

  return (
    <div className="animate-fade-in">
      <Link href="/repairs" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-pine-700 mb-4">
        <ArrowLeft className="h-4 w-4" />返回报修列表
      </Link>
      <PageHeader
        title="新建报修工单"
        description="录入工程报修信息，支持上传现场照片"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-border-left-red">
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>报修租户 <span className="text-red-500">*</span></Label>
                <Select
                  value={form.tenantId}
                  onValueChange={(v) => setForm({ ...form, tenantId: v, roomId: "" })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="选择租户" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-pine-700" />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>报修房间 <span className="text-red-500">*</span></Label>
                <Select
                  value={form.roomId}
                  onValueChange={(v) => setForm({ ...form, roomId: v })}
                  disabled={!form.tenantId}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={form.tenantId ? "选择房间" : "请先选择租户"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRooms.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-pine-700" />
                          {r.building?.name} · {r.unitNumber}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>紧急程度 <span className="text-red-500">*</span></Label>
              <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v as any })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="选择紧急程度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      紧急 - 需要立即响应处理
                    </div>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-amber-600" />
                      一般 - 正常排期处理
                    </div>
                  </SelectItem>
                  <SelectItem value="LOW">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                      不急 - 有空时安排处理
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>问题描述 <span className="text-red-500">*</span></Label>
              <Textarea
                className="mt-1.5"
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="请详细描述故障现象、具体位置、发生时间、影响范围等信息，方便工程人员快速定位和处理..."
              />
            </div>

            <div>
              <Label className="mb-1.5 block">现场附件</Label>
              <div className="rounded-lg border-2 border-dashed border-pine-200 p-10 text-center hover:border-pine-400 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-3 text-pine-700" />
                <Paperclip className="h-5 w-5 mx-auto mb-2 text-zinc-400" />
                <p className="text-sm font-medium text-zinc-700">拖拽文件到此处，或点击选择文件</p>
                <p className="text-xs text-zinc-500 mt-2">支持上传现场照片、视频等原始证据，用于复盘归档</p>
                <p className="text-xs text-zinc-400 mt-1">JPG, PNG, MP4, PDF · 单文件最大 50MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="card-border-left-amber">
            <CardContent className="pt-6 space-y-3 text-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">工单预览</p>
              <div className="flex justify-between">
                <span className="text-zinc-500">租户</span>
                <span className="font-medium text-zinc-800">
                  {tenants?.find((t: any) => t.id === form.tenantId)?.name ?? "未选择"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">房间</span>
                <span className="font-medium text-zinc-800">
                  {form.roomId
                    ? rooms?.find((r: any) => r.id === form.roomId)?.unitNumber
                    : "未选择"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">紧急程度</span>
                <span className={`font-medium ${
                  form.urgency === "HIGH" ? "text-red-700" :
                  form.urgency === "MEDIUM" ? "text-amber-700" : "text-emerald-700"
                }`}>
                  {form.urgency === "HIGH" ? "紧急" : form.urgency === "MEDIUM" ? "一般" : "不急"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">描述摘要</span>
                <p className="text-zinc-700 leading-relaxed">
                  {form.description || "（暂未填写）"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="sticky top-6">
            <Button
              className="w-full h-12 text-base"
              disabled={!canSubmit || createMut.isPending}
              onClick={() => createMut.mutate(form)}
            >
              <Send className="h-4 w-4 mr-2" />
              {createMut.isPending ? "提交中..." : "提交报修"}
            </Button>
            <p className="text-xs text-zinc-400 text-center mt-3">
              提交后将自动分派至工程组处理
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
