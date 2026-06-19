"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { ListPageTemplate } from "@/components/lists/ListPageTemplate";
import { AssetModal } from "@/components/modals/AssetModal";
import {
  ASSET_STATUS_LABELS,
  ASSET_TYPE_LABELS,
  enumOptions,
} from "@/lib/label-maps";
import { formatDateTime, truncate } from "@/lib/utils";
import type { Asset, AssetStatus, AssetType, User } from "@prisma/client";

type Row = Asset & {
  owner: Pick<User, "id" | "name" | "email" | "role"> | null;
  _count: { alerts: number; vulnerabilities: number; inspections: number; rollbackPlans: number; configItems: number };
};

export default function AssetsPage() {
  const router = useRouter();
  const usersQuery = api.user.list.useQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const meQuery = api.user.me.useQuery();
  const canWrite = meQuery.data?.role === "ADMIN" || meQuery.data?.role === "IT_MANAGER";
  const canDelete = meQuery.data?.role === "ADMIN";
  const deleteMutation = api.asset.delete.useMutation();
  const utils = api.useUtils();

  return (
    <>
      <ListPageTemplate<Row, Record<string, unknown>>
        title="资产配置"
        description="维护服务器、网络设备等资产及其配置项。资产变更会记录操作日志。"
        createLabel="新增资产"
        canCreate={canWrite}
        onCreate={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        downloadBaseName="assets"
        defaultFilters={{ status: null, type: null, ownerId: null }}
        filters={[
          { key: "type", label: "资产类型", options: enumOptions(ASSET_TYPE_LABELS) },
          { key: "status", label: "状态", options: enumOptions(ASSET_STATUS_LABELS) },
          {
            key: "ownerId",
            label: "负责人",
            options: (usersQuery.data ?? []).map((u) => ({
              value: u.id,
              label: u.name ?? u.email,
            })),
          },
        ]}
        columns={[
          {
            key: "name",
            label: "资产名称",
            render: (r) => (
              <Link href={`/assets/${r.id}`} className="font-medium text-primary-700 hover:underline">
                {r.name}
              </Link>
            ),
          },
          { key: "type", label: "类型", render: (r) => ASSET_TYPE_LABELS[r.type] },
          {
            key: "status",
            label: "状态",
            render: (r) => (
              <span className={ASSET_STATUS_LABELS[r.status].cls}>
                {ASSET_STATUS_LABELS[r.status].label}
              </span>
            ),
            csvValue: (r) => ASSET_STATUS_LABELS[r.status].label,
          },
          { key: "ipAddress", label: "IP 地址" },
          { key: "hostname", label: "主机名" },
          {
            key: "owner",
            label: "负责人",
            render: (r) => r.owner?.name ?? r.owner?.email ?? "-",
            csvValue: (r) => r.owner?.name ?? r.owner?.email ?? "",
          },
          {
            key: "metrics",
            label: "关联项",
            render: (r) => (
              <div className="flex gap-2 text-xs">
                <span className="rounded bg-primary-50 px-1.5 py-0.5 text-primary-700">
                  告警 {r._count.alerts}
                </span>
                <span className="rounded bg-warning-50 px-1.5 py-0.5 text-warning-600">
                  漏洞 {r._count.vulnerabilities}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  配置 {r._count.configItems}
                </span>
              </div>
            ),
            csvValue: (r) =>
              `告警${r._count.alerts}/漏洞${r._count.vulnerabilities}/配置${r._count.configItems}`,
          },
          {
            key: "updatedAt",
            label: "更新时间",
            render: (r) => formatDateTime(r.updatedAt),
            csvValue: (r) => formatDateTime(r.updatedAt),
          },
          {
            key: "__actions",
            label: "操作",
            className: "text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                {canWrite && (
                  <button
                    type="button"
                    className="btn-secondary h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(r);
                      setModalOpen(true);
                    }}
                  >
                    编辑
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="btn-danger h-7 px-2 text-xs"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(`确定删除资产 ${r.name}？`)) {
                        await deleteMutation.mutateAsync({ id: r.id });
                        await utils.asset.list.invalidate();
                      }
                    }}
                  >
                    删除
                  </button>
                )}
              </div>
            ),
          },
        ]}
        exportHeaders={[
          { key: "name", label: "资产名称" },
          { key: "type", label: "类型" },
          { key: "status", label: "状态" },
          { key: "ipAddress", label: "IP 地址" },
          { key: "hostname", label: "主机名" },
          { key: "location", label: "所在地" },
          { key: "owner", label: "负责人" },
          { key: "metrics", label: "关联项统计" },
          { key: "description", label: "描述" },
          { key: "updatedAt", label: "更新时间" },
        ]}
        onRowClick={(r) => router.push(`/assets/${r.id}`)}
        query={(input) =>
          api.asset.list.useQuery(input, { keepPreviousData: true })
        }
        exportMutation={api.asset.export.useMutation()}
      />
      <AssetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
      />
    </>
  );
}
