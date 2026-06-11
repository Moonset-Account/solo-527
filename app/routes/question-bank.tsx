import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  History,
  Plus,
  Search,
  Tag,
  ToggleLeft,
  ToggleRight,
  Zap,
  Hash,
} from "lucide-react";
import { listBanks, listVersions } from "@/server/services/questionBankService";
import { ClassInfoModel } from "@/server/models/ClassInfo";
import type { ClassInfo, QuestionBank, QuestionBankVersion, User } from "@/shared/types";
import { cn } from "@/shared/utils";

export async function loader({ context }: LoaderFunctionArgs) {
  const user = (context as any).user as User | null;
  if (!user) return redirect("/login");
  if (user.role === "operator") return redirect("/reports");
  const [banks, versions, classes] = await Promise.all([
    listBanks().catch(() => [] as QuestionBank[]),
    listVersions().catch(() => [] as QuestionBankVersion[]),
    (ClassInfoModel as any).find().lean().catch(() => [] as any),
  ]);
  return json({
    banks,
    versions,
    classes: (classes as any[]).map((c) => ({ ...c, id: c._id.toString() })) as ClassInfo[],
  });
}

export default function QuestionBankPage() {
  const data = useLoaderData<typeof loader>();
  const [expanded, setExpanded] = useState<string | null>(data.banks[0]?.id || null);
  const [q, setQ] = useState("");

  const filteredBanks = useMemo(() => {
    if (!q) return data.banks;
    return data.banks.filter((b) => b.name.includes(q) || b.subject.includes(q));
  }, [data.banks, q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpenCheck className="w-6 h-6 text-slate-800" />题库版本管理
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            消课时自动关联当前课次绑定的版本，操作留痕同步写入报表便于溯源
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索题库…"
              className="input h-9 pl-8 text-xs pr-3 w-52"
            />
          </div>
          <button className="btn-outline btn-sm">
            <History className="w-3.5 h-3.5" />版本对比
          </button>
          <button className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />新建版本
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCard label="题库总数" value={data.banks.length.toString()} unit="套" icon={<BookOpenCheck className="w-4 h-4" />} bg="bg-slate-800" fg="text-white" />
        <StatCard label="版本总数" value={data.versions.length.toString()} unit="个" icon={<Tag className="w-4 h-4" />} bg="bg-white" fg="text-slate-800" />
        <StatCard
          label="启用版本"
          value={data.versions.filter((v) => v.isActive).length.toString()}
          unit="个"
          icon={<Zap className="w-4 h-4" />}
          bg="bg-white"
          fg="text-slate-800"
        />
        <StatCard label="绑定班级" value={(new Set(data.versions.flatMap((v) => v.classIds || []))).size.toString()} unit="个" icon={<Hash className="w-4 h-4" />} bg="bg-white" fg="text-slate-800" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">题库列表</div>
          <span className="text-[11px] text-slate-500">共 {filteredBanks.length} 套</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredBanks.length === 0 && (
            <div className="p-10 text-center text-xs text-slate-400">暂无匹配的题库</div>
          )}
          {filteredBanks.map((b) => {
            const versions = data.versions.filter((v) => v.bankId === b.id);
            const isExpanded = expanded === b.id;
            return (
              <div key={b.id}>
                <div
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : b.id)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                  <div className="w-10 h-10 rounded-lg2 bg-slate-800/10 border border-slate-800/15 flex items-center justify-center shrink-0">
                    <BookOpenCheck className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">{b.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">学科 {b.subject} · 共 {versions.length} 个版本</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {versions.filter((v) => v.isActive).slice(0, 2).map((v) => (
                      <span key={v.id} className="chip-green">{v.version}</span>
                    ))}
                    {versions.filter((v) => v.isActive).length === 0 && (
                      <span className="chip-gray">无启用版本</span>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="bg-slate-50/40 border-t border-slate-100 p-4 pl-16">
                    {versions.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-6">该题库暂无版本，点击右上角新建</div>
                    ) : (
                      <div className="space-y-2">
                        {versions.map((v) => (
                          <VersionRow key={v.id} v={v} classes={data.classes} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VersionRow({ v, classes }: { v: QuestionBankVersion; classes: ClassInfo[] }) {
  const bound = (v.classIds || []).map((id) => classes.find((c) => c.id === id)?.name).filter(Boolean);
  return (
    <div className={cn(
      "rounded-lg2 border bg-white p-3.5 flex items-start gap-3 transition-all",
      v.isActive ? "border-mint-500/25" : "border-slate-200 opacity-80"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-lg2 shrink-0 flex items-center justify-center font-black font-nums",
        v.isActive ? "bg-mint-500/10 text-mint-600" : "bg-slate-100 text-slate-400"
      )}>
        {v.version.replace(/\D/g, "").slice(0, 2) || "v"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-black text-slate-900 tracking-tight">{v.version}</span>
          {v.isActive ? (
            <span className="chip-green flex items-center gap-1">
              <ToggleRight className="w-3 h-3" />已启用
            </span>
          ) : (
            <span className="chip-gray flex items-center gap-1">
              <ToggleLeft className="w-3 h-3" />已停用
            </span>
          )}
          <span className="chip-gray text-[10px]">发布于 {v.publishedAt.slice(0, 10)}</span>
        </div>
        <div className="text-[11px] text-slate-500">
          <span className="text-slate-400">绑定班级：</span>
          {bound.length === 0 ? (
            <span className="text-slate-400">暂未绑定</span>
          ) : (
            <span>
              {bound.map((n, i) => (
                <span key={i} className="inline-block mr-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {n}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button className="btn-outline btn-sm">编辑</button>
        <button className={cn("btn-sm btn", v.isActive ? "btn-outline" : "btn-success")}>
          {v.isActive ? "停用" : "启用"}
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, unit, bg, fg,
}: {
  icon: React.ReactNode; label: string; value: string; unit: string; bg: string; fg: string;
}) {
  return (
    <div className={cn(
      "p-4 rounded-lg2 border shadow-card flex items-center gap-3 overflow-hidden",
      bg, bg.includes("white") ? "border-slate-200" : "border-transparent"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-lg2 flex items-center justify-center shrink-0",
        bg.includes("white") ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-xs font-medium truncate", fg, !bg.includes("white") && "opacity-80")}>{label}</div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={cn("text-2xl font-black font-nums tracking-tight", fg)}>{value}</span>
          <span className={cn("text-xs font-medium", fg, !bg.includes("white") && "opacity-70")}>{unit}</span>
        </div>
      </div>
    </div>
  );
}
