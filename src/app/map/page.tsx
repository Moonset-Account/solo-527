"use client";

import DashboardLayout from "@/components/DashboardLayout";
import MapView from "@/components/MapView";
import { MOCK_BUILDINGS, MOCK_WORK_ORDERS } from "@/mock/data";
import { Building } from "@/types";
import { useState } from "react";

export default function MapPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            地图总览
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            地理视角查看各楼栋维修情况
          </p>
        </div>

        <MapView
          buildings={MOCK_BUILDINGS}
          workOrders={MOCK_WORK_ORDERS}
          height="calc(100vh - 280px)"
          onBuildingClick={(b) => setSelectedBuilding(b)}
        />

        {selectedBuilding && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 min-w-96">
            <h3 className="font-semibold text-slate-900">{selectedBuilding.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{selectedBuilding.address}</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-500">总工单</p>
                <p className="text-xl font-bold text-slate-900">{selectedBuilding.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">复修数</p>
                <p className="text-xl font-bold text-orange-600">{selectedBuilding.repeatCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">超时数</p>
                <p className="text-xl font-bold text-red-600">{selectedBuilding.timeoutCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
