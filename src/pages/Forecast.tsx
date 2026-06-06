import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import type { ForecastPoint, WeatherImpact } from '@shared/types';
import { AlertTriangle, CloudRain, Sun, CloudSnow } from 'lucide-react';

export default function Forecast() {
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherImpact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [forecastRes, weatherRes] = await Promise.all([
          fetch('/api/forecast/peak?hours=48'),
          fetch('/api/forecast/weather'),
        ]);
        const forecastResult = await forecastRes.json();
        const weatherResult = await weatherRes.json();
        if (forecastResult.code === 0) setForecastData(forecastResult.data);
        if (weatherResult.code === 0) setWeatherData(weatherResult.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = forecastData.map(p => ({
    ...p,
    timeLabel: new Date(p.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    isPeak: new Date(p.time).getHours() >= 7 && new Date(p.time).getHours() <= 9 ||
            new Date(p.time).getHours() >= 17 && new Date(p.time).getHours() <= 19,
    actualValue: p.isActual ? p.value : null,
    forecastValue: !p.isActual ? p.value : null,
  }));

  const weatherIcons: Record<string, any> = {
    '晴': Sun,
    '多云': CloudRain,
    '阴': CloudRain,
    '小雨': CloudRain,
    '中雨': CloudRain,
    '大雪': CloudSnow,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">预测中心</h2>
        <p className="text-sm text-gray-400 mt-1">骑行量峰值预测与天气影响分析</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '今日预计骑行量', value: '12,450', change: '+8.3%', trend: 'up', unit: '次' },
          { label: '早高峰预计峰值', value: '08:30', change: '提前15分钟', trend: 'up', unit: '' },
          { label: '晚高峰预计峰值', value: '18:15', change: '延迟10分钟', trend: 'down', unit: '' },
        ].map((item, i) => (
          <div key={i} className="glass-card p-5">
            <p className="text-sm text-gray-400">{item.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="stat-number">{item.value}</span>
              <span className="text-sm text-gray-500">{item.unit}</span>
            </div>
            <p className={`text-xs mt-2 ${item.trend === 'up' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {item.change}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">48小时骑行量预测</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-accent-cyan"></div>
              <span className="text-gray-400">实际值</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-accent-cyan border-dashed border-t-2 border-accent-cyan/50"></div>
              <span className="text-gray-400">预测值</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent-cyan/20 rounded"></div>
              <span className="text-gray-400">置信区间</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="timeLabel"
                stroke="#6b7280"
                fontSize={10}
                interval={3}
              />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                }}
                labelFormatter={(label) => `时间: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="transparent"
                fill="#00B4D8"
                fillOpacity={0.08}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="transparent"
                fill="#0a0f1a"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="actualValue"
                stroke="#00B4D8"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="forecastValue"
                stroke="#00B4D8"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                connectNulls={true}
              />
              {chartData.filter(d => d.anomaly).map((d, i) => (
                <g key={i} transform={`translate(${i * 10}, 0)`}>
                  <circle cx={0} cy={100} r={4} fill="#EF4444" />
                </g>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {chartData.filter(d => d.anomaly).length > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm text-amber-300">
              异常提示：{chartData.find(d => d.anomaly)?.anomaly}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 glass-card p-5">
          <h3 className="section-title mb-4">天气影响分析</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weatherData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="type" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1f2937',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="avgTrips" fill="#00B4D8" radius={[4, 4, 0, 0]} name="平均骑行量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-5 glass-card p-5">
          <h3 className="section-title mb-4">天气影响系数</h3>
          <div className="space-y-3">
            {weatherData.map((w, i) => {
              const Icon = weatherIcons[w.type] || Sun;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                  <div className={`p-2 rounded-lg ${w.impactFactor > 0.7 ? 'bg-emerald-500/20 text-emerald-400' : w.impactFactor > 0.4 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{w.type}</span>
                      <span className="font-mono text-sm font-medium text-accent-cyan">{w.impactFactor.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${w.impactFactor > 0.7 ? 'bg-emerald-500' : w.impactFactor > 0.4 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${w.impactFactor * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
