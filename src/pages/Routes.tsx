import { useEffect, useState } from 'react';
import type { ODRoute } from '@shared/types';

export default function RoutesPage() {
  const [odRoutes, setOdRoutes] = useState<ODRoute[]>([]);
  const [topRoutes, setTopRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [odRes, topRes] = await Promise.all([
          fetch('/api/routes/od'),
          fetch('/api/routes/top'),
        ]);
        const odData = await odRes.json();
        const topData = await topRes.json();
        if (odData.code === 0) setOdRoutes(odData.data);
        if (topData.code === 0) setTopRoutes(topData.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const areas = Array.from(new Set(odRoutes.flatMap(r => [r.startArea, r.endArea]))).slice(0, 6);

  const getODMatrix = () => {
    const matrix: Record<string, Record<string, number>> = {};
    areas.forEach(a => {
      matrix[a] = {};
      areas.forEach(b => {
        matrix[a][b] = 0;
      });
    });
    odRoutes.forEach(r => {
      if (areas.includes(r.startArea) && areas.includes(r.endArea)) {
        matrix[r.startArea][r.endArea] = r.count;
      }
    });
    return matrix;
  };

  const matrix = getODMatrix();
  const maxCount = Math.max(...Object.values(matrix).flatMap(r => Object.values(r)), 1);

  const getCellColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio === 0) return 'bg-gray-800/30';
    if (ratio < 0.2) return 'bg-emerald-900/40';
    if (ratio < 0.4) return 'bg-emerald-700/50';
    if (ratio < 0.6) return 'bg-accent-cyan/50';
    if (ratio < 0.8) return 'bg-accent-orange/60';
    return 'bg-red-500/60';
  };

  const formatDuration = (sec: number) => {
    const min = Math.round(sec / 60);
    return `${min}分钟`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">线路分析</h2>
        <p className="text-sm text-gray-400 mt-1">OD流向分析与热门线路排行</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 glass-card p-5">
          <h3 className="section-title mb-4">区域OD流向矩阵</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-xs text-gray-500 py-2 pr-2 text-left">起点 \ 终点</th>
                  {areas.map(area => (
                    <th key={area} className="text-xs text-gray-400 py-2 px-2 text-center font-medium">
                      {area.replace('区', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {areas.map(startArea => (
                  <tr key={startArea}>
                    <td className="text-xs text-gray-400 py-2 pr-2 font-medium">
                      {startArea.replace('区', '')}
                    </td>
                    {areas.map(endArea => (
                      <td key={endArea} className="p-1">
                        <div
                          className={`w-full aspect-square rounded ${getCellColor(matrix[startArea]?.[endArea] || 0)} 
                                      flex items-center justify-center text-xs font-mono text-white/90
                                      hover:ring-2 hover:ring-accent-cyan/50 transition-all cursor-pointer relative group`}
                        >
                          {matrix[startArea]?.[endArea] || '-'}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded 
                                        text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-gray-700">
                            {startArea} → {endArea}: {matrix[startArea]?.[endArea] || 0} 次
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <span>流量低</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-emerald-900/40" />
              <div className="w-4 h-4 rounded bg-emerald-700/50" />
              <div className="w-4 h-4 rounded bg-accent-cyan/50" />
              <div className="w-4 h-4 rounded bg-accent-orange/60" />
              <div className="w-4 h-4 rounded bg-red-500/60" />
            </div>
            <span>流量高</span>
          </div>
        </div>

        <div className="col-span-5 glass-card p-5">
          <h3 className="section-title mb-4">热门线路 TOP 15</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {topRoutes.map((route, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index < 3 ? 'bg-accent-orange/20 text-accent-orange' : 'bg-gray-700 text-gray-400'}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">
                      {route.startStation} → {route.endStation}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-accent-cyan">{route.count}</div>
                    <div className="text-xs text-gray-500">次/周</div>
                  </div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-gradient-to-r from-accent-cyan to-blue-500 h-1.5 rounded-full"
                    style={{ width: `${(route.count / (topRoutes[0]?.count || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="section-title mb-4">区域流向详情</h3>
        <div className="grid grid-cols-4 gap-4">
          {odRoutes.slice(0, 8).map((route, index) => (
            <div key={index} className="p-4 rounded-xl bg-gray-800/30 border border-dark-border">
              <div className="text-sm text-gray-400 mb-2">起 → 终</div>
              <div className="font-medium text-gray-200 mb-3">
                {route.startArea} → {route.endArea}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="stat-number !text-xl">{route.count}</div>
                  <div className="text-xs text-gray-500">骑行次数</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-accent-cyan">{formatDuration(route.avgDuration)}</div>
                  <div className="text-xs text-gray-500">平均时长</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
