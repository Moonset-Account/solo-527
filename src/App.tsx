import { useState, useCallback } from 'react';
import { GlobalFilter } from './components/filters/GlobalFilter';
import { KeyMetrics } from './components/common/KeyMetrics';
import { InventoryFunnel } from './components/charts/InventoryFunnel';
import { AgeDistributionChart } from './components/charts/AgeDistributionChart';
import { TurnoverRanking } from './components/charts/TurnoverRanking';
import { ReplenishmentSuggestions } from './components/charts/ReplenishmentSuggestions';
import { InventoryDetailTable } from './components/common/InventoryDetailTable';
import { ArchitectureInfo } from './components/common/ArchitectureInfo';
import { Loading } from './components/common/Loading';
import { useFilter } from './context/FilterContext';
import { FileDown, FileText, Info } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function AppContent() {
  const { filteredInventory, filteredBatches, getFilterSummary, filters, setIsLoading, isLoading } = useFilter();
  const [, setExportLoading] = useState(false);
  const [, setReportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const showSuccess = useCallback((message: string) => {
    setExportSuccess(message);
    setTimeout(() => setExportSuccess(null), 3000);
  }, []);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const headers = [
      'SKU名称', '批次号', '库存数量', '可用数量', '库龄(天)',
      '生产日期', '有效期至', '距效期(天)', '入库日期',
      '仓位', '供应商', '单价(元)', '库存金额(元)'
    ];

    const rows = filteredInventory.map(item => [
      item.skuName,
      item.batchNo,
      item.quantity,
      item.availableQty,
      item.ageDays,
      item.productionDate,
      item.expiryDate,
      item.daysToExpiry,
      item.receivedDate,
      item.locationCode,
      item.supplierName,
      item.unitCost,
      item.totalValue,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `库存明细_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportLoading(false);
    setIsLoading(false);
    showSuccess(`已导出 ${filteredInventory.length} 条库存明细数据`);
  }, [filteredInventory, setIsLoading, showSuccess]);

  const handleDownloadReport = useCallback(async () => {
    setReportLoading(true);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const totalQty = filteredInventory.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = filteredInventory.reduce((sum, i) => sum + i.totalValue, 0);
    const nearExpiryQty = filteredInventory.filter(i => i.daysToExpiry < 90 && i.daysToExpiry > 0).reduce((sum, i) => sum + i.quantity, 0);
    const slowMovingQty = filteredInventory.filter(i => i.ageDays > 180).reduce((sum, i) => sum + i.quantity, 0);
    const avgAgeDays = Math.round(filteredInventory.reduce((sum, i) => sum + i.ageDays, 0) / (filteredInventory.length || 1));
    const today = format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });

    const reportContent = `
仓库 SKU 周转与滞销分析报告
生成时间: ${today}
筛选条件: ${getFilterSummary()}
时间窗口: ${filters.timeWindow === '7d' ? '近7天' : filters.timeWindow === '30d' ? '近30天' : filters.timeWindow === '90d' ? '近90天' : filters.timeWindow === '180d' ? '近180天' : filters.timeWindow === '1y' ? '近1年' : '全部'}

═══════════════════════════════════════
一、核心指标概览
═══════════════════════════════════════
• 库存总量: ${totalQty.toLocaleString()} 件
• 库存总金额: ¥${totalValue.toLocaleString()}
• 涉及SKU数: ${new Set(filteredInventory.map(i => i.skuId)).size} 个
• 批次总数: ${filteredBatches.length} 个
• 平均库龄: ${avgAgeDays} 天
• 近效期库存: ${nearExpiryQty.toLocaleString()} 件 (占比 ${((nearExpiryQty / totalQty) * 100).toFixed(1)}%)
• 滞销库存(>180天): ${slowMovingQty.toLocaleString()} 件 (占比 ${((slowMovingQty / totalQty) * 100).toFixed(1)}%)

═══════════════════════════════════════
二、分析结论与建议
═══════════════════════════════════════
1. 周转效率: 平均库龄${avgAgeDays}天，${avgAgeDays < 60 ? '处于健康水平' : avgAgeDays < 90 ? '需关注动销' : '周转偏慢，建议优化采购策略'}
2. 效期风险: 近效期库存占比${((nearExpiryQty / totalQty) * 100).toFixed(1)}%，${nearExpiryQty / totalQty > 0.1 ? '占比较高，建议启动促销清理' : '风险可控，持续关注'}
3. 滞销问题: 库龄超180天库存占比${((slowMovingQty / totalQty) * 100).toFixed(1)}%，${slowMovingQty / totalQty > 0.05 ? '需重点关注，考虑降价清仓' : '处于合理范围'}

═══════════════════════════════════════
三、数据说明
═══════════════════════════════════════
• 数据来源: WMS库存系统 + ERP采购系统
• 更新频率: 每日8:00自动同步
• 样本说明: 本报告基于当前筛选条件生成
• 口径定义:
  - 库龄: 从商品入库日期至统计日的天数
  - 近效期: 距有效期不足90天的库存
  - 滞销: 库龄超过180天且无出库记录的库存
  - 周转天数: 统计周期天数 / (出库量 / 平均库存量)

═══════════════════════════════════════
技术支持: Apache Superset + ClickHouse + PostgreSQL
本报告由系统自动生成，仅供内部参考
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `库存分析报告_${format(new Date(), 'yyyyMMdd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setReportLoading(false);
    setIsLoading(false);
    showSuccess('分析报告已生成并下载');
  }, [filteredInventory, filteredBatches, getFilterSummary, filters, setIsLoading, showSuccess]);

  return (
    <div className="min-h-screen bg-slate-50">
      {isLoading && <Loading text="数据处理中..." fullScreen />}

      {exportSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-success-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <FileDown className="w-5 h-5" />
          {exportSuccess}
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary-500" />
                仓库 SKU 周转与滞销分析平台
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                智能库存分析 · 数据驱动决策 · 批次级精细化管理
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                <Info className="w-3.5 h-3.5" />
                <span>对外公开版 · 数据已脱敏</span>
              </div>
              <span className="text-xs text-slate-400">
                更新于 {format(new Date(), 'yyyy-MM-dd HH:mm')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <GlobalFilter onExport={handleExport} onDownloadReport={handleDownloadReport} />

        <KeyMetrics />

        <div className="grid grid-cols-2 gap-6 mb-6">
          <InventoryFunnel />
          <AgeDistributionChart />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <TurnoverRanking />
          <ReplenishmentSuggestions />
        </div>

        <div className="mb-6">
          <InventoryDetailTable />
        </div>

        <ArchitectureInfo />

        <footer className="mt-8 py-6 border-t border-slate-200">
          <div className="text-center text-xs text-slate-400 space-y-1">
            <p>
              技术栈: Apache Superset · ClickHouse · PostgreSQL · React
            </p>
            <p>
              © 2025 供应链数据分析平台 · 本页面数据为演示样本，不代表真实业务
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
