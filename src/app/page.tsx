'use client';

import { useState, useCallback } from 'react';
import { workOrders } from '@/lib/mock-data';
import { PriorityAdjustment } from '@/lib/types';
import { useAdjustmentStore } from '@/lib/use-adjustment-store';
import DelayWaterfall from '@/components/DelayWaterfall';
import CapacityLoad from '@/components/CapacityLoad';
import RushOrderPanel from '@/components/RushOrderPanel';
import WorkshopMap from '@/components/WorkshopMap';
import WorkOrderDetail from '@/components/WorkOrderDetail';
import CustomerFilter from '@/components/CustomerFilter';
import { BarChart3, Download, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { orders, updateOrders } = useAdjustmentStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(workOrders[0]?.id || null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const selectedOrder = orders.find((wo) => wo.id === selectedOrderId) || orders[0];

  const handlePriorityAdjust = useCallback((woId: string, newPriority: number, reason: string) => {
    updateOrders(orders.map((wo) => {
      if (wo.id !== woId) return wo;
      const downstreamSteps = wo.processSteps
        .filter((s) => s.stepIndex >= wo.processSteps.findIndex((ps) => ps.status === 'in_progress'))
        .map((s) => s.id);

      const beforeRisk = wo.totalDelayHours > 40 ? 85 : wo.totalDelayHours > 20 ? 60 : wo.totalDelayHours > 0 ? 35 : 10;
      const afterRisk = Math.max(5, beforeRisk - (wo.priority - newPriority) * 12);

      const adjustment: PriorityAdjustment = {
        id: `adj-${woId}-${Date.now()}`,
        workOrderId: woId,
        adjustedAt: new Date().toISOString().slice(0, 16),
        adjustedBy: '当前计划员',
        oldPriority: wo.priority,
        newPriority,
        reason,
        affectedDownstreamSteps: downstreamSteps,
        beforeDelayRisk: beforeRisk,
        afterDelayRisk: afterRisk,
      };

      fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustment),
      }).catch(() => {});

      return {
        ...wo,
        priority: newPriority,
        priorityAdjustments: [...wo.priorityAdjustments, adjustment],
      };
    }));
  }, [orders, updateOrders]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        a.download = match ? match[1] : `工单复盘报告_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silent
    }
    setExporting(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <header className="border-b border-slate-700/50 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold text-white">制造工单优先级复盘看板</h1>
            <span className="text-xs text-slate-500 hidden sm:inline">生产计划员工位</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors border border-slate-600/30 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />{exporting ? '生成中…' : '导出报告'}
            </button>
            <Link
              href="/review"
              className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />复盘对比
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-5">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <CustomerFilter
              workOrders={orders}
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
              onOrderSelect={setSelectedOrderId}
              selectedOrderId={selectedOrderId}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          <div className="col-span-9 space-y-4">
            {selectedOrder && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <DelayWaterfall workOrderId={selectedOrder.id} />
                  <CapacityLoad />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <WorkshopMap
                    transfers={selectedOrder.crossShopTransfers}
                    selectedOrderId={selectedOrder.id}
                  />
                  <RushOrderPanel rushOrders={selectedOrder.rushOrders} />
                </div>

                <WorkOrderDetail
                  workOrder={selectedOrder}
                  onPriorityAdjust={handlePriorityAdjust}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
