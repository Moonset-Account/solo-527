import React from 'react';
import { AlertTriangle, Clock, MapPin, ChevronRight } from 'lucide-react';
import { WaterQualityRecord } from '@/types';
import { INDICATOR_STANDARDS } from '@/data/indicators';
import { getPointById, formatDateTime, getExceedRecords } from '@/utils/dataProcessing';
import { useChartInteractionStore } from '@/store/useChartInteractionStore';
import { usePermissionStore } from '@/store/usePermissionStore';
import { EmptyState } from '../common/EmptyState';

interface ExceedRecordListProps {
  records: WaterQualityRecord[];
  maxItems?: number;
}

export const ExceedRecordList: React.FC<ExceedRecordListProps> = ({ records, maxItems = 10 }) => {
  const exceedRecords = getExceedRecords(records).slice(0, maxItems);
  const { setSelectedPointId, setHighlightedTime } = useChartInteractionStore();
  const { canViewExceedDetail } = usePermissionStore();

  const handleRecordClick = (record: WaterQualityRecord) => {
    setSelectedPointId(record.pointId);
    setHighlightedTime(record.sampleTime);
  };

  if (exceedRecords.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-emerald-600" />
          <h3 className="font-semibold text-zinc-900">超标记录</h3>
        </div>
        <EmptyState 
          type="no-data" 
          title="暂无超标记录" 
          description="当前筛选条件下所有监测数据均达标"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-rose-600" />
          <h3 className="font-semibold text-zinc-900">超标记录</h3>
          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">
            {exceedRecords.length}
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {exceedRecords.map(record => {
          const point = getPointById(record.pointId);
          return (
            <button
              key={record.id}
              onClick={() => handleRecordClick(record)}
              className="w-full p-3 border border-zinc-100 rounded-lg hover:bg-zinc-50 hover:border-zinc-200 transition-all text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={12} className="text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-800">
                      {point?.name || '未知采样点'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-xs rounded">
                      超标
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                    <Clock size={12} />
                    <span>{formatDateTime(record.sampleTime)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {record.exceedIndicators.map(ind => (
                      <span 
                        key={ind}
                        className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-xs rounded"
                      >
                        {INDICATOR_STANDARDS[ind].name}: {record[ind]}{INDICATOR_STANDARDS[ind].unit}
                      </span>
                    ))}
                  </div>
                  {canViewExceedDetail && (
                    <p className="text-xs text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      点击查看详情 →
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="text-zinc-400 mt-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
