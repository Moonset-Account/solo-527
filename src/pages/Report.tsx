import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import ExportMenu from '@/components/ExportMenu';
import { getFilterDescription } from '@/utils/export';
import type { WeeklyReportData } from '@/types';

export default function Report() {
  const generateWeeklyReport = useDataStore((s) => s.generateWeeklyReport);
  const [report, setReport] = useState<WeeklyReportData | null>(null)

  useEffect(() => {
    const data = generateWeeklyReport();
    setReport(data);
  }, [generateWeeklyReport]);

  if (!report) return null;

  const filterDesc = getFilterDescription(report.filterSnapshot);

  return (
    <div className="min-h-screen bg-[#1a1d23] text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            返回仪表盘
          </Link>
          <h1 className="text-xl font-semibold">调度分析周报</h1>
        </div>
        <ExportMenu targetId="report-content" />
      </header>

      <div id="report-content" className="px-6 py-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-[#00e5c7]" />
            关键指标
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#22252d] rounded-lg p-4">
              <div className="text-sm text-white/50">总骑行量</div>
              <div className="text-2xl font-bold mt-1">{report.totalRides.toLocaleString()}</div>
              {report.ridesWoW !== 0 && (
                <div
                  className={`flex items-center gap-1 text-sm mt-2 ${
                    report.ridesWoW > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {report.ridesWoW > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  环比 {report.ridesWoW > 0 ? '+' : ''}{report.ridesWoW}%
                </div>
              )}
            </div>
            <div className="bg-[#22252d] rounded-lg p-4">
              <div className="text-sm text-white/50">调度次数</div>
              <div className="text-2xl font-bold mt-1">{report.totalDispatches.toLocaleString()}</div>
            </div>
            <div className="bg-[#22252d] rounded-lg p-4">
              <div className="text-sm text-white/50">平均可调度车辆</div>
              <div className="text-2xl font-bold mt-1">{report.avgAvailability.toFixed(1)}</div>
              {report.availabilityWoW !== 0 && (
                <div
                  className={`flex items-center gap-1 text-sm mt-2 ${
                    report.availabilityWoW > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {report.availabilityWoW > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  环比 {report.availabilityWoW > 0 ? '+' : ''}{report.availabilityWoW}%
                </div>
              )}
            </div>
            <div className="bg-[#22252d] rounded-lg p-4">
              <div className="text-sm text-white/50">严重告警数</div>
              <div className="text-2xl font-bold mt-1 flex items-center gap-2">
                {report.criticalAlerts}
                {report.criticalAlerts > 0 && (
                  <AlertTriangle size={18} className="text-[#ff9f43]" />
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">同比环比</h2>
          <div className="bg-[#22252d] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-white/50 font-medium">指标</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">环比 (WoW)</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">同比 (YoY)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="px-4 py-3">总骑行量</td>
                  <td
                    className={`text-right px-4 py-3 ${
                      report.ridesWoW > 0 ? 'text-emerald-400' : report.ridesWoW < 0 ? 'text-red-400' : ''
                    }`}
                  >
                    {report.ridesWoW > 0 ? '+' : ''}{report.ridesWoW}%
                  </td>
                  <td
                    className={`text-right px-4 py-3 ${
                      report.ridesYoY > 0 ? 'text-emerald-400' : report.ridesYoY < 0 ? 'text-red-400' : ''
                    }`}
                  >
                    {report.ridesYoY > 0 ? '+' : ''}{report.ridesYoY}%
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">平均可调度车辆</td>
                  <td
                    className={`text-right px-4 py-3 ${
                      report.availabilityWoW > 0
                        ? 'text-emerald-400'
                        : report.availabilityWoW < 0
                        ? 'text-red-400'
                        : ''
                    }`}
                  >
                    {report.availabilityWoW > 0 ? '+' : ''}{report.availabilityWoW}%
                  </td>
                  <td className="text-right px-4 py-3 text-white/30">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">异常站点</h2>
          {report.anomalies.length === 0 ? (
            <div className="bg-[#22252d] rounded-lg p-6 text-center text-white/40">
              本周无异常站点
            </div>
          ) : (
            <div className="bg-[#22252d] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-white/50 font-medium">站点</th>
                    <th className="text-left px-4 py-3 text-white/50 font-medium">指标</th>
                    <th className="text-right px-4 py-3 text-white/50 font-medium">预期值</th>
                    <th className="text-right px-4 py-3 text-white/50 font-medium">实际值</th>
                    <th className="text-right px-4 py-3 text-white/50 font-medium">偏差</th>
                  </tr>
                </thead>
                <tbody>
                  {report.anomalies.map((a) => (
                    <tr key={a.stationId} className="border-b border-white/5">
                      <td className="px-4 py-3">{a.stationName}</td>
                      <td className="px-4 py-3 text-white/60">{a.metric}</td>
                      <td className="text-right px-4 py-3">{a.expected}</td>
                      <td className="text-right px-4 py-3">{a.actual}</td>
                      <td
                        className={`text-right px-4 py-3 font-medium ${
                          Math.abs(a.deviation) > 20 ? 'text-red-400' : 'text-[#ff9f43]'
                        }`}
                      >
                        {a.deviation > 0 ? '+' : ''}{a.deviation}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">筛选口径</h2>
          <div className="bg-[#22252d] rounded-lg p-4">
            <p className="text-sm text-white/70">{filterDesc}</p>
          </div>
        </section>
      </div>

      <footer className="px-6 py-4 border-t border-white/10 text-xs text-white/40">
        报告生成时间: {new Date().toLocaleString('zh-CN')}
        {report.nullCount > 0 && (
          <span className="ml-4 text-[#ff9f43]">
            本报告含 {report.nullCount} 个空值字段
          </span>
        )}
      </footer>
    </div>
  );
}
