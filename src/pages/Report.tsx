import { useState, useMemo } from 'react'
import { Download, FileImage, FileText } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useFilterStore } from '@/store/filterStore'
import { generateWeeklyReport } from '@/utils/dataAggregator'
import type { WeeklyReport, AnomalyItem } from '@/types'

export default function Report() {
  const equipmentIds = useFilterStore(s => s.equipmentIds)
  const productionLines = useFilterStore(s => s.productionLines)
  const shifts = useFilterStore(s => s.shifts)
  const faultTypes = useFilterStore(s => s.faultTypes)
  const maintenancePersonIds = useFilterStore(s => s.maintenancePersonIds)
  const downtimeMode = useFilterStore(s => s.downtimeMode)
  const dateRange = useFilterStore(s => s.dateRange)
  const getFilterDescription = useFilterStore(s => s.getFilterDescription)

  const filter = useMemo(() => ({
    equipmentIds,
    productionLines,
    shifts,
    faultTypes,
    maintenancePersonIds,
    downtimeMode,
    dateRange,
  }), [equipmentIds, productionLines, shifts, faultTypes, maintenancePersonIds, downtimeMode, dateRange])

  const [exporting, setExporting] = useState(false)

  const report: WeeklyReport = useMemo(() => generateWeeklyReport(filter), [filter])

  const filterDesc = getFilterDescription()

  const captureReport = async () => {
    const el = document.getElementById('report-content')
    if (!el) return null
    return html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
  }

  const exportPDF = async () => {
    setExporting(true)
    try {
      const canvas = await captureReport()
      if (!canvas) return
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`周报_${report.weekLabel}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  const exportImage = async () => {
    setExporting(true)
    try {
      const canvas = await captureReport()
      if (!canvas) return
      const link = document.createElement('a')
      link.download = `周报_${report.weekLabel}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setExporting(false)
    }
  }

  const maxParetoMinutes = Math.max(
    ...report.paretoTop5.map((item) => item.plannedMinutes + item.unplannedMinutes),
    1,
  )

  return (
    <div className="bg-[#0A1628] min-h-screen p-6">
      <div className="bg-white text-gray-900 max-w-[210mm] mx-auto p-8" id="report-content">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">周报概览</h1>
          <div className="text-right">
            <div className="text-sm text-gray-500">{report.weekLabel}</div>
            <div className="text-xs text-gray-400">
              生成时间: {new Date(report.generatedAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>

        <div className="mb-6 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-medium text-gray-500 mb-1">筛选口径</div>
          <div className="text-sm text-gray-700">{filterDesc}</div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">总停机时长</div>
            <div className="text-2xl font-bold text-gray-900">{report.kpiSummary.totalDowntimeMinutes}</div>
            <div className="text-xs text-gray-400">分钟</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">设备可用率</div>
            <div className="text-2xl font-bold text-gray-900">
              {(report.kpiSummary.equipmentAvailabilityRate * 100).toFixed(1)}
            </div>
            <div className="text-xs text-gray-400">%</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">平均维修响应</div>
            <div className="text-2xl font-bold text-gray-900">
              {report.kpiSummary.avgRepairResponseMinutes}
            </div>
            <div className="text-xs text-gray-400">分钟</div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">本周关键变化</h2>
          <ul className="space-y-2">
            {report.keyChanges.map((change, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: i === 0 ? '#E74C3C' : i === 1 ? '#FF6B35' : '#3498DB',
                  }}
                />
                <span className="text-sm text-gray-700">{change}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">异常点标注</h2>
          {report.anomalies.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">暂无异常</div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">日期</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">设备</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">指标</th>
                  <th className="border border-gray-200 px-3 py-2 text-right font-medium">期望值</th>
                  <th className="border border-gray-200 px-3 py-2 text-right font-medium">实际值</th>
                  <th className="border border-gray-200 px-3 py-2 text-right font-medium">偏差</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-medium">严重度</th>
                </tr>
              </thead>
              <tbody>
                {report.anomalies.map((item: AnomalyItem, i: number) => (
                  <tr
                    key={i}
                    className={item.severity === 'critical' ? 'bg-red-50' : 'bg-orange-50'}
                  >
                    <td className="border border-gray-200 px-3 py-2">{item.date}</td>
                    <td className="border border-gray-200 px-3 py-2">{item.equipmentName}</td>
                    <td className="border border-gray-200 px-3 py-2">{item.metric}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{item.expectedValue}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{item.actualValue}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">
                      {(item.deviation * 100).toFixed(1)}%
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          item.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {item.severity === 'critical' ? '严重' : '警告'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">停机原因 Top5</h2>
          <div className="space-y-2">
            {report.paretoTop5.map((item, i) => {
              const total = item.plannedMinutes + item.unplannedMinutes
              const widthPercent = (total / maxParetoMinutes) * 100
              return (
                <div key={item.faultType} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4 text-right">{i + 1}</span>
                  <span className="text-sm text-gray-700 w-28 truncate">{item.faultType}</span>
                  <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
                    <div
                      className="h-full rounded flex items-center"
                      style={{
                        width: `${widthPercent}%`,
                        background: `linear-gradient(90deg, #3498DB ${((item.plannedMinutes / total) * 100).toFixed(0)}%, #E74C3C ${((item.plannedMinutes / total) * 100).toFixed(0)}%)`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{total} 分钟</span>
                  <span className="text-xs text-gray-400 w-12 text-right">
                    {item.cumulativePercentage}%
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#3498DB] inline-block" />
              计划停机
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#E74C3C] inline-block" />
              非计划停机
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">产线停机汇总</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium">产线</th>
                <th className="border border-gray-200 px-3 py-2 text-right font-medium">计划停机(分钟)</th>
                <th className="border border-gray-200 px-3 py-2 text-right font-medium">非计划停机(分钟)</th>
                <th className="border border-gray-200 px-3 py-2 text-right font-medium">合计(分钟)</th>
              </tr>
            </thead>
            <tbody>
              {report.productionLineSummary.map((line) => (
                <tr key={line.productionLine}>
                  <td className="border border-gray-200 px-3 py-2">{line.productionLine}</td>
                  <td className="border border-gray-200 px-3 py-2 text-right text-[#3498DB]">
                    {line.plannedMinutes}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-right text-[#E74C3C]">
                    {line.unplannedMinutes}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-right font-medium">
                    {line.plannedMinutes + line.unplannedMinutes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-[10px] text-gray-400 text-center">{filterDesc}</p>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#0F1B2D] rounded-xl border border-[#1E3A5F] p-3">
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#e55a28] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText size={16} />
          {exporting ? '导出中...' : '导出PDF'}
        </button>
        <button
          onClick={exportImage}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#243556] border border-[#1E3A5F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileImage size={16} />
          {exporting ? '导出中...' : '导出图片'}
        </button>
      </div>
    </div>
  )
}
