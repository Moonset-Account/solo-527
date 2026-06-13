"use client";
import { useState } from "react";
import { trpc } from "@/lib/provider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Building2, Home, Users, Wrench, Edit3, Check } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  VACANT: { label: "空置", color: "text-zinc-600", bg: "bg-zinc-100", border: "border-zinc-300", icon: Home },
  OCCUPIED: { label: "已租", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", icon: Users },
  MAINTENANCE: { label: "维修", color: "text-red-700", bg: "bg-red-50", border: "border-red-300", icon: Wrench },
};

export default function RoomsPage() {
  const { data: rooms, refetch } = trpc.room.list.useQuery();
  const utils = trpc.useUtils();
  const priceMutation = trpc.room.updatePrice.useMutation({
    onSuccess: () => { utils.room.list.invalidate(); setEditRoom(null); },
  });

  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editRoom, setEditRoom] = useState<any>(null);
  const [newPrice, setNewPrice] = useState("");

  const buildings = rooms ? Array.from(new Set(rooms.map((r: any) => r.building.name))) : [];
  const filtered = (rooms || []).filter((r: any) => {
    if (selectedBuilding !== "all" && r.building.name !== selectedBuilding) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const grouped: Record<string, Record<string, any[]>> = {};
  filtered.forEach((r: any) => {
    const b = r.building.name;
    const f = r.floor;
    if (!grouped[b]) grouped[b] = {};
    if (!grouped[b][f]) grouped[b][f] = [];
    grouped[b][f].push(r);
  });

  const counts = rooms ? {
    total: rooms.length,
    occupied: rooms.filter((r: any) => r.status === "OCCUPIED").length,
    vacant: rooms.filter((r: any) => r.status === "VACANT").length,
    maintenance: rooms.filter((r: any) => r.status === "MAINTENANCE").length,
  } : { total: 0, occupied: 0, vacant: 0, maintenance: 0 };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="房态管理"
        description="查看园区房间状态、定价与入驻情况"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="card-border-left-green">
          <CardContent className="pt-5">
            <p className="text-xs text-zinc-500">房间总数</p>
            <p className="font-serif text-3xl font-bold text-pine-800 mt-1">{counts.total}</p>
          </CardContent>
        </Card>
        <Card className="card-border-left-emerald">
          <CardContent className="pt-5">
            <p className="text-xs text-zinc-500">已租</p>
            <p className="font-serif text-3xl font-bold text-emerald-600 mt-1">{counts.occupied}</p>
          </CardContent>
        </Card>
        <Card className="card-border-left-amber">
          <CardContent className="pt-5">
            <p className="text-xs text-zinc-500">空置</p>
            <p className="font-serif text-3xl font-bold text-zinc-600 mt-1">{counts.vacant}</p>
          </CardContent>
        </Card>
        <Card className="card-border-left-red">
          <CardContent className="pt-5">
            <p className="text-xs text-zinc-500">维修中</p>
            <p className="font-serif text-3xl font-bold text-red-600 mt-1">{counts.maintenance}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-border-left-green">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Label className="w-14">楼栋</Label>
              <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部楼栋</SelectItem>
                  {buildings.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-14">状态</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="VACANT">空置</SelectItem>
                  <SelectItem value="OCCUPIED">已租</SelectItem>
                  <SelectItem value="MAINTENANCE">维修中</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-zinc-200 border border-zinc-300" />空置</div>
              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" />已租</div>
              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-100 border border-red-300" />维修中</div>
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(grouped).map(([building, floors]) => (
              <div key={building}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-pine-100">
                  <Building2 className="h-5 w-5 text-pine-800" />
                  <h3 className="font-serif text-xl font-semibold text-pine-900">{building}</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(floors).sort((a, b) => Number(a[0]) - Number(b[0])).map(([floor, rooms]) => (
                    <div key={floor} className="flex items-start gap-4">
                      <div className="w-16 shrink-0 pt-2 text-right">
                        <p className="text-sm font-semibold text-pine-800">{floor}F</p>
                        <p className="text-xs text-zinc-400">{rooms.length}间</p>
                      </div>
                      <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {rooms.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber)).map((room: any, i: number) => {
                          const cfg = statusConfig[room.status];
                          const Icon = cfg.icon;
                          return (
                            <div
                              key={room.id}
                              className={`group relative rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${cfg.border} ${cfg.bg} animate-slide-up`}
                              style={{ animationDelay: `${i * 20}ms` }}
                              onClick={() => { setEditRoom(room); setNewPrice(String(room.price)); }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-zinc-700">{room.unitNumber}</span>
                                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                              </div>
                              <p className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</p>
                              <p className="text-[11px] text-zinc-500 mt-1">{room.area}㎡</p>
                              <div className="absolute inset-0 rounded-lg bg-pine-900/0 group-hover:bg-pine-900/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 className="h-4 w-4 text-pine-800" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div className="text-center text-zinc-400 py-16">暂无符合条件的房间</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editRoom} onOpenChange={(o) => !o && setEditRoom(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>房间价格设置</DialogTitle></DialogHeader>
          {editRoom && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-pine-50 p-4">
                <p className="text-sm font-semibold text-pine-900">{editRoom.building?.name} · {editRoom.unitNumber}</p>
                <p className="text-xs text-zinc-600 mt-1">楼层 {editRoom.floor}F · 面积 {editRoom.area}㎡</p>
                <Badge variant={editRoom.status === "OCCUPIED" ? "success" : editRoom.status === "MAINTENANCE" ? "destructive" : "outline"} className="mt-2">{statusConfig[editRoom.status].label}</Badge>
                {editRoom.tenant && <p className="text-xs text-zinc-600 mt-2">使用方：{editRoom.tenant.name}</p>}
              </div>
              <div>
                <Label>单价（元/㎡·月）</Label>
                <Input className="mt-1" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                <p className="text-xs text-zinc-500 mt-2">月租估算：{formatCurrency(Number(newPrice || 0) * editRoom.area)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoom(null)}>取消</Button>
            <Button onClick={() => editRoom && priceMutation.mutate({ id: editRoom.id, price: Number(newPrice) })}>
              <Check className="h-4 w-4" />确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
