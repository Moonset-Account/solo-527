import React from 'react';
import { FilterState, CleanerInfo } from '../types';

interface Props {
  filters: FilterState;
  cleaners: CleanerInfo[];
  onUpdate: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  onExport: () => void;
}

export default function FilterBar({ filters, cleaners, onUpdate, onReset, onExport }: Props) {
  const floors = Array.from({ length: 8 }, (_, i) => i + 3);

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>起始日期</label>
        <input
          type="date"
          value={filters.start_date}
          onChange={e => onUpdate('start_date', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>结束日期</label>
        <input
          type="date"
          value={filters.end_date}
          onChange={e => onUpdate('end_date', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>楼层</label>
        <select
          value={filters.floor ?? ''}
          onChange={e => onUpdate('floor', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">全部</option>
          {floors.map(f => (
            <option key={f} value={f}>{f}F</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>班次</label>
        <select
          value={filters.shift ?? ''}
          onChange={e => onUpdate('shift', e.target.value || null)}
        >
          <option value="">全部</option>
          <option value="morning">早班</option>
          <option value="afternoon">中班</option>
          <option value="evening">晚班</option>
        </select>
      </div>
      <div className="filter-group">
        <label>房型</label>
        <select
          value={filters.is_vip === null ? '' : filters.is_vip ? 'vip' : 'normal'}
          onChange={e => {
            const v = e.target.value;
            onUpdate('is_vip', v === '' ? null : v === 'vip');
          }}
        >
          <option value="">全部</option>
          <option value="vip">VIP房</option>
          <option value="normal">普通房</option>
        </select>
      </div>
      <div className="filter-group">
        <label>延迟退房</label>
        <select
          value={filters.is_late_checkout === null ? '' : filters.is_late_checkout ? 'yes' : 'no'}
          onChange={e => {
            const v = e.target.value;
            onUpdate('is_late_checkout', v === '' ? null : v === 'yes');
          }}
        >
          <option value="">全部</option>
          <option value="yes">仅延迟退房</option>
          <option value="no">排除延迟退房</option>
        </select>
      </div>
      <div className="filter-group">
        <label>保洁员</label>
        <select
          value={filters.cleaner_id ?? ''}
          onChange={e => onUpdate('cleaner_id', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">全部</option>
          {cleaners.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <button className="btn btn-secondary" onClick={onReset}>重置</button>
      <button className="btn btn-export" onClick={onExport}>📊 导出周报</button>
    </div>
  );
}
