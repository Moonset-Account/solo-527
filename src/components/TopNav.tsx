import { Map, BarChart3, User, Clock, Database, Download, Shield, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { UserRole } from '@/types';
import * as XLSX from 'xlsx';

const ROLE_OPTIONS: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: 'student', label: '学生', icon: <User className="w-3.5 h-3.5" /> },
  { value: 'mentor', label: '导师', icon: <Shield className="w-3.5 h-3.5" /> },
  { value: 'admin', label: '管理员', icon: <Database className="w-3.5 h-3.5" /> }
];

export default function TopNav() {
  const {
    filteredRecords,
    dataUpdateTime,
    userRole,
    setUserRole,
    mapView,
    setMapView,
    filterState,
    allRecords,
    setShowScheduledReportModal
  } = useAppStore();

  const anomalyCount = filteredRecords.filter(r => r.isAnomaly).length;

  const handleExportAll = () => {
    const exportData = filteredRecords.map(r => ({
      '记录ID': r.id,
      '小区': r.community,
      '区域': r.district,
      '户型': r.layout,
      '室数': r.bedrooms,
      '面积(㎡)': r.area,
      '租金(元/月)': r.rent,
      '单位租金(元/㎡)': r.unitRent,
      '楼层': r.floor,
      '楼龄(年)': r.buildingAge,
      '地铁距离(m)': r.subwayDistance,
      '挂牌日期': r.listingDate,
      '成交日期': r.dealDate || '',
      '成交周期(天)': r.dealCycle || '',
      '来源平台': r.sourcePlatforms.join(', '),
      '是否异常': r.isAnomaly ? '是' : '否',
      '异常原因': r.anomalyReason || '',
      '人工注释': r.annotation || ''
    }));

    const metadata = [
      ['租赁房源价格分析报表'],
      ['生成时间', new Date().toLocaleString('zh-CN')],
      ['数据更新时间', new Date(dataUpdateTime).toLocaleString('zh-CN')],
      ['当前角色', userRole],
      [],
      ['筛选条件:'],
      ['  区域', filterState.districts.length > 0 ? filterState.districts.join(', ') : '全部'],
      ['  户型', filterState.layouts.length > 0 ? filterState.layouts.join(', ') : '全部'],
      ['  来源', filterState.sources.length > 0 ? filterState.sources.join(', ') : '全部'],
      ['  租金范围', `${filterState.rentRange[0]} - ${filterState.rentRange[1]} 元/月`],
      ['  面积范围', `${filterState.areaRange[0]} - ${filterState.areaRange[1]} ㎡`],
      ['  楼龄范围', `${filterState.buildingAgeRange[0]} - ${filterState.buildingAgeRange[1]} 年`],
      ['  排除异常样本', filterState.excludeAnomaly ? '是' : '否'],
      ['  IQR阈值', filterState.iqrThreshold + '×'],
      [],
      ['数据统计:'],
      ['  总样本量', allRecords.length],
      ['  当前筛选样本量', filteredRecords.length],
      ['  异常样本数', anomalyCount],
      [],
      ['指标口径说明:'],
      ['  租金均价 = 有效样本租金之和 / 样本量'],
      ['  租金中位数 = 样本租金排序后第50百分位数'],
      ['  单位面积租金 = 租金 / 房屋面积'],
      ['  成交周期 = 成交日期 - 挂牌日期'],
      ['  样本不足 = 样本量 < 30'],
      [],
      ['数据明细']
    ];

    const ws = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.sheet_add_json(ws, exportData, { origin: metadata.length + 1 });
    
    ws['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 6 },
      { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 10 }, { wch: 15 }, { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '租赁房源数据');
    XLSX.writeFile(wb, `租赁房源分析报表_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <header className="h-14 bg-workbench-surface border-b border-workbench-border flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-cyan-400" />
          <h1 className="font-display font-semibold text-workbench-text text-base">
            租赁房源价格变化地图分析工作台
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-workbench-bg rounded-lg p-1">
          <button
            onClick={() => setMapView('district')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
              mapView === 'district'
                ? 'bg-cyan-600 text-white'
                : 'text-workbench-text-muted hover:text-workbench-text'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            区域视图
          </button>
          <button
            onClick={() => setMapView('community')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
              mapView === 'community'
                ? 'bg-cyan-600 text-white'
                : 'text-workbench-text-muted hover:text-workbench-text'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            小区视图
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-workbench-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>数据更新: {new Date(dataUpdateTime).toLocaleDateString('zh-CN')}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-workbench-text-muted">
          <Database className="w-3.5 h-3.5" />
          <span>样本: <span className="text-cyan-400 font-medium">{filteredRecords.length}</span></span>
          {anomalyCount > 0 && (
            <span className="text-orange-400">异常: {anomalyCount}</span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-workbench-bg rounded-lg p-0.5">
          {ROLE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setUserRole(option.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${
                userRole === option.value
                  ? 'bg-workbench-surface text-cyan-400 shadow-sm'
                  : 'text-workbench-text-muted hover:text-workbench-text'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowScheduledReportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-workbench-surface border border-workbench-border hover:border-cyan-500 text-workbench-text text-xs rounded transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          定时报表
        </button>

        <button
          onClick={handleExportAll}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          导出报表
        </button>
      </div>
    </header>
  );
}
