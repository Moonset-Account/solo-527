import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, RotateCcw, Download, Calendar } from 'lucide-react';
import { useFilter } from '../../context/FilterContext';
import { mockSKUs, mockSuppliers, mockLocations, categories, zones } from '../../data/mockData';
import { mockSampleInfo } from '../../data/mockData';
import { InfoTooltip } from '../common/InfoTooltip';

const timeWindowOptions = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '180d', label: '近180天' },
  { value: '1y', label: '近1年' },
  { value: 'all', label: '全部' },
];

const ageRangeOptions = [
  { value: '0-30', label: '0-30天' },
  { value: '31-60', label: '31-60天' },
  { value: '61-90', label: '61-90天' },
  { value: '91-180', label: '91-180天' },
  { value: '181-365', label: '181-365天' },
  { value: '365+', label: '365天以上' },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-slate-700">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

function MultiSelect({ options, selected, onChange, placeholder = '请选择' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="relative">
      <button
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-left flex items-center justify-between bg-white hover:border-slate-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selected.length > 0 ? 'text-slate-700' : 'text-slate-400'}>
          {selected.length > 0 ? `已选${selected.length}项` : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.map(opt => (
              <label
                key={opt.value}
                className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggleOption(opt.value)}
                  className="w-4 h-4 text-primary-500 rounded border-slate-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface GlobalFilterProps {
  onExport: () => void;
  onDownloadReport: () => void;
}

export function GlobalFilter({ onExport, onDownloadReport }: GlobalFilterProps) {
  const { filters, setFilters, resetFilters, getFilterSummary } = useFilter();
  const [expanded, setExpanded] = useState(true);

  const skuOptions = mockSKUs.map(s => ({ value: s.id, label: s.name }));
  const supplierOptions = mockSuppliers.map(s => ({ value: s.id, label: s.name }));
  const locationOptions = mockLocations.map(l => ({ value: l.id, label: `${l.code} (${l.zone})` }));
  const categoryOptions = categories.map(c => ({ value: c, label: c }));
  const zoneOptions = zones.map(z => ({ value: z, label: z }));

  const hasActiveFilters =
    filters.skuIds.length > 0 ||
    filters.locationIds.length > 0 ||
    filters.supplierIds.length > 0 ||
    filters.categories.length > 0 ||
    filters.zones.length > 0 ||
    filters.ageRange !== null;

  const totalActiveFilters =
    filters.skuIds.length +
    filters.locationIds.length +
    filters.supplierIds.length +
    filters.categories.length +
    filters.zones.length +
    (filters.ageRange ? 1 : 0);

  return (
    <div className="card mb-6">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-primary-500" />
          <h3 className="card-title">数据筛选器</h3>
          <InfoTooltip
            title="筛选说明"
            content="所有筛选条件将实时联动更新下方所有图表。同一SKU的不同批次可通过批次筛选单独查看。"
          />
          {hasActiveFilters && (
            <span className="badge badge-info">{totalActiveFilters}个筛选条件</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 mr-2">
            当前: {getFilterSummary()}
          </span>
          <button
            className="btn btn-outline text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : '展开'}
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={resetFilters}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
          <button className="btn btn-outline text-xs" onClick={onExport}>
            <Download className="w-3.5 h-3.5" />
            导出数据
          </button>
          <button className="btn btn-primary text-xs" onClick={onDownloadReport}>
            <Download className="w-3.5 h-3.5" />
            下载报告
          </button>
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-slate-100">
          <div className="p-4 grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                时间窗口
                <InfoTooltip content="用于计算周转率、出库量等指标的统计周期" />
              </label>
              <select
                className="select"
                value={filters.timeWindow}
                onChange={e => setFilters(f => ({ ...f, timeWindow: e.target.value as any }))}
              >
                {timeWindowOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">商品品类</label>
              <MultiSelect
                options={categoryOptions}
                selected={filters.categories}
                onChange={values => setFilters(f => ({ ...f, categories: values }))}
                placeholder="全部品类"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">库区</label>
              <MultiSelect
                options={zoneOptions}
                selected={filters.zones}
                onChange={values => setFilters(f => ({ ...f, zones: values }))}
                placeholder="全部库区"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">库龄范围</label>
              <MultiSelect
                options={ageRangeOptions.map(o => ({ value: o.value, label: o.label }))}
                selected={filters.ageRange ? [`${filters.ageRange[0]}-${filters.ageRange[1]}`] : []}
                onChange={values => {
                  if (values.length === 0) {
                    setFilters(f => ({ ...f, ageRange: null }));
                  } else {
                    const [min, max] = values[0].split('-').map(Number);
                    setFilters(f => ({ ...f, ageRange: [min, max === undefined ? 9999 : max] }));
                  }
                }}
                placeholder="全部库龄"
              />
            </div>
          </div>

          <FilterSection title="高级筛选">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">SKU 商品</label>
                <MultiSelect
                  options={skuOptions}
                  selected={filters.skuIds}
                  onChange={values => setFilters(f => ({ ...f, skuIds: values }))}
                  placeholder="全部SKU"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">供应商</label>
                <MultiSelect
                  options={supplierOptions}
                  selected={filters.supplierIds}
                  onChange={values => setFilters(f => ({ ...f, supplierIds: values }))}
                  placeholder="全部供应商"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">仓库仓位</label>
                <MultiSelect
                  options={locationOptions}
                  selected={filters.locationIds}
                  onChange={values => setFilters(f => ({ ...f, locationIds: values }))}
                  placeholder="全部仓位"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">批次筛选</label>
                <input
                  type="text"
                  placeholder="输入批次号搜索..."
                  className="input"
                />
              </div>
            </div>
          </FilterSection>

          <div className="px-4 py-3 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-slate-500">
              <span>样本总量: <strong className="text-slate-700">{mockSampleInfo.totalRecords.toLocaleString()}</strong> 条</span>
              <span>筛选后: <strong className="text-primary-600">{mockSampleInfo.filteredRecords.toLocaleString()}</strong> 条</span>
              <span>数据更新时间: {mockSampleInfo.dataFreshness}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>缓存策略: 5分钟自动刷新 · 上次缓存: {mockSampleInfo.cacheTime}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
