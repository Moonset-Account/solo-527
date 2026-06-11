"use client";

import { useState, useMemo } from "react";
import {
  Warehouse,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  Filter,
  Search,
  ArrowUpDown,
  Plus,
  Minus,
  PackageCheck,
  PackageX,
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge, DotIndicator } from "@/components/ui/StatusBadge";
import { formatDate, formatCurrency, formatRelativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";

export default function InventoryPage() {
  const { inventory, exportInventory } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"availableQuantity" | "inTransitQuantity" | "lastUpdated">(
    "availableQuantity"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredInventory = useMemo(() => {
    let result = [...inventory];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.siteName.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "availableQuantity") {
        comparison = a.availableQuantity - b.availableQuantity;
      } else if (sortField === "inTransitQuantity") {
        comparison = a.inTransitQuantity - b.inTransitQuantity;
      } else if (sortField === "lastUpdated") {
        comparison =
          new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [inventory, searchQuery, sortField, sortOrder]);

  const stats = useMemo(() => {
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.availableQuantity * (item.unitCost || 0),
      0
    );
    const lowStock = inventory.filter(
      (i) => i.availableQuantity < i.warningThreshold && i.availableQuantity > 0
    ).length;
    const outOfStock = inventory.filter((i) => i.availableQuantity <= 0).length;
    const totalItems = inventory.reduce((sum, i) => sum + i.availableQuantity, 0);

    return { totalValue, lowStock, outOfStock, totalItems };
  }, [inventory]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getStockStatus = (item: typeof inventory[0]) => {
    if (item.availableQuantity <= 0) {
      return { status: "outOfStock", label: "缺货", color: "danger", icon: <PackageX className="h-4 w-4" /> };
    }
    if (item.availableQuantity < item.warningThreshold) {
      return { status: "lowStock", label: "预警", color: "warning", icon: <AlertTriangle className="h-4 w-4" /> };
    }
    return { status: "normal", label: "充足", color: "success", icon: <PackageCheck className="h-4 w-4" /> };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">站点库存</h1>
          <p className="text-sm text-slate-500 mt-1">查询各站点商品库存状态和预警信息</p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportInventory(inventory)}
          leftIcon={<Download className="h-4 w-4" />}
        >
          导出库存
        </Button>
      </div>

      <FilterBar />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <Package className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-slate-100">{stats.totalItems.toLocaleString()}</p>
                <p className="text-xs text-slate-500">总库存数量</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-emerald-400">
                  {formatCurrency(stats.totalValue)}
                </p>
                <p className="text-xs text-slate-500">库存总价值</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning-900/30 to-warning-950/50 border border-warning-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-900/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-warning-400">{stats.lowStock}</p>
                <p className="text-xs text-slate-500">低库存预警</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-danger-900/30 to-danger-950/50 border border-danger-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger-900/50 flex items-center justify-center">
                <PackageX className="h-5 w-5 text-danger-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-danger-400">{stats.outOfStock}</p>
                <p className="text-xs text-slate-500">缺货商品</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>库存列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索商品名称、SKU、站点..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <tr className="border-b border-slate-700">
                  <TableHead>商品信息</TableHead>
                  <TableHead>站点</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-slate-200"
                    onClick={() => handleSort("availableQuantity")}
                  >
                    <div className="flex items-center gap-1">
                      可用库存
                      <ArrowUpDown
                        className={cn(
                          "h-3 w-3",
                          sortField === "availableQuantity" && "text-brand-500"
                        )}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-slate-200"
                    onClick={() => handleSort("inTransitQuantity")}
                  >
                    <div className="flex items-center gap-1">
                      在途库存
                      <ArrowUpDown
                        className={cn(
                          "h-3 w-3",
                          sortField === "inTransitQuantity" && "text-brand-500"
                        )}
                      />
                    </div>
                  </TableHead>
                  <TableHead>预警阈值</TableHead>
                  <TableHead>库存状态</TableHead>
                  <TableHead>单价</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-slate-200"
                    onClick={() => handleSort("lastUpdated")}
                  >
                    <div className="flex items-center gap-1">
                      最后更新
                      <ArrowUpDown
                        className={cn(
                          "h-3 w-3",
                          sortField === "lastUpdated" && "text-brand-500"
                        )}
                      />
                    </div>
                  </TableHead>
                  <TableHead>操作</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const stockPercentage =
                    item.warningThreshold > 0
                      ? (item.availableQuantity / item.warningThreshold) * 100
                      : 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              stockStatus.color === "danger"
                                ? "bg-danger-900/30 text-danger-400"
                                : stockStatus.color === "warning"
                                ? "bg-warning-900/30 text-warning-400"
                                : "bg-success-900/30 text-success-400"
                            )}
                          >
                            {stockStatus.icon}
                          </div>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-sm">{item.siteName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "text-lg font-bold font-display",
                              item.availableQuantity <= 0
                                ? "text-danger-500"
                                : item.availableQuantity < item.warningThreshold
                                ? "text-warning-500"
                                : "text-success-500"
                            )}
                          >
                            {item.availableQuantity}
                          </span>
                          <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                stockPercentage < 50
                                  ? "bg-danger-500"
                                  : stockPercentage < 100
                                  ? "bg-warning-500"
                                  : "bg-success-500"
                              )}
                              style={{ width: `${Math.min(stockPercentage, 200)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm text-blue-400">
                            {item.inTransitQuantity}
                          </span>
                          {item.inTransitQuantity > 0 && (
                            <span className="text-xs text-slate-500">
                              ({item.inTransitFrom})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.warningThreshold}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            stockStatus.status === "outOfStock"
                              ? "exception"
                              : stockStatus.status === "lowStock"
                              ? "pending"
                              : "completed"
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(item.unitCost || 0)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatRelativeTime(item.lastUpdated)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>库存预警明细</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventory
              .filter((i) => i.availableQuantity < i.warningThreshold)
              .slice(0, 6)
              .map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg border-l-2",
                      item.availableQuantity <= 0
                        ? "bg-danger-900/20 border-danger-500"
                        : "bg-warning-900/20 border-warning-500"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{item.productName}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {item.sku} · {item.siteName}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-lg font-bold font-display",
                          item.availableQuantity <= 0
                            ? "text-danger-500"
                            : "text-warning-500"
                        )}
                      >
                        {item.availableQuantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>预警阈值: {item.warningThreshold}</span>
                      <span>
                        缺口: {Math.max(0, item.warningThreshold - item.availableQuantity)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          item.availableQuantity <= 0 ? "bg-danger-500" : "bg-warning-500"
                        )}
                        style={{
                          width: `${Math.max(
                            0,
                            (item.availableQuantity / item.warningThreshold) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>在途商品</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventory
              .filter((i) => i.inTransitQuantity > 0)
              .slice(0, 6)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-blue-900/20 border-l-2 border-blue-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.sku} · {item.siteName}
                      </p>
                    </div>
                    <span className="text-lg font-bold font-display text-blue-400">
                      +{item.inTransitQuantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      来源: {item.inTransitFrom}
                    </span>
                    <span className="text-blue-400">
                      预计 {formatDate(item.inTransitEstimatedArrival, "MM-dd")}
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
