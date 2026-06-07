import { useEffect, useState } from 'react';
import { Bell, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from '@/services/api';
import { useMetaStore, useUIStore } from '@/store';
import dayjs from 'dayjs';

export default function Header() {
  const { dataQuality, setDataQuality } = useMetaStore();
  const { setShowDataQualityWarning } = useUIStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDataQuality();
    const interval = setInterval(fetchDataQuality, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDataQuality = async () => {
    try {
      const data = await api.getDataQualityReport();
      setDataQuality(data);
      if (data.isUpdateFailed || data.completeness < 90) {
        setShowDataQualityWarning(true);
      }
    } catch (error) {
      console.error('Failed to fetch data quality:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDataQuality();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getQualityStatus = () => {
    if (!dataQuality) return { icon: Clock, color: 'text-gray-400', text: '检查中' };
    if (dataQuality.isUpdateFailed) return { icon: AlertCircle, color: 'text-red-500', text: '更新失败' };
    if (dataQuality.completeness < 90) return { icon: AlertCircle, color: 'text-yellow-500', text: '数据不完整' };
    return { icon: CheckCircle, color: 'text-green-500', text: '数据正常' };
  };

  const status = getQualityStatus();
  const StatusIcon = status.icon;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-gray-800">冷链物流温控追踪分析</h1>
        <p className="text-sm text-gray-500">质量管理人员专用分析平台</p>
      </div>

      <div className="flex items-center gap-4">
        {dataQuality && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <StatusIcon className={`w-4 h-4 ${status.color}`} />
            <span className="text-sm text-gray-600">{status.text}</span>
            <span className="text-xs text-gray-400">
              更新于 {dayjs(dataQuality.updateTime).format('HH:mm')}
            </span>
            <span className="text-xs text-gray-400">
              完整度 {dataQuality.completeness.toFixed(1)}%
            </span>
          </div>
        )}

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {dataQuality?.isUpdateFailed && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">质</span>
          </div>
          <span className="text-sm font-medium text-gray-700">质量管理员</span>
        </div>
      </div>
    </header>
  );
}
