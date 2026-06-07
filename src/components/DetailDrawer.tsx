import { useState } from 'react';
import { X, Download, ChevronDown, ChevronUp, CheckSquare, Square, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { generateDistrictAggregations } from '@/data/mockData';
import { formatNumber } from '@/utils/dataUtils';
import * as XLSX from 'xlsx';

function TraceVerification({ recordIds }: { recordIds: string[] }) {
  const { allRecords, selectedRecordsForTrace, toggleRecordForTrace, clearTraceSelection } = useAppStore();
  const [showCalculation, setShowCalculation] = useState(false);

  const records = allRecords.filter(r => recordIds.includes(r.id));
  const rents = records.map(r => r.rent);
  const totalRent = rents.reduce((a, b) => a + b, 0);
  const avgRent = Math.round(totalRent / rents.length);

  return (
    <div className="border-t border-workbench-border pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowCalculation(!showCalculation)}
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Info className="w-4 h-4" />
          可追溯验证
          {showCalculation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {selectedRecordsForTrace.length > 0 && (
          <button
            onClick={clearTraceSelection}
            className="text-xs text-workbench-text-muted hover:text-cyan-400"
          >
            清除选择 ({selectedRecordsForTrace.length})
          </button>
        )}
      </div>

      {showCalculation && (
        <div className="bg-workbench-bg rounded-lg p-4 space-y-3">
          <div className="text-sm text-workbench-text font-mono">
            <div className="text-workbench-text-muted mb-2">计算表达式:</div>
            <div className="bg-workbench-surface rounded p-2 text-cyan-300">
              均价 = Σ(租金) / N
            </div>
            <div className="mt-2 space-y-1">
              <div>N = <span className="text-white">{records.length}</span> 条记录</div>
              <div>Σ(租金) = <span className="text-white">¥{formatNumber(totalRent)}</span></div>
              <div>均价 = <span className="text-cyan-400 font-semibold">¥{formatNumber(avgRent)}</span></div>
            </div>
          </div>

          <div>
            <div className="text-xs text-workbench-text-muted mb-2">
              勾选样本验证计算 (已选 {selectedRecordsForTrace.length} 条):
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {records.slice(0, 20).map(r => (
                <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-workbench-surface p-1 rounded">
                  {selectedRecordsForTrace.includes(r.id) ? (
                    <CheckSquare className="w-3 h-3 text-cyan-400" onClick={() => toggleRecordForTrace(r.id)} />
                  ) : (
                    <Square className="w-3 h-3 text-workbench-text-muted" onClick={() => toggleRecordForTrace(r.id)} />
                  )}
                  <span className="text-workbench-text-muted">{r.id}</span>
                  <span className="text-white">¥{formatNumber(r.rent)}</span>
                  <span className="text-workbench-text-muted">{r.community}</span>
                </label>
              ))}
              {records.length > 20 && (
                <div className="text-xs text-workbench-text-muted text-center py-1">
                  ... 还有 {records.length - 20} 条记录
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetailDrawer() {
  const {
    showDetailDrawer,
    setShowDetailDrawer,
    selectedDistrict,
    filteredRecords,
    filterState,
    dataUpdateTime,
    userRole,
    updateRecordAnnotation
  } = useAppStore();

  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [annotationText, setAnnotationText] = useState('');

  const districtAggregations = generateDistrictAggregations(filteredRecords);
  const districtData = districtAggregations.find(d => d.district === selectedDistrict);
  const districtRecords = filteredRecords.filter(r => r.district === selectedDistrict);

  if (!showDetailDrawer) return null;

  const handleExport = () => {
    const exportData = districtRecords.map(r => ({
      '记录ID': r.id,
      '小区': r.community,
      '区域': r.district,
      '户型': r.layout,
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
      ['报表说明'],
      ['生成时间', new Date().toLocaleString('zh-CN')],
      ['数据更新时间', new Date(dataUpdateTime).toLocaleString('zh-CN')],
      ['当前角色', userRole],
      ['筛选条件 - 区域', selectedDistrict || '全部'],
      ['筛选条件 - 排除异常', filterState.excludeAnomaly ? '是' : '否'],
      ['样本量', districtRecords.length],
      ['异常样本数', districtRecords.filter(r => r.isAnomaly).length],
      [],
      ['数据明细']
    ];

    const ws = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.sheet_add_json(ws, exportData, { origin: metadata.length + 1 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '租赁房源数据');
    XLSX.writeFile(wb, `租赁房源_${selectedDistrict || '全部'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const startEditAnnotation = (id: string, currentAnnotation?: string) => {
    setEditingAnnotation(id);
    setAnnotationText(currentAnnotation || '');
  };

  const saveAnnotation = (id: string) => {
    updateRecordAnnotation(id, annotationText);
    setEditingAnnotation(null);
    setAnnotationText('');
  };

  const { q1Rent, q3Rent } = districtData || { q1Rent: 0, q3Rent: 0 };
  const iqr = q3Rent - q1Rent;
  const lowerBound = q1Rent - filterState.iqrThreshold * iqr;
  const upperBound = q3Rent + filterState.iqrThreshold * iqr;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50 drawer-overlay"
        onClick={() => setShowDetailDrawer(false)}
      />

      <div className="relative ml-auto w-[600px] h-full bg-workbench-surface border-l border-workbench-border shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b border-workbench-border">
          <div>
            <h2 className="text-lg font-semibold text-workbench-text">
              {selectedDistrict || '全部区域'} 数据详情
            </h2>
            <p className="text-xs text-workbench-text-muted mt-1">
              更新于 {new Date(dataUpdateTime).toLocaleString('zh-CN')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={() => setShowDetailDrawer(false)}
              className="p-1.5 hover:bg-workbench-border rounded transition-colors"
            >
              <X className="w-5 h-5 text-workbench-text-muted" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {districtData && (
            <div className="p-4 border-b border-workbench-border">
              <h3 className="text-sm font-medium text-workbench-text-muted mb-3">聚合统计</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-workbench-bg rounded-lg p-3">
                  <div className="text-xs text-workbench-text-muted">租金均价</div>
                  <div className="text-xl font-semibold text-cyan-400 mt-1">¥{formatNumber(districtData.avgRent)}</div>
                  <div className="text-xs text-workbench-text-muted mt-1">元/月</div>
                </div>
                <div className="bg-workbench-bg rounded-lg p-3">
                  <div className="text-xs text-workbench-text-muted">租金中位数</div>
                  <div className="text-xl font-semibold text-green-400 mt-1">¥{formatNumber(districtData.medianRent)}</div>
                  <div className="text-xs text-workbench-text-muted mt-1">元/月</div>
                </div>
                <div className="bg-workbench-bg rounded-lg p-3">
                  <div className="text-xs text-workbench-text-muted">样本量</div>
                  <div className="text-xl font-semibold text-workbench-text mt-1">{districtData.sampleCount}</div>
                  {districtData.isLowSample && (
                    <div className="text-xs text-orange-400 mt-1">样本不足</div>
                  )}
                </div>
                <div className="bg-workbench-bg rounded-lg p-3">
                  <div className="text-xs text-workbench-text-muted">单位租金</div>
                  <div className="text-lg font-semibold text-workbench-text mt-1">¥{districtData.avgUnitRent}</div>
                  <div className="text-xs text-workbench-text-muted mt-1">元/㎡/月</div>
                </div>
                <div className="bg-workbench-bg rounded-lg p-3">
                  <div className="text-xs text-workbench-text-muted">平均成交周期</div>
                  <div className="text-lg font-semibold text-workbench-text mt-1">{districtData.avgDealCycle}</div>
                  <div className="text-xs text-workbench-text-muted mt-1">天</div>
                </div>
                <div className="bg-workbench-bg rounded-lg p-3">
                  <div className="text-xs text-workbench-text-muted">平均楼龄</div>
                  <div className="text-lg font-semibold text-workbench-text mt-1">{districtData.avgBuildingAge}</div>
                  <div className="text-xs text-workbench-text-muted mt-1">年</div>
                </div>
              </div>

              <div className="mt-4 bg-workbench-bg rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-workbench-text mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  异常值检测口径 (IQR × {filterState.iqrThreshold})
                </div>
                <div className="text-xs text-workbench-text-muted space-y-1">
                  <div>Q1: ¥{formatNumber(q1Rent)} | Q3: ¥{formatNumber(q3Rent)}</div>
                  <div>正常区间: ¥{formatNumber(Math.max(0, lowerBound))} ~ ¥{formatNumber(upperBound)}</div>
                  <div>异常样本: {districtRecords.filter(r => r.isAnomaly).length} 条</div>
                </div>
              </div>

              <TraceVerification recordIds={districtRecords.map(r => r.id)} />
            </div>
          )}

          <div className="p-4">
            <h3 className="text-sm font-medium text-workbench-text-muted mb-3">
              原始记录 ({districtRecords.length} 条)
              {userRole === 'student' && <span className="ml-2 text-yellow-500/80 text-[10px]">(学生视图，部分字段已脱敏)</span>}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-workbench-border">
                    <th className="text-left py-2 px-2 text-workbench-text-muted font-medium">ID</th>
                    <th className="text-left py-2 px-2 text-workbench-text-muted font-medium">小区</th>
                    <th className="text-right py-2 px-2 text-workbench-text-muted font-medium">租金</th>
                    <th className="text-right py-2 px-2 text-workbench-text-muted font-medium">户型</th>
                    <th className="text-right py-2 px-2 text-workbench-text-muted font-medium">面积</th>
                    <th className="text-center py-2 px-2 text-workbench-text-muted font-medium">状态</th>
                    {userRole !== 'student' && (
                      <th className="text-left py-2 px-2 text-workbench-text-muted font-medium">注释</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {districtRecords.slice(0, 50).map(record => (
                    <tr key={record.id} className="border-b border-workbench-border/50 hover:bg-workbench-bg/50">
                      <td className="py-2 px-2 text-workbench-text-muted font-mono">{record.id}</td>
                      <td className="py-2 px-2 text-workbench-text">{record.community}</td>
                      <td className="py-2 px-2 text-right text-workbench-text font-medium">
                        ¥{formatNumber(record.rent)}
                      </td>
                      <td className="py-2 px-2 text-right text-workbench-text-muted">{record.layout}</td>
                      <td className="py-2 px-2 text-right text-workbench-text-muted">{record.area}㎡</td>
                      <td className="py-2 px-2 text-center">
                        {record.isAnomaly ? (
                          <span className="text-orange-400" title={userRole !== 'student' ? record.anomalyReason : '数据异常'}>
                            <AlertTriangle className="w-3 h-3 inline" />
                          </span>
                        ) : (
                          <span className="text-green-500">●</span>
                        )}
                      </td>
                      {userRole !== 'student' && (
                        <td className="py-2 px-2">
                          {editingAnnotation === record.id ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={annotationText}
                                onChange={e => setAnnotationText(e.target.value)}
                                className="flex-1 px-1 py-0.5 text-xs bg-workbench-bg border border-workbench-border rounded text-workbench-text"
                                autoFocus
                              />
                              <button
                                onClick={() => saveAnnotation(record.id)}
                                className="px-1.5 py-0.5 bg-cyan-600 text-white rounded text-xs"
                              >
                                保存
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditAnnotation(record.id, record.annotation)}
                              className="text-cyan-400 hover:text-cyan-300 text-xs"
                            >
                              {record.annotation || '+ 添加注释'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {districtRecords.length > 50 && (
                <div className="text-center text-xs text-workbench-text-muted py-3">
                  显示前 50 条，共 {districtRecords.length} 条记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
