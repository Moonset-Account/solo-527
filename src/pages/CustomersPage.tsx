"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badges";
import { CustomerModal } from "@/components/ui/CustomerModal";

export default function CustomersPage() {
  const { page, pageSize, setPage } = usePagination(15);
  const [keyword, setKeyword] = useState("");
  const [source, setSource] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showNew, setShowNew] = useState(false);

  const { data: tags } = api.tag.list.useQuery();
  const { data, isLoading, refetch } = api.customer.list.useQuery({
    page,
    pageSize,
    keyword: keyword || undefined,
    source: source || undefined,
    tagIds: selectedTags.length ? selectedTags : undefined,
  });

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end flex-1">
          <div className="flex-1 min-w-[240px]">
            <label className="label">搜索</label>
            <input
              className="input"
              placeholder="输入客户姓名或手机号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">来源</label>
            <select
              className="input w-36"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="到店">到店</option>
              <option value="美团">美团</option>
              <option value="大众点评">大众点评</option>
              <option value="抖音">抖音</option>
              <option value="朋友介绍">朋友介绍</option>
              <option value="电话营销">电话营销</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setKeyword("");
              setSource("");
              setSelectedTags([]);
              setPage(1);
            }}
          >
            重置
          </button>
        </div>
        <button className="btn-dental" onClick={() => setShowNew(true)}>
          + 新增客户
        </button>
      </div>

      {tags?.length ? (
        <div className="card p-3 flex flex-wrap gap-2">
          <span className="text-sm text-slate-500 mr-2 self-center">标签筛选：</span>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTag(t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedTags.includes(t.id)
                  ? "text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={selectedTags.includes(t.id) ? { backgroundColor: t.color } : {}}
            >
              {t.name} ({t._count.customers})
            </button>
          ))}
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">姓名</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">联系电话</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">标签</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">来源</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">咨询</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">线索</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">回款单</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">最近操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">加载中…</td></tr>
            ) : !data?.list.length ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">暂无客户数据</td></tr>
            ) : (
              data.list.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.id}`} className="font-medium text-primary-700 hover:underline">
                      {c.name}
                    </Link>
                    {c.gender && <span className="ml-2 text-xs text-slate-500">{c.gender} {c.age ?? ""}岁</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.phone}</td>
                  <td className="px-4 py-3">
                    {c.tags.length ? (
                      c.tags.map((t) => (
                        <span
                          key={t.tag.id}
                          className="text-xs px-2 py-0.5 rounded-full text-white mr-1 mb-1 inline-block"
                          style={{ backgroundColor: t.tag.color }}
                        >
                          {t.tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.source ? <Badge variant="info">{c.source}</Badge> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{c._count.consultations}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{c._count.leads}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{c._count.payments}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          total={data?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onChange={setPage}
        />
      </div>

      <CustomerModal
        open={showNew}
        onClose={() => setShowNew(false)}
        tags={tags ?? []}
        onDone={() => {
          setShowNew(false);
          refetch();
        }}
      />
    </div>
  );
}
