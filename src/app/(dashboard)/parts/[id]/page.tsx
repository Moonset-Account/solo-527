"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/react";
import {
  Package,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  MapPin,
  DollarSign,
  BarChart3,
  History,
  Trash2,
  Edit2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PartDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "orders">(
    "overview"
  );

  const { data: part, isLoading, error } = trpc.part.get.useQuery({
    id: params.id,
  });

  const updateStock = trpc.part.updateStock.useMutation({
    onSuccess: () => {
      utils.part.get.invalidate({ id: params.id });
      utils.part.list.invalidate();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const deletePart = trpc.part.delete.useMutation({
    onSuccess: () => {
      utils.part.list.invalidate();
      router.push("/parts");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleStockAdjust = (type: "IN" | "OUT", amount: number) => {
    const changeAmount = type === "IN" ? amount : -amount;
    if (type === "OUT" && (part?.stock || 0) < amount) {
      alert("库存不足！");
      return;
    }
    if (confirm(`确定要${type === "IN" ? "入库" : "出库"} ${amount} 件吗？`)) {
      updateStock.mutate({
        id: params.id,
        change: changeAmount,
        type,
        note: type === "IN" ? "手动入库" : "手动出库",
      });
    }
  };

  const handleDelete = () => {
    if (confirm("确定要删除这个配件吗？此操作不可恢复。")) {
      deletePart.mutate({ id: params.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="space-y-6">
        <Link
          href="/parts"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          返回配件列表
        </Link>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">配件不存在或已被删除</p>
        </div>
      </div>
    );
  }

  const isLowStock = part.stock <= part.minStock;
  const margin = part.price - part.costPrice;
  const marginRate = ((margin / part.price) * 100).toFixed(1);
  const inventoryValue = part.stock * part.costPrice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/parts"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {part.name}
              </h1>
              <span className="font-mono text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                {part.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {part.category}
              </span>
              {isLowStock && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  库存预警
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStockAdjust("IN", 1)}
            disabled={updateStock.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            入库
          </button>
          <button
            onClick={() => handleStockAdjust("OUT", 1)}
            disabled={updateStock.isPending || part.stock <= 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <TrendingDown className="w-4 h-4" />
            出库
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4" />
            编辑
          </button>
          <button
            onClick={handleDelete}
            disabled={deletePart.isPending}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div
                className={`p-4 rounded-xl ${
                  isLowStock
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-emerald-100 dark:bg-emerald-900/30"
                }`}
              >
                <Package
                  className={`w-8 h-8 ${
                    isLowStock
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  当前库存
                </p>
                <p
                  className={`text-3xl font-bold font-mono ${
                    isLowStock
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {Number(part.stock).toLocaleString()}
                  <span className="text-sm font-normal text-slate-500 ml-1">
                    {part.unit}
                  </span>
                </p>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  安全库存
                </span>
                <span className="text-slate-900 dark:text-white font-mono">
                  {Number(part.minStock).toLocaleString()} {part.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  库存预警
                </span>
                <span
                  className={`font-medium ${
                    isLowStock
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isLowStock ? "需要补货" : "正常"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary-500" />
              价格信息
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  销售单价
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  ¥{Number(part.price).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  成本单价
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-mono">
                  ¥{Number(part.costPrice).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    单件毛利
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                    ¥{Number(margin).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    毛利率
                  </span>
                  <span
                    className={`font-bold font-mono ${
                      Number(marginRate) >= 20
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {marginRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              库存价值
            </h3>
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                总成本价值
              </p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                ¥{Number(inventoryValue).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                按成本价计算
              </p>
            </div>
          </div>

          {part.location && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                存放位置
              </h3>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {part.location}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  概览
                </button>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "inventory"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  库存变动记录 ({part.inventoryRecords?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "orders"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  关联工单 ({part.workOrderItems?.length || 0})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                      配件信息
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">
                          配件编码
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white font-mono">
                          {part.code}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">配件名称</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {part.name}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">分类</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {part.category}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">单位</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {part.unit}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                      快速操作
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button
                        onClick={() => handleStockAdjust("IN", 5)}
                        className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-left"
                      >
                        <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                        <p className="font-medium text-emerald-700 dark:text-emerald-400 text-sm">
                          入库 5 件
                        </p>
                      </button>
                      <button
                        onClick={() => handleStockAdjust("IN", 10)}
                        className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-left"
                      >
                        <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                        <p className="font-medium text-emerald-700 dark:text-emerald-400 text-sm">
                          入库 10 件
                        </p>
                      </button>
                      <button
                        onClick={() => handleStockAdjust("OUT", 1)}
                        disabled={part.stock < 1}
                        className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors text-left disabled:opacity-50"
                      >
                        <TrendingDown className="w-5 h-5 text-rose-600 mb-2" />
                        <p className="font-medium text-rose-700 dark:text-rose-400 text-sm">
                          出库 1 件
                        </p>
                      </button>
                      <Link
                        href={`/workorders/new?partId=${part.id}`}
                        className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-left"
                      >
                        <History className="w-5 h-5 text-primary-600 mb-2" />
                        <p className="font-medium text-primary-700 dark:text-primary-400 text-sm">
                          创建工单
                        </p>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "inventory" && (
                <div className="space-y-3">
                  {part.inventoryRecords?.length === 0 ? (
                    <div className="py-8 text-center">
                      <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        暂无库存变动记录
                      </p>
                    </div>
                  ) : (
                    (part.inventoryRecords || [])
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((record: any) => (
                        <div
                          key={record.id}
                          className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              record.type === "IN"
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "bg-rose-100 dark:bg-rose-900/30"
                            }`}
                          >
                            {record.type === "IN" ? (
                              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${
                                  record.type === "IN"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {record.type === "IN" ? "+" : "-"}
                                {Math.abs(record.change)}
                              </span>
                              <span className="text-slate-500 text-sm">
                                {record.type === "IN" ? "入库" : "出库"}
                              </span>
                              <span className="text-slate-400 text-sm">
                                结存: {record.balanceAfter}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {record.note}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-900 dark:text-white font-mono">
                              {new Date(
                                record.createdAt
                              ).toLocaleDateString("zh-CN")}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(record.createdAt).toLocaleTimeString(
                                "zh-CN",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {activeTab === "orders" && (
                <div className="space-y-3">
                  {part.workOrderItems?.length === 0 ? (
                    <div className="py-8 text-center">
                      <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        暂无关联工单
                      </p>
                    </div>
                  ) : (
                    (part.workOrderItems || [])
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.workOrder?.createdAt).getTime() -
                          new Date(a.workOrder?.createdAt).getTime()
                      )
                      .map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/workorders/${item.workOrderId}`}
                          className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white font-mono">
                                {item.workOrder?.orderNo}
                              </span>
                              <span className="text-xs text-slate-500">
                                {item.workOrder?.vehicle?.plateNumber}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                              {item.workOrder?.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {item.quantity} {part.unit}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              ¥{Number(item.subtotal).toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
