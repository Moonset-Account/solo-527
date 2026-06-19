"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, X } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/trpc/client";
import {
  ALERT_SEVERITY_LABELS,
  ALERT_STATUS_LABELS,
  ASSET_STATUS_LABELS,
  ASSET_TYPE_LABELS,
  INSPECTION_STATUS_LABELS,
  ROLLBACK_STATUS_LABELS,
  VULN_SEVERITY_LABELS,
  VULN_STATUS_LABELS,
} from "@/lib/label-maps";
import { formatDateTime, safeParseJson } from "@/lib/utils";
import Link from "next/link";

type Params = { params: { id: string } };

export default function AssetDetailPage(_: Params) {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const query = api.asset.get.useQuery({ id });
  const meQuery = api.user.me.useQuery();
  const canWrite =
    meQuery.data?.role === "ADMIN" || meQuery.data?.role === "IT_MANAGER";
  const utils = api.useUtils();

  const createCfg = api.configItem.create.useMutation();
  const updateCfg = api.configItem.update.useMutation();
  const deleteCfg = api.configItem.delete.useMutation();

  const [cfgEditing, setCfgEditing] = useState<string | null>(null);
  const [cfgForm, setCfgForm] = useState({
    id: "",
    category: "",
    key: "",
    value: "",
    description: "",
    version: "",
  });
  const [showNewCfg, setShowNewCfg] = useState(false);
  const [newCfg, setNewCfg] = useState({
    category: "",
    key: "",
    value: "",
    description: "",
    version: "",
  });

  if (query.isLoading) return <div className="card p-8 text-center">加载中…</div>;
  if (!query.data) return <div className="card p-8 text-center">未找到</div>;
  const a = query.data;

  const startEditCfg = (c: (typeof a.configItems)[number]) => {
    setCfgEditing(c.id);
    setCfgForm({
      id: c.id,
      category: c.category,
      key: c.key,
      value: c.value ?? "",
      description: c.description ?? "",
      version: c.version ?? "",
    });
  };

  const submitEditCfg = async () => {
    if (!cfgEditing) return;
    await updateCfg.mutateAsync({
      id: cfgEditing,
      data: {
        category: cfgForm.category,
        key: cfgForm.key,
        value: cfgForm.value || null,
        description: cfgForm.description || null,
        version: cfgForm.version || null,
      },
    });
    await utils.asset.get.invalidate({ id });
    setCfgEditing(null);
  };

  const submitNewCfg = async () => {
    await createCfg.mutateAsync({
      assetId: id,
      category: newCfg.category,
      key: newCfg.key,
      value: newCfg.value || null,
      description: newCfg.description || null,
      version: newCfg.version || null,
    });
    await utils.asset.get.invalidate({ id });
    setShowNewCfg(false);
    setNewCfg({ category: "", key: "", value: "", description: "", version: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/assets")}
        >
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <h1 className="page-title">{a.name}</h1>
        <span className={ASSET_STATUS_LABELS[a.status].cls}>
          {ASSET_STATUS_LABELS[a.status].label}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="section-title">基本信息</div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-slate-500">资产类型</dt>
            <dd className="text-slate-800">{ASSET_TYPE_LABELS[a.type]}</dd>
            <dt className="text-slate-500">IP 地址</dt>
            <dd className="text-slate-800">{a.ipAddress ?? "-"}</dd>
            <dt className="text-slate-500">主机名</dt>
            <dd className="text-slate-800">{a.hostname ?? "-"}</dd>
            <dt className="text-slate-500">所在地</dt>
            <dd className="text-slate-800">{a.location ?? "-"}</dd>
            <dt className="text-slate-500">负责人</dt>
            <dd className="text-slate-800">
              {a.owner?.name ?? a.owner?.email ?? "-"}
            </dd>
            <dt className="text-slate-500">创建时间</dt>
            <dd className="text-slate-800">{formatDateTime(a.createdAt)}</dd>
            <dt className="text-slate-500">描述</dt>
            <dd className="col-span-1 text-slate-800">
              {a.description ?? "-"}
            </dd>
          </dl>
        </div>
        <div className="card p-5">
          <div className="section-title">关联统计</div>
          <div className="space-y-2 text-sm">
            <StatRow label="告警" value={a.alerts.length} />
            <StatRow label="配置项" value={a.configItems.length} />
            <StatRow label="漏洞" value={a.vulnerabilities.length} />
            <StatRow label="巡检记录" value={a.inspections.length} />
            <StatRow label="回滚方案" value={a.rollbackPlans.length} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="section-title mb-0">配置项 ({a.configItems.length})</div>
          {canWrite && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowNewCfg(true)}
            >
              <Plus className="h-4 w-4" /> 新增配置项
            </button>
          )}
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>分类</th>
                <th>键名</th>
                <th>值</th>
                <th>版本</th>
                <th>描述</th>
                <th>最近修改</th>
                {canWrite && <th className="text-right">操作</th>}
              </tr>
            </thead>
            <tbody>
              {a.configItems.length === 0 && (
                <tr>
                  <td
                    colSpan={canWrite ? 7 : 6}
                    className="py-6 text-center text-slate-400"
                  >
                    暂无配置项
                  </td>
                </tr>
              )}
              {a.configItems.map((c) => (
                <tr key={c.id}>
                  {cfgEditing === c.id ? (
                    <>
                      <td>
                        <input
                          className="h-8 w-28"
                          value={cfgForm.category}
                          onChange={(e) =>
                            setCfgForm({ ...cfgForm, category: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="h-8 w-32"
                          value={cfgForm.key}
                          onChange={(e) =>
                            setCfgForm({ ...cfgForm, key: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="h-8 w-full"
                          value={cfgForm.value}
                          onChange={(e) =>
                            setCfgForm({ ...cfgForm, value: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="h-8 w-20"
                          value={cfgForm.version}
                          onChange={(e) =>
                            setCfgForm({ ...cfgForm, version: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="h-8 w-full"
                          value={cfgForm.description}
                          onChange={(e) =>
                            setCfgForm({
                              ...cfgForm,
                              description: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="text-slate-400">-</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="btn-success h-7 px-2 text-xs"
                            onClick={submitEditCfg}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary h-7 px-2 text-xs"
                            onClick={() => setCfgEditing(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{c.category}</td>
                      <td className="font-mono text-xs">{c.key}</td>
                      <td className="font-mono text-xs text-slate-700">
                        {c.value ?? "-"}
                      </td>
                      <td className="text-xs">{c.version ?? "-"}</td>
                      <td>{c.description ?? "-"}</td>
                      <td className="text-xs">
                        {formatDateTime(c.lastModifiedAt)}
                      </td>
                      {canWrite && (
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className="btn-secondary h-7 px-2 text-xs"
                              onClick={() => startEditCfg(c)}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              className="btn-danger h-7 px-2 text-xs"
                              onClick={async () => {
                                if (confirm("确定删除此配置项？")) {
                                  await deleteCfg.mutateAsync({ id: c.id });
                                  await utils.asset.get.invalidate({ id });
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showNewCfg && (
          <div className="mt-4 border-t pt-4">
            <div className="mb-2 text-sm font-semibold">新增配置项</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <input
                placeholder="分类"
                value={newCfg.category}
                onChange={(e) => setNewCfg({ ...newCfg, category: e.target.value })}
              />
              <input
                placeholder="键名"
                value={newCfg.key}
                onChange={(e) => setNewCfg({ ...newCfg, key: e.target.value })}
              />
              <input
                placeholder="值"
                value={newCfg.value}
                onChange={(e) => setNewCfg({ ...newCfg, value: e.target.value })}
              />
              <input
                placeholder="版本"
                value={newCfg.version}
                onChange={(e) => setNewCfg({ ...newCfg, version: e.target.value })}
              />
              <input
                placeholder="描述"
                value={newCfg.description}
                onChange={(e) =>
                  setNewCfg({ ...newCfg, description: e.target.value })
                }
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowNewCfg(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!newCfg.category || !newCfg.key}
                onClick={submitNewCfg}
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="section-title">最新告警 ({a.alerts.length})</div>
          <div className="space-y-2 text-sm">
            {a.alerts.length === 0 && <Empty />}
            {a.alerts.map((al) => (
              <Link
                key={al.id}
                href={`/alerts/${al.id}`}
                className="block rounded-md border border-slate-100 p-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <span className={ALERT_SEVERITY_LABELS[al.severity].cls}>
                    {ALERT_SEVERITY_LABELS[al.severity].label}
                  </span>
                  <span className="font-medium">{al.title}</span>
                  <span className="ml-auto text-xs text-slate-500">
                    {formatDateTime(al.createdAt)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {al.assignee?.name ?? "未指派"} ·{" "}
                  <span className={ALERT_STATUS_LABELS[al.status].cls}>
                    {ALERT_STATUS_LABELS[al.status].label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="section-title">漏洞 ({a.vulnerabilities.length})</div>
          <div className="space-y-2 text-sm">
            {a.vulnerabilities.length === 0 && <Empty />}
            {a.vulnerabilities.map((v) => (
              <div
                key={v.id}
                className="rounded-md border border-slate-100 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className={VULN_SEVERITY_LABELS[v.severity].cls}>
                    {VULN_SEVERITY_LABELS[v.severity].label}
                  </span>
                  <span className="font-medium">{v.title}</span>
                  <span className={VULN_STATUS_LABELS[v.status].cls}>
                    {VULN_STATUS_LABELS[v.status].label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {v.cveId ?? "无CVE"} · 发现 {formatDate(v.discoveredAt)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="section-title">
            巡检记录 ({a.inspections.length})
          </div>
          <div className="space-y-2 text-sm">
            {a.inspections.length === 0 && <Empty />}
            {a.inspections.map((insp) => (
              <div
                key={insp.id}
                className="rounded-md border border-slate-100 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{insp.title}</span>
                  <span className={INSPECTION_STATUS_LABELS[insp.status].cls}>
                    {INSPECTION_STATUS_LABELS[insp.status].label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  计划：{formatDateTime(insp.scheduledAt)} · 结果：
                  {insp.result ?? "-"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="section-title">回滚方案 ({a.rollbackPlans.length})</div>
          <div className="space-y-2 text-sm">
            {a.rollbackPlans.length === 0 && <Empty />}
            {a.rollbackPlans.map((r) => (
              <div key={r.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.title}</span>
                  <span className={ROLLBACK_STATUS_LABELS[r.status].cls}>
                    {ROLLBACK_STATUS_LABELS[r.status].label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {r.changeReason ?? "未填写变更原因"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Empty() {
  return <div className="py-6 text-center text-slate-400">暂无数据</div>;
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "-";
  return formatDateTime(d).slice(0, 10);
}
