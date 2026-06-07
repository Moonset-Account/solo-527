"use client";

import { Download, MoreHorizontal, Info } from "lucide-react";
import SampleSizeIndicator from "./SampleSizeIndicator";
import { useState } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  sampleSize?: number;
  onExport?: () => void;
  infoTooltip?: string;
  children: React.ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  sampleSize,
  onExport,
  infoTooltip,
  children,
}: ChartCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-slate-800">{title}</h3>
            {infoTooltip && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowInfo(true)}
                  onMouseLeave={() => setShowInfo(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showInfo && (
                  <div className="absolute left-0 top-full mt-1 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg z-10 animate-fade-in">
                    {infoTooltip}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sampleSize !== undefined && <SampleSizeIndicator sampleSize={sampleSize} showLabel={false} />}
            {onExport && (
              <button
                onClick={onExport}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
