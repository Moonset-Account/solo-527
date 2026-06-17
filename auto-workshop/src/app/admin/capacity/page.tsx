'use client';

import { useState, useEffect } from 'react';

interface Technician {
  id: string;
  name: string;
  specialty: string | null;
}

interface CapacityReport {
  id: string;
  technicianId: string;
  technician: Technician;
  periodStart: string;
  periodEnd: string;
  completedOrders: number;
  totalLaborFee: number;
  abnormalCloses: number;
  shortageHandles: number;
  createdAt: string;
}

export default function CapacityPage() {
  const [reports, setReports] = useState<CapacityReport[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetch('/api/technicians')
      .then((res) => res.json())
      .then((data) => setTechnicians(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchReport = () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1).toISOString();
    const periodEnd = new Date(year, month, 0).toISOString();

    fetch(`/api/capacity?periodStart=${periodStart}&periodEnd=${periodEnd}`)
      .then((res) => res.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0);

      await Promise.all(
        technicians.map((tech) =>
          fetch('/api/capacity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              technicianId: tech.id,
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
            }),
          })
        )
      );
      fetchReport();
    } finally {
      setRecalculating(false);
    }
  };

  const reportMap = new Map(reports.map((r) => [r.technicianId, r]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">产能报表</h1>
        <button
          className="btn-primary"
          onClick={handleRecalculate}
          disabled={recalculating}
        >
          {recalculating ? '重新计算中...' : '重新计算'}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">选择月份</label>
          <input
            type="month"
            className="input-field w-auto"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无技师</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">技师</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">专长</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">完成工单数</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">工时费总计</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">异常关闭数</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">缺货处理数</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => {
                  const report = reportMap.get(tech.id);
                  return (
                    <tr key={tech.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{tech.name}</td>
                      <td className="py-3 px-2">{tech.specialty || '-'}</td>
                      <td className="py-3 px-2 text-right">{report?.completedOrders ?? 0}</td>
                      <td className="py-3 px-2 text-right">¥{report ? Number(report.totalLaborFee).toFixed(2) : '0.00'}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={report && report.abnormalCloses > 0 ? 'text-red-600 font-medium' : ''}>
                          {report?.abnormalCloses ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">{report?.shortageHandles ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
              {reports.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-medium">
                    <td className="py-3 px-2">合计</td>
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-right">{reports.reduce((s, r) => s + r.completedOrders, 0)}</td>
                    <td className="py-3 px-2 text-right">¥{reports.reduce((s, r) => s + Number(r.totalLaborFee), 0).toFixed(2)}</td>
                    <td className="py-3 px-2 text-right">{reports.reduce((s, r) => s + r.abnormalCloses, 0)}</td>
                    <td className="py-3 px-2 text-right">{reports.reduce((s, r) => s + r.shortageHandles, 0)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
