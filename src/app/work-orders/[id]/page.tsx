"use client";

import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import WorkOrderDetail from "@/components/WorkOrderDetail";
import { MOCK_WORK_ORDERS } from "@/mock/data";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default function WorkOrderDetailPage({ params }: PageProps) {
  const order = useMemo(() => {
    return MOCK_WORK_ORDERS.find((o) => o.id === params.id);
  }, [params.id]);

  if (!order) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← 返回列表
          </button>
        </div>
        <WorkOrderDetail order={order} />
      </div>
    </DashboardLayout>
  );
}
