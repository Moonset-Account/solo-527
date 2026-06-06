"use client";

import { useState } from "react";
import { Calendar, Clock, Filter, Download, RefreshCw } from "lucide-react";

interface ToolbarProps {
  onDateChange?: (date: string) => void;
  onTimeRangeChange?: (range: string) => void;
  onPeakChange?: (peak: string) => void;
  selectedRoutes?: string[];
  onRoutesChange?: (routes: string[]) => void;
}

export default function Toolbar({
  onDateChange,
  onTimeRangeChange,
  onPeakChange,
  selectedRoutes = [],
  onRoutesChange,
}: ToolbarProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [timeRange, setTimeRange] = useState("all");
  const [peakPeriod, setPeakPeriod] = useState("all");
  const [showCaliber, setShowCaliber] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    onDateChange?.(e.target.value);
  };

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value);
    onTimeRangeChange?.(e.target.value);
  };

  const handlePeakChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeakPeriod(e.target.value);
    onPeakChange?.(e.target.value);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全天</option>
              <option value="morning">早高峰 (7:00-9:00)</option>
              <option value="evening">晚高峰 (17:00-19:00)</option>
              <option value="offpeak">平峰时段</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={peakPeriod}
              onChange={handlePeakChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部班次</option>
              <option value="morning">仅早高峰</option>
              <option value="evening">仅晚高峰</option>
              <option value="off-peak">仅平峰</option>
            </select>
          </div>

          <button
            onClick={() => setShowCaliber(!showCaliber)}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
          >
            口径说明
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      {showCaliber && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-2">统计口径说明</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>准点率：</strong>车辆到站时间与计划时间偏差不超过2分钟视为准点，临时绕行班次不参与计算</li>
            <li><strong>满载率：</strong>车内乘客数 / 车辆额定载客数，≥90%为极度拥挤，70%-89%为拥挤，40%-69%为适中，&lt;40%为宽松</li>
            <li><strong>早晚高峰：</strong>早高峰7:00-9:00，晚高峰17:00-19:00</li>
            <li><strong>到站间隔：</strong>同线路同方向相邻两班次到达同一站点的时间差</li>
            <li><strong>数据来源：</strong>GPS定位数据 + IC卡刷卡数据 + 乘客投诉数据 + 气象数据</li>
          </ul>
        </div>
      )}
    </div>
  );
}
