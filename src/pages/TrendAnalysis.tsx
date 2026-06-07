import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Filter,
  RefreshCw,
  Download,
  Calendar,
  MapPin,
  Building2,
  Layers,
  AlertTriangle,
  ChevronDown,
  X,
  Plus,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import { useFilterStore } from '../store/useFilterStore';
import type { Measurement, TrendData } from '../types';
import { INDICATORS, RIVER_SECTIONS, ORGANIZATIONS } from '../utils/constants';
import { MOCK_SITES, MOCK_MEASUREMENTS } from '../utils/mockData';
import { filterMeasurements, calculateTrendData } from '../utils/dataService';

export default function TrendAnalysis() {
  const { query, selectedIndicators, setQuery, setSelectedIndicators, resetFilters } =
    useFilterStore();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);

  const filteredMeasurements = useMemo(() => {
    return filterMeasurements(MOCK_MEASUREMENTS, query, MOCK_SITES);
  }, [query]);

  const trendDataList = useMemo(() => {
    const result: TrendData[] = [];
    selectedIndicators.forEach((indicator) => {
      if (query.dataSource === 'all' || query.dataSource === 'manual') {
        result.push(calculateTrendData(filteredMeasurements, indicator, 'manual'));
      }
      if (query.dataSource === 'all' || query.dataSource === 'automatic') {
        result.push(calculateTrendData(filteredMeasurements, indicator, 'automatic'));
      }
    });
    return result;
  }, [filteredMeasurements, selectedIndicators, query.dataSource]);

  const chartOption = useMemo(() => {
    const series: any[] = [];
    const allTimes = new Set<string>();

    trendDataList.forEach((trend) => {
      trend.points.forEach((p) => allTimes.add(p.time));
    });

    const times = Array.from(allTimes).sort();

    trendDataList.forEach((trend) => {
      const indicator = INDICATORS.find((i) => i.code === trend.indicator);
      const color = indicator?.color || '#333';
      const isManual = trend.dataSource === 'manual';

      const data = times.map((time) => {
        const point = trend.points.find((p) => p.time === time);
        return point?.value ?? null;
      });

      const markPoints = trend.points
        .filter((p) => p.isAnomaly)
        .map((p) => ({
          name: '异常',
          coord: [p.time, p.value],
          value: p.value,
          itemStyle: { color: '#EF4444' },
        }));

      series.push({
        name: `${trend.indicatorName} (${trend.dataSource === 'manual' ? '人工' : '自动站'})`,
        type: 'line',
        data,
        smooth: false,
        connectNulls: false,
        lineStyle: {
          width: isManual ? 2 : 2.5,
          type: isManual ? 'dashed' : 'solid',
          color,
        },
        itemStyle: {
          color,
        },
        symbol: isManual ? 'circle' : 'emptyCircle',
        symbolSize: isManual ? 6 : 8,
        markPoint: markPoints.length > 0 ? { data: markPoints } : undefined,
      });
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let html = `<div class="font-medium mb-1">${params[0]?.axisValueLabel || ''}</div>`;
          params.forEach((p: any) => {
            if (p.value !== null && p.value !== undefined) {
              html += `<div class="flex items-center gap-2 text-sm">
                <span class="w-3 h-0.5" style="background:${p.color}"></span>
                <span>${p.seriesName}:</span>
                <span class="font-mono font-medium">${p.value}</span>
              </div>`;
            }
          });
          return html;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: times.map((t) => new Date(t).toLocaleDateString('zh-CN')),
        axisLabel: { rotate: 45, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series,
    };
  }, [trendDataList]);

  const toggleIndicator = (code: string) => {
    if (selectedIndicators.includes(code)) {
      setSelectedIndicators(selectedIndicators.filter((i) => i !== code));
    } else {
      setSelectedIndicators([...selectedIndicators, code]);
    }
  };

  const addFilter = (key: string, value: string) => {
    const current = (query as any)[key] || [];
    if (!current.includes(value)) {
      setQuery({ [key]: [...current, value] } as any);
    }
  };

  const removeFilter = (key: string, value: string) => {
    const current = (query as any)[key] || [];
    setQuery({ [key]: current.filter((v: string) => v !== value) } as any);
  };

  return (
    <PageContainer
      title="趋势分析"
      subtitle={`共 ${filteredMeasurements.length} 条监测记录`}
      actions={
        <>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
            <Download className="w-4 h-4" />
            导出
          </button>
        </>
      }
    >
      {showFilters && (
        <div className="bg-white rounded-xl p-5 mb-6 shadow-card border border-slate-100">
          <div className="grid grid-cols-4 gap-6">
            <FilterSection
              title="监测指标"
              icon={Layers}
              items={INDICATORS.map((i) => ({ value: i.code, label: i.name, color: i.color }))}
              selected={selectedIndicators}
              onToggle={toggleIndicator}
            />
            <FilterSection
              title="所属河段"
              icon={MapPin}
              items={RIVER_SECTIONS.map((r) => ({ value: r, label: r }))}
              selected={query.riverSections || []}
              onToggle={(v) => {
                if (query.riverSections?.includes(v)) {
                  removeFilter('riverSections', v);
                } else {
                  addFilter('riverSections', v);
                }
              }}
            />
            <FilterSection
              title="采样机构"
              icon={Building2}
              items={ORGANIZATIONS.map((o) => ({ value: o, label: o }))}
              selected={query.organizations || []}
              onToggle={(v) => {
                if (query.organizations?.includes(v)) {
                  removeFilter('organizations', v);
                } else {
                  addFilter('organizations', v);
                }
              }}
            />
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                数据来源
              </h4>
              <div className="flex gap-2">
                {['all', 'manual', 'automatic'].map((src) => (
                  <button
                    key={src}
                    onClick={() => setQuery({ dataSource: src as any })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      query.dataSource === src
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {src === 'all' ? '全部' : src === 'manual' ? '人工采样' : '自动站'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {selectedIndicators.map((ind) => {
          const indicator = INDICATORS.find((i) => i.code === ind);
          return (
            <span
              key={ind}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: indicator?.color }}
            >
              {indicator?.name}
              <button onClick={() => toggleIndicator(ind)} className="hover:bg-white/20 rounded p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        {(query.riverSections || []).map((r) => (
          <span
            key={r}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
          >
            河段: {r}
            <button onClick={() => removeFilter('riverSections', r)} className="hover:bg-emerald-200 rounded p-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {(query.organizations || []).map((o) => (
          <span
            key={o}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700"
          >
            机构: {o.substring(0, 8)}...
            <button onClick={() => removeFilter('organizations', o)} className="hover:bg-violet-200 rounded p-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-card border border-slate-100 p-5">
          <h3 className="font-display font-semibold text-slate-800 mb-4">指标趋势图</h3>
          <div className="h-96">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-slate-400 border-dashed"></span>
              人工采样（虚线）
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-slate-700"></span>
              自动站（实线）
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              异常点
            </div>
            <div className="text-slate-400">* 缺失值点已断开显示</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-semibold text-slate-800">原始记录</h3>
            <span className="text-xs text-slate-500">
              显示最近 {Math.min(20, filteredMeasurements.length)} 条
            </span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {filteredMeasurements.slice(0, 20).map((m) => {
                const site = MOCK_SITES.find((s) => s.id === m.siteId);
                return (
                  <div
                    key={m.id}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      m.isAnomaly ? 'bg-rose-50/50' : ''
                    }`}
                    onClick={() => setSelectedMeasurement(m)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {site?.name || '未知站点'}
                          </p>
                          {m.isAnomaly && (
                            <span className="flex items-center gap-1 text-xs text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              异常
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(m.sampleTime).toLocaleString('zh-CN')}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-slate-500">
                            水温: <span className="font-mono text-slate-700">{m.temperature ?? '--'}°C</span>
                          </span>
                          <span className="text-slate-500">
                            pH: <span className="font-mono text-slate-700">{m.ph ?? '--'}</span>
                          </span>
                          <span className="text-slate-500">
                            DO: <span className="font-mono text-slate-700">{m.dissolvedOxygen ?? '--'}</span>
                          </span>
                          <span className="text-slate-500">
                            NH3: <span className="font-mono text-slate-700">{m.ammoniaNitrogen ?? '--'}</span>
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${
                          m.dataSource === 'manual'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {m.dataSource === 'manual' ? '人工' : '自动'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedMeasurement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800">记录详情</h3>
              <button
                onClick={() => setSelectedMeasurement(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const site = MOCK_SITES.find((s) => s.id === selectedMeasurement.siteId);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <DetailItem label="站点名称" value={site?.name || '--'} />
                      <DetailItem label="站点编码" value={site?.code || '--'} />
                      <DetailItem label="所属河段" value={site?.riverSection || '--'} />
                      <DetailItem label="采样机构" value={selectedMeasurement.organization} />
                      <DetailItem label="采样时间" value={new Date(selectedMeasurement.sampleTime).toLocaleString('zh-CN')} />
                      <DetailItem label="数据来源" value={selectedMeasurement.dataSource === 'manual' ? '人工采样' : '自动站'} />
                      <DetailItem label="采样员" value={selectedMeasurement.sampledBy || '--'} />
                      <DetailItem
                        label="是否异常"
                        value={selectedMeasurement.isAnomaly ? '是' : '否'}
                        valueClass={selectedMeasurement.isAnomaly ? 'text-rose-600' : 'text-emerald-600'}
                      />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">监测指标</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <MetricItem label="水温" value={selectedMeasurement.temperature} unit="°C" />
                        <MetricItem label="pH值" value={selectedMeasurement.ph} unit="" />
                        <MetricItem label="溶解氧" value={selectedMeasurement.dissolvedOxygen} unit="mg/L" />
                        <MetricItem label="氨氮" value={selectedMeasurement.ammoniaNitrogen} unit="mg/L" />
                        <MetricItem label="降雨量" value={selectedMeasurement.rainfall} unit="mm" />
                      </div>
                    </div>
                    {selectedMeasurement.anomalyReason && (
                      <div className="bg-rose-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-rose-700 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          异常原因
                        </h4>
                        <p className="text-sm text-rose-600">{selectedMeasurement.anomalyReason}</p>
                      </div>
                    )}
                    {selectedMeasurement.note && (
                      <div className="mt-4 bg-amber-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-amber-700 mb-2">备注</h4>
                        <p className="text-sm text-amber-600">{selectedMeasurement.note}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

interface FilterSectionProps {
  title: string;
  icon: any;
  items: Array<{ value: string; label: string; color?: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterSection({ title, icon: Icon, items, selected, onToggle }: FilterSectionProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.value);
          return (
            <button
              key={item.value}
              onClick={() => onToggle(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={isSelected ? { backgroundColor: item.color || '#0891b2' } : {}}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
  valueClass?: string;
}

function DetailItem({ label, value, valueClass }: DetailItemProps) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-sm font-medium text-slate-800 ${valueClass || ''}`}>{value}</p>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: number | null;
  unit: string;
}

function MetricItem({ label, value, unit }: MetricItemProps) {
  return (
    <div className="bg-white rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-mono font-bold text-slate-800">
        {value !== null ? value : '--'}
        <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
