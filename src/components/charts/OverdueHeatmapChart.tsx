import type { OverdueHeatmapItem } from '../../../shared/types.js';

interface OverdueHeatmapChartProps {
  data: OverdueHeatmapItem[];
  loading?: boolean;
}

export function OverdueHeatmapChart({ data, loading }: OverdueHeatmapChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-gray-400">暂无数据</p>
      </div>
    );
  }

  const branches = [...new Set(data.map((d) => d.branch))];
  const hours = [8, 10, 12, 14, 16, 18, 20];

  const getCount = (branch: string, hour: number) => {
    const item = data.find((d) => d.branch === branch && d.hour === hour);
    return item?.count || 0;
  };

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-50';
    const intensity = count / maxCount;
    if (intensity < 0.2) return 'bg-danger-100';
    if (intensity < 0.4) return 'bg-danger-200';
    if (intensity < 0.6) return 'bg-danger-300';
    if (intensity < 0.8) return 'bg-danger-400';
    return 'bg-danger-500';
  };

  const getTextColor = (count: number) => {
    const intensity = count / maxCount;
    return intensity > 0.5 ? 'text-white' : 'text-gray-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-gray-500 py-2 px-2">分馆\时段</th>
            {hours.map((h) => (
              <th key={h} className="text-center text-xs font-medium text-gray-500 py-2 px-1">
                {h}:00
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => (
            <tr key={branch}>
              <td className="text-xs font-medium text-gray-700 py-2 px-2 whitespace-nowrap">
                {branch}
              </td>
              {hours.map((hour) => {
                const count = getCount(branch, hour);
                return (
                  <td
                    key={`${branch}-${hour}`}
                    className={`p-1 text-center`}
                  >
                    <div
                      className={`w-full aspect-square rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-105 ${getColor(count)} ${getTextColor(count)}`}
                      title={`${branch} ${hour}:00 - ${count}笔逾期`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
        <span>低</span>
        <div className="flex gap-0.5">
          {['bg-danger-100', 'bg-danger-200', 'bg-danger-300', 'bg-danger-400', 'bg-danger-500'].map(
            (color, i) => (
              <div key={i} className={`w-4 h-4 rounded ${color}`} />
            )
          )}
        </div>
        <span>高</span>
      </div>
    </div>
  );
}
