import { useState } from 'react';
import dayjs from 'dayjs';

interface SearchFilterProps {
  filters: Record<string, unknown>;
  onChange: (filters: Record<string, unknown>) => void;
  onSearch: () => void;
  showDateRange?: boolean;
  showStatus?: boolean;
  showHandler?: boolean;
  showAssignee?: boolean;
  showKeyword?: boolean;
  statusOptions?: Array<{ value: string; label: string }>;
  handlerOptions?: Array<{ value: number; label: string }>;
  assigneeOptions?: Array<{ value: number; label: string }>;
  extraFilters?: React.ReactNode;
}

export default function SearchFilter({
  filters,
  onChange,
  onSearch,
  showDateRange = true,
  showStatus = true,
  showHandler = false,
  showAssignee = false,
  showKeyword = true,
  statusOptions = [],
  handlerOptions = [],
  assigneeOptions = [],
  extraFilters,
}: SearchFilterProps) {
  const [keyword, setKeyword] = useState((filters.keyword as string) || '');
  const [status, setStatus] = useState((filters.status as string) || '');
  const [handlerId, setHandlerId] = useState((filters.consultantId as number) || '');
  const [assigneeId, setAssigneeId] = useState((filters.assigneeId as number) || '');
  const [startDate, setStartDate] = useState(
    filters.startDate ? dayjs(filters.startDate as string).format('YYYY-MM-DD') : ''
  );
  const [endDate, setEndDate] = useState(
    filters.endDate ? dayjs(filters.endDate as string).format('YYYY-MM-DD') : ''
  );

  const handleSearch = () => {
    const newFilters: Record<string, unknown> = {};
    if (keyword) newFilters.keyword = keyword;
    if (status) newFilters.status = status;
    if (handlerId) newFilters.consultantId = Number(handlerId);
    if (assigneeId) newFilters.assigneeId = Number(assigneeId);
    if (startDate) newFilters.startDate = startDate;
    if (endDate) newFilters.endDate = endDate;
    onChange(newFilters);
    onSearch();
  };

  const handleReset = () => {
    setKeyword('');
    setStatus('');
    setHandlerId('');
    setAssigneeId('');
    setStartDate('');
    setEndDate('');
    onChange({});
    onSearch();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {showKeyword && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关键字</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键字搜索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        )}

        {showStatus && statusOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showHandler && handlerOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">处理人</label>
            <select
              value={handlerId}
              onChange={(e) => setHandlerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部处理人</option>
              {handlerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showAssignee && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">处理人</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部处理人</option>
              {assigneeOptions.length > 0 ? (
                assigneeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="">请先加载用户列表</option>
                </>
              )}
            </select>
          </div>
        )}

        {showDateRange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {showDateRange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {extraFilters}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          重置
        </button>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          搜索
        </button>
      </div>
    </div>
  );
}
