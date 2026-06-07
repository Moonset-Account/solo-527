"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import FilterBar from "@/components/FilterBar";
import WorkOrderTable from "@/components/WorkOrderTable";
import WorkOrderDetail from "@/components/WorkOrderDetail";
import { MOCK_WORK_ORDERS } from "@/mock/data";
import { FilterOptions, WorkOrder } from "@/types";

export default function WorkOrdersPage() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const router = useRouter();

  const filteredOrders = useMemo(() => {
    return MOCK_WORK_ORDERS.filter((order) => {
      if (filters.buildingId && order.buildingId !== filters.buildingId) return false;
      if (filters.roomType && order.roomType !== filters.roomType) return false;
      if (filters.repairType && order.repairType !== filters.repairType) return false;
      if (filters.supplierId && order.supplierId !== filters.supplierId) return false;
      if (filters.status && order.status !== filters.status) return false;
      if (filters.isRepeat !== undefined && order.isRepeat !== filters.isRepeat) return false;
      if (filters.isHoliday !== undefined && order.isHoliday !== filters.isHoliday) return false;
      return true;
    });
  }, [filters]);

  const handleOrderClick = (order: WorkOrder) => {
    setSelectedOrder(order);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            工单管理
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {filteredOrders.length} 条工单记录
          </p>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          exportData={filteredOrders}
        />

        {selectedOrder ? (
          <WorkOrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        ) : (
          <WorkOrderTable orders={filteredOrders} onOrderClick={handleOrderClick} />
        )}
      </div>
    </DashboardLayout>
  );
}
