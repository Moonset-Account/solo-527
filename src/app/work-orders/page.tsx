"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import FilterBar from "@/components/FilterBar";
import WorkOrderTable from "@/components/WorkOrderTable";
import WorkOrderDetail from "@/components/WorkOrderDetail";
import { useWorkOrders, buildExportUrl } from "@/hooks/useApi";
import { FilterOptions, WorkOrder } from "@/types";
import { Loader2 } from "lucide-react";

export default function WorkOrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFilters = useMemo(() => {
    const params: FilterOptions = {};
    const buildingId = searchParams.get("buildingId");
    const roomType = searchParams.get("roomType");
    const repairType = searchParams.get("repairType");
    const supplierId = searchParams.get("supplierId");
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const isRepeat = searchParams.get("isRepeat");
    const isHoliday = searchParams.get("isHoliday");

    if (buildingId) params.buildingId = buildingId;
    if (roomType) params.roomType = roomType;
    if (repairType) params.repairType = repairType;
    if (supplierId) params.supplierId = supplierId;
    if (month) params.month = month;
    if (status) params.status = status as FilterOptions["status"];
    if (isRepeat !== null) params.isRepeat = isRepeat === "true";
    if (isHoliday !== null) params.isHoliday = isHoliday === "true";

    return params;
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const { data: workOrders, loading } = useWorkOrders(filters);
  const exportUrl = buildExportUrl(filters, "xlsx");

  const handleOrderClick = (order: WorkOrder) => {
    setSelectedOrder(order);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
    router.replace(`/work-orders?${params.toString()}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-slate-600">正在加载工单数据...</p>
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
            工单管理
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {workOrders?.length || 0} 条工单记录
            {Object.keys(filters).length > 0 && " (已筛选)"}
          </p>
        </div>

        <FilterBar
          filters={filters}
          onChange={handleFiltersChange}
          exportUrl={exportUrl}
        />

        {selectedOrder ? (
          <WorkOrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        ) : (
          <WorkOrderTable orders={workOrders || []} onOrderClick={handleOrderClick} />
        )}
      </div>
    </DashboardLayout>
  );
}
