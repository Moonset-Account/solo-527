"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Toolbar from "@/components/Toolbar";
import OverviewDashboard from "@/components/OverviewDashboard";
import CrowdingMap from "@/components/CrowdingMap";
import RouteComparison from "@/components/RouteComparison";
import IntervalBoxPlot from "@/components/IntervalBoxPlot";
import ComplaintAnalysis from "@/components/ComplaintAnalysis";
import AnomalyPanel from "@/components/AnomalyPanel";
import WeatherImpact from "@/components/WeatherImpact";
import DetailDataTable from "@/components/DetailDataTable";

export default function Home() {
  const [activeView, setActiveView] = useState("overview");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPeak, setSelectedPeak] = useState("all");
  const [currentTime, setCurrentTime] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setCurrentTime(new Date().toLocaleString("zh-CN"));

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString("zh-CN"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <OverviewDashboard />;
      case "map":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[calc(100vh-220px)]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              站点拥挤度热力地图
            </h3>
            <CrowdingMap />
          </div>
        );
      case "comparison":
        return <RouteComparison />;
      case "interval":
        return <IntervalBoxPlot />;
      case "complaints":
        return <ComplaintAnalysis />;
      case "anomalies":
        return <AnomalyPanel />;
      case "weather":
        return <WeatherImpact />;
      case "details":
        return <DetailDataTable />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                城市公交站点拥挤度仪表盘
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                公交调度中心 · 运营复盘分析工作台
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">当前时间</p>
                <p className="text-sm text-gray-500">
                  {isMounted ? currentTime : "--"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <Toolbar
          onDateChange={setSelectedDate}
          onPeakChange={setSelectedPeak}
        />

        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {renderContent()}
        </main>

        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>数据更新时间: {isMounted ? currentTime : "--"}</span>
              <span>·</span>
              <span>数据来源: GPS定位 + IC卡刷卡 + 投诉系统 + 气象数据</span>
            </div>
            <div className="flex items-center gap-4">
              {isMounted && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
                  系统运行正常
                </span>
              )}
              <span>版本 v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
