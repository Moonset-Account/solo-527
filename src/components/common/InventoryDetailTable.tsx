import { useState, useMemo } from 'react';
import { useFilter } from '../../context/FilterContext';
import { InfoTooltip } from './InfoTooltip';
import { EmptyState } from './EmptyState';
import { BatchDetailModal } from './BatchDetailModal';
import { Eye, ArrowUpDown, Search } from 'lucide-react';

type SortField = 'skuName' | 'batchNo' | 'quantity' | 'ageDays' | 'daysToExpiry' | 'locationCode';
type SortOrder = 'asc' | 'desc';

export function InventoryDetailTable() {
  const { filteredInventory, selectedSKUId, setSelectedBatchId, selectedBatchId } = useFilter();
  const [sortField, setSortField] = useState<SortField>('ageDays');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBatchModal, setShowBatchModal] = useState<string | null>(null);

  const displayData = useMemo(() => {
    let data = [...filteredInventory];

    if (selectedSKUId) {
      data = data.filter(i => i.skuId === selectedSKUId);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(i =>
        i.skuName.toLowerCase().includes(term) ||
        i.batchNo.toLowerCase().includes(term) ||
        i.locationCode.toLowerCase().includes(term) ||
        i.supplierName.toLowerCase().includes(term)
      );
    }

    return data.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredInventory, selectedSKUId, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary-500' : 'text-slate-400'}`} />
      </div>
    </th>
  );

  const getExpiryBadge = (days: number) => {
    if (days <= 0) return <span className="badge badge-danger">已过期</span>;
    if (days <= 30) return <span className="badge badge-danger">剩{days}天</span>;
    if (days <= 90) return <span className="badge badge-warning">剩{days}天</span>;
    return <span className="badge badge-success">{days}天</span>;
  };

  const getAgeBadge = (days: number) => {
    if (days > 365) return <span className="badge badge-danger">{days}天</span>;
    if (days > 180) return <span className="badge badge-warning">{days}天</span>;
    return <span className="badge badge-info">{days}天</span>;
  };

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <h3 className="card-title">库存明细（按批次）</h3>
          <InfoTooltip
            title="口径说明"
            content="同一SKU不同批次分开展示。点击行可查看批次完整溯源信息。所有数据与上方筛选器联动。"
          />
          {selectedSKUId && (
            <span className="badge badge-info">
              已筛选单个SKU
              <button
                className="ml-1 hover:text-white"
                onClick={() => setSelectedBatchId(null)}
              >
                ×
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索SKU/批次/仓位..."
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs text-slate-500">
            共 {displayData.length} 条
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {displayData.length === 0 ? (
          <EmptyState
            type="no-result"
            title="无匹配批次"
            description={selectedSKUId ? '该SKU下没有符合条件的批次' : '请调整筛选条件查看库存明细'}
          />
        ) : (
          <table className="data-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>商品名称</th>
                <SortHeader field="batchNo" label="批次号" />
                <SortHeader field="quantity" label="库存数量" />
                <SortHeader field="ageDays" label="库龄" />
                <SortHeader field="daysToExpiry" label="效期剩余" />
                <SortHeader field="locationCode" label="仓位" />
                <th>供应商</th>
                <th className="w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map(item => (
                <tr
                  key={item.batchId}
                  className={`cursor-pointer transition-colors ${
                    selectedBatchId === item.batchId ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => setSelectedBatchId(
                    selectedBatchId === item.batchId ? null : item.batchId
                  )}
                >
                  <td>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{item.skuName}</p>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-600">{item.batchNo}</span>
                  </td>
                  <td>
                    <span className="font-medium">
                      {item.availableQty + item.reservedQty}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                      (可用{item.availableQty})
                    </span>
                  </td>
                  <td>{getAgeBadge(item.ageDays)}</td>
                  <td>{getExpiryBadge(item.daysToExpiry)}</td>
                  <td>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {item.locationCode}
                    </span>
                  </td>
                  <td className="text-sm text-slate-600">{item.supplierName}</td>
                  <td>
                    <button
                      className="btn btn-outline text-xs py-1 px-2"
                      onClick={e => {
                        e.stopPropagation();
                        setShowBatchModal(item.batchId);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <div className="explanation-box">
          <p className="font-medium text-slate-600 mb-1">数据溯源：</p>
          <ul className="text-slate-500 space-y-0.5">
            <li>• 数据来源: ClickHouse 库存实时表 + PostgreSQL 批次主数据</li>
            <li>• 更新频率: 每15分钟同步WMS系统入库出库数据</li>
            <li>• 点击"详情"查看该批次完整的入出退流转记录</li>
          </ul>
        </div>
      </div>

      {showBatchModal && (
        <BatchDetailModal
          batchId={showBatchModal}
          onClose={() => setShowBatchModal(null)}
        />
      )}
    </div>
  );
}
