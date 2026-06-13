"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Phone, Mail, Briefcase, Building2, Users } from "lucide-react";
import Link from "next/link";

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const { data: tenants, refetch } = trpc.tenant.list.useQuery({ search });
  const utils = trpc.useUtils();
  const createMutation = trpc.tenant.create.useMutation({
    onSuccess: () => { utils.tenant.list.invalidate(); setOpen(false); },
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", industry: "" });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="租户档案"
        description="管理园区所有入驻企业的档案资料"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />新增租户</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>新增租户</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>企业名称 *</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>联系人 *</Label><Input className="mt-1" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
                  <div><Label>联系电话 *</Label><Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>邮箱</Label><Input className="mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><Label>所属行业</Label><Input className="mt-1" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.contact || !form.phone}>确认新增</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="card-border-left-green">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input className="pl-10" placeholder="搜索企业名称/联系人/电话..." value={search} onChange={(e) => { setSearch(e.target.value); refetch(); }} />
            </div>
            <Badge variant="outline">{tenants?.length ?? 0} 家企业</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tenants?.map((t: any, i: number) => (
              <Link
                key={t.id}
                href={`/tenants/${t.id}`}
                className="group rounded-xl border border-pine-100 bg-white p-5 hover:shadow-md hover:border-pine-300 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pine-800 to-pine-600 text-white font-serif text-xl font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <Badge variant={t.status === "ACTIVE" ? "success" : "outline"} className="text-xs">
                    {t.status === "ACTIVE" ? "入驻中" : "已迁出"}
                  </Badge>
                </div>
                <h3 className="font-serif text-lg font-semibold text-pine-900 group-hover:text-pine-700">{t.name}</h3>
                {t.industry && (
                  <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />{t.industry}
                  </p>
                )}
                <div className="mt-4 space-y-1.5 text-xs text-zinc-600">
                  <div className="flex items-center gap-2"><Users className="h-3 w-3 text-pine-700" />{t.contact}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-pine-700" />{t.phone}</div>
                  {t.rooms?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-pine-700" />
                      {t.rooms.map((r: any) => r.unitNumber).join(", ")}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-pine-100 text-xs text-zinc-400">
                  档案创建于 {formatDate(t.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
