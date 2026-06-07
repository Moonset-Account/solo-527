import { useState } from 'react';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import type { TrainingData, RecoveryData, StrengthData, FilterState } from '@shared/types';

interface ReportExportProps {
  filters: FilterState;
  trainingData: TrainingData[];
  recoveryData: RecoveryData[];
  strengthData: StrengthData[];
}

export function ReportExport({ filters, trainingData, recoveryData, strengthData }: ReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      if (trainingData.length > 0) {
        const trainingSheet = XLSX.utils.json_to_sheet(
          trainingData.map((d) => ({
            日期: d.date,
            训练类型: d.sessionType,
            时长: d.durationMin,
            平均心率: d.avgHeartRate,
            最高心率: d.maxHeartRate,
            配速: d.paceKmPerH,
            距离: d.distanceKm,
            负荷评分: d.loadScore,
            RPE: d.rpe,
          }))
        );
        XLSX.utils.book_append_sheet(wb, trainingSheet, '训练数据');
      }

      if (recoveryData.length > 0) {
        const recoverySheet = XLSX.utils.json_to_sheet(
          recoveryData.map((d) => ({
            日期: d.date,
            睡眠评分: d.sleepScore,
            HRV: d.hrv,
            酸痛评分: d.sorenessScore,
            情绪评分: d.moodScore,
            综合恢复分: d.overallScore,
          }))
        );
        XLSX.utils.book_append_sheet(wb, recoverySheet, '恢复数据');
      }

      if (strengthData.length > 0) {
        const strengthSheet = XLSX.utils.json_to_sheet(
          strengthData.map((d) => ({
            日期: d.date,
            动作: d.exercise,
            重量: d.weightKg,
            次数: d.reps,
            组数: d.sets,
            估算1RM: d.estimated1Rm,
          }))
        );
        XLSX.utils.book_append_sheet(wb, strengthSheet, '力量数据');
      }

      const summarySheet = XLSX.utils.json_to_sheet([
        { 指标: '训练记录数', 数值: trainingData.length },
        { 指标: '恢复记录数', 数值: recoveryData.length },
        { 指标: '力量记录数', 数值: strengthData.length },
        { 指标: '总负荷量', 数值: trainingData.reduce((s, d) => s + d.loadScore, 0) },
        { 指标: '平均恢复分', 数值: recoveryData.length > 0 ? (recoveryData.reduce((s, d) => s + d.overallScore, 0) / recoveryData.length).toFixed(1) : 0 },
        { 指标: '日期范围', 数值: `${filters.dateRange.start} 至 ${filters.dateRange.end}` },
      ]);
      XLSX.utils.book_append_sheet(wb, summarySheet, '汇总');

      XLSX.writeFile(wb, `训练报告_${new Date().toISOString().split('T')[0]}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('Training Load Report', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Date Range: ${filters.dateRange.start} to ${filters.dateRange.end}`, 20, 40);
      doc.text(`Generated: ${new Date().toLocaleString('zh-CN')}`, 20, 50);

      doc.setFontSize(14);
      doc.text('Summary', 20, 70);

      doc.setFontSize(11);
      const summary = [
        `Training Records: ${trainingData.length}`,
        `Recovery Records: ${recoveryData.length}`,
        `Strength Records: ${strengthData.length}`,
        `Total Load: ${trainingData.reduce((s, d) => s + d.loadScore, 0)}`,
        `Avg Recovery Score: ${recoveryData.length > 0 ? (recoveryData.reduce((s, d) => s + d.overallScore, 0) / recoveryData.length).toFixed(1) : 0}`,
      ];

      summary.forEach((text, i) => {
        doc.text(text, 25, 85 + i * 8);
      });

      doc.save(`训练报告_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportExcel}
        disabled={isExporting}
        className="btn-secondary flex items-center gap-2 text-sm"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Table className="w-4 h-4" />
        )}
        导出 Excel
      </button>
      <button
        onClick={exportPDF}
        disabled={isExporting}
        className="btn-secondary flex items-center gap-2 text-sm"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        导出 PDF
      </button>
    </div>
  );
}
