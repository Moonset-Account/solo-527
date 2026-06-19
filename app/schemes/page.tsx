'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Package,
  CheckSquare,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, Button, StatusBadge } from '@/components/ui';
import { mockSchemes } from '@/lib/mockData';
import type { DecorationScheme } from '@/lib/types';

export default function SchemesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">装修方案库</h1>
          <p className="mt-1 text-sm text-zinc-500">
            管理各类装修方案的标准节点、材料清单与施工规范
          </p>
        </div>
        <Button>新建方案</Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {mockSchemes.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            scheme={scheme}
            expanded={expandedId === scheme.id}
            onToggle={() => toggleExpand(scheme.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SchemeCardProps {
  scheme: DecorationScheme;
  expanded: boolean;
  onToggle: () => void;
}

function SchemeCard({ scheme, expanded, onToggle }: SchemeCardProps) {
  const nodeCount = scheme.standard_nodes.length;
  const materialCount = scheme.material_list.length;
  const standardCount = Object.keys(scheme.construction_standards).length;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-zinc-900">
              {scheme.name}
            </h3>
            <StatusBadge status={scheme.is_active ? 'completed' : 'pending'}>
              {scheme.is_active ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  启用
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  停用
                </span>
              )}
            </StatusBadge>
          </div>
          <p className="mt-2 text-sm text-zinc-600">{scheme.description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-zinc-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Layers className="h-3.5 w-3.5" />
            节点数
          </div>
          <div className="mt-1 text-lg font-semibold text-zinc-900">
            {nodeCount}
          </div>
        </div>
        <div className="rounded-md bg-zinc-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Package className="h-3.5 w-3.5" />
            材料种类
          </div>
          <div className="mt-1 text-lg font-semibold text-zinc-900">
            {materialCount}
          </div>
        </div>
        <div className="rounded-md bg-zinc-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CheckSquare className="h-3.5 w-3.5" />
            施工标准
          </div>
          <div className="mt-1 text-lg font-semibold text-zinc-900">
            {standardCount}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {expanded ? (
            <>
              收起详情 <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              查看详情 <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            编辑
          </Button>
          <Button variant="secondary" size="sm">
            复制
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-5 border-t border-zinc-100 pt-4 animate-fade-in-up">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-zinc-900">
              标准节点
            </h4>
            <div className="space-y-2">
              {scheme.standard_nodes.map((node, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-zinc-700">{node.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {node.duration_days} 天
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-zinc-900">
              材料清单
            </h4>
            <div className="overflow-hidden rounded-md border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-left text-xs font-medium text-zinc-500">
                    <th className="px-3 py-2">材料名称</th>
                    <th className="px-3 py-2">品牌</th>
                    <th className="px-3 py-2 text-right">单位</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {scheme.material_list.map((mat, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-zinc-700">{mat.name}</td>
                      <td className="px-3 py-2 text-zinc-600">{mat.brand}</td>
                      <td className="px-3 py-2 text-right text-zinc-600">
                        {mat.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-zinc-900">
              施工标准
            </h4>
            <div className="space-y-2">
              {Object.entries(scheme.construction_standards).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start gap-3 rounded-md bg-zinc-50 px-3 py-2"
                  >
                    <span className="inline-flex shrink-0 items-center rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {key}
                    </span>
                    <span className="text-sm text-zinc-700">{value}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
