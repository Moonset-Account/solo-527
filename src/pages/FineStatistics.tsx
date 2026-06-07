import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, XCircle, DollarSign, Clock } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { FineStatusBadge } from '@/components/Badges';
import { fineApi } from '@/services/api';
import type { Fine, FineStatistics, PaginatedResponse } from '@/types';
import { formatCurrency, formatDateTime, chartColors, exportToExcel } from '@/utils';

const FineStatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedResponse<Fine> | null>(null);
  const [statistics, setStatistics] = useState<FineStatistics | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fineApi.getList(page, pageSize, statusFilter !== 'all' ? { status: statusFilter } : {}),
        fineApi.getStatistics(),
      ]);
      setData(listRes);
      setStatistics(statsRes);
    } catch (error) {
      console.error('Failed to load fines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, page]);

  const handleConfirm = async (fineId: string) => {
    try {
      await fineApi.confirmFine(fineId);
      loadData();
    } catch (error) {
      console.error('Failed to confirm fine:', error);
    }
  };

  const handleReject = async (fineId: string) => {
    try {
      await fineApi.rejectFine(fineId, '金额有误');
      loadData();
    } catch (error) {
      console.error('Failed to reject fine:', error);
    }
  };

  const handleExport = () => {
    if (data?.items) {
      const exportData = data.items.map((f) => ({
        罚款编号: f.id,
        隐患编号: f.hazardCode,
        隐患标题: f.hazardTitle,
        责任班组: f.teamName,
        罚款金额: f.amount,
        状态: f.status,
        确认人: f.confirmedBy || '-',
        确认时间: f.confirmedAt ? formatDateTime(f.confirmedAt) : '-',
        创建时间: formatDateTime(f.createdAt),
      }));
      exportToExcel(exportData, `罚款记录_${new Date().toISOString().slice(0, 10)}`);
    }
  };

  const byTeamChartOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { fontSize: 11, color: '#4E5969' },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: statistics?.byTeam.map((item, idx) => ({
          value: item.amount,
          name: item.team,
          itemStyle: {
            color: [chartColors.primary, chartColors.success, chartColors.warning, chartColors.purple, chartColors.danger][idx % 5],
          },
        })),
      },
    ],
  };

  const byTypeChartOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        return `${params[0].name}<br/>罚款金额: ¥${params[0].value.toLocaleString()}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: statistics?.byType.map((t) => t.type),
      axisLabel: {
        rotate: 30,
        fontSize: 10,
        color: '#86909C',
        interval: 0,
      },
      axisLine: { lineStyle: { color: '#E5E6EB' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: {
        color: '#86909C',
        fontSize: 11,
        formatter: (value: number) => `¥${value / 1000}k`,
      },
    },
    series: [
      {
        type: 'bar',
        data: statistics?.byType.map((t) => ({
          value: t.amount,
          itemStyle: {
            color: chartColors.warning,
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: 24,
      },
    ],
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">罚款统计</h1>
          <p className="text-gray-500 mt-1">罚款成本统计与明细管理</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          导出
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已确认罚款</p>
              <p className="text-2xl font-bold text-green-600 font-mono mt-1">
                {formatCurrency(statistics?.totalConfirmed || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待确认罚款</p>
              <p className="text-2xl font-bold text-yellow-600 font-mono mt-1">
                {formatCurrency(statistics?.totalPending || 0)}
              </p>
              <p className="text-xs text-yellow-600 mt-1">不计入成本统计</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">罚款总额</p>
              <p className="text-2xl font-bold text-gray-900 font-mono mt-1">
                {formatCurrency((statistics?.totalConfirmed || 0) + (statistics?.totalPending || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">按班组分布</h3>
          <ReactECharts option={byTeamChartOption} style={{ height: '240px' }} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">按隐患类型分布</h3>
          <ReactECharts option={byTypeChartOption} style={{ height: '240px' }} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">罚款明细</h3>
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'confirmed', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '全部' :
                 status === 'pending' ? '待确认' :
                 status === 'confirmed' ? '已确认' : '已驳回'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  罚款编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  隐患编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  隐患标题
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  责任班组
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="animate-pulse">加载中...</div>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                data?.items.map((fine) => (
                  <tr key={fine.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-600">{fine.id.slice(0, 12)}...</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-blue-600">{fine.hazardCode}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{fine.hazardTitle}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{fine.teamName}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900 font-mono">{formatCurrency(fine.amount)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <FineStatusBadge status={fine.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDateTime(fine.createdAt)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {fine.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirm(fine.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="确认"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(fine.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="驳回"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FineStatisticsPage;
