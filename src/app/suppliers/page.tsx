"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useSuppliers } from "@/hooks/useApi";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SuppliersPage() {
  const { data: suppliers, loading } = useSuppliers(true);

  const suppliersWithStats = (suppliers || [])
    .slice()
    .sort((a: any, b: any) => b.repeatRate - a.repeatRate);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-slate-600">正在加载供应商数据...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            供应商管理
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {suppliersWithStats.length} 家合作供应商（数据已缓存）
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {suppliersWithStats.map((supplier: any, idx: number) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="card card-hover p-5 block"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{supplier.name}</h3>
                  <p className="text-xs text-slate-500">联系人: {supplier.contact}</p>
                </div>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    idx === 0
                      ? "bg-red-500"
                      : idx === 1
                      ? "bg-orange-500"
                      : idx === 2
                      ? "bg-yellow-500"
                      : "bg-slate-300"
                  }`}
                >
                  {idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">复修率</p>
                  <p className="text-lg font-bold text-orange-600">
                    {supplier.repeatRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">平均响应</p>
                  <p className="text-lg font-bold text-slate-900">
                    {supplier.avgResponseTime}分
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">超时数</p>
                  <p className="text-lg font-bold text-red-600">
                    {supplier.timeoutCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">平均评分</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {supplier.avgRating}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">总工单</span>
                  <span className="font-medium text-slate-700">
                    {supplier.totalOrders} 单
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
