"use client";

import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { checkSampleSizeSignificance } from "@/lib/validator";

interface Props {
  sampleSize: number;
  showLabel?: boolean;
}

export default function SampleSizeIndicator({ sampleSize, showLabel = true }: Props) {
  const sig = checkSampleSizeSignificance(sampleSize);

  const icons = {
    low: <AlertTriangle className="w-4 h-4 text-warning-500" />,
    medium: <Info className="w-4 h-4 text-primary-500" />,
    high: <CheckCircle2 className="w-4 h-4 text-success-500" />,
  };

  const bgColors = {
    low: "bg-warning-50 border-warning-200 text-warning-700",
    medium: "bg-primary-50 border-primary-200 text-primary-700",
    high: "bg-success-50 border-success-200 text-success-700",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border ${bgColors[sig.level]}`}
    >
      {icons[sig.level]}
      <span className="font-medium">样本量 N={sampleSize}</span>
      {showLabel && <span className="opacity-75">· {sig.message}</span>}
    </div>
  );
}
