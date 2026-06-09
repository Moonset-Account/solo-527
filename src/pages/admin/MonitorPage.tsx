import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Gauge,
  Activity,
  AlertTriangle,
  Zap,
  Clock,
  Server,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import { mockApiCallLogs } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export default function MonitorPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const logs = mockApiCallLogs;

  const totalCalls = logs.length;
  const totalTokens = logs.reduce((s, l) => s + l.totalTokens, 0);
  const avgLatency = Math.round(logs.reduce((s, l) => s + l.latencyMs, 0) / logs.length);
  const errorRate = ((logs.filter((l) => l.statusCode >= 400).length / logs.length) * 100).toFixed(1);
  const rateLimitHits = logs.filter((l) => l.statusCode === 429).length;

  const timeSeriesOption = useMemo(() => {
    const buckets: Record<string, { calls: number; errors: number; tokens: number; latency: number }> = {};
    logs.forEach((l) => {
      const d = new Date(l.timestamp);
      const key = `${d.getHours().toString().padStart(2, '0')}:${Math.floor(d.getMinutes() / 30) * 30 === 0 ? '00' : '30'}`;
      if (!buckets[key]) buckets[key] = { calls: 0, errors: 0, tokens: 0, latency: 0 };
      buckets[key].calls++;
      if (l.statusCode >= 400) buckets[key].errors++;
      buckets[key].tokens += l.totalTokens;
      buckets[key].latency += l.latencyMs;
    });
    const keys = Object.keys(buckets).sort();
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['调用次数', '错误数', 'Token消耗', '平均延迟(ms)'], top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 40, right: 50, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: keys, axisLabel: { fontSize: 11 } },
      yAxis: [
        { type: 'value', axisLabel: { fontSize: 11 }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
        { type: 'value', axisLabel: { fontSize: 11 }, splitLine: { show: false } },
      ],
      series: [
        {
          name: '调用次数',
          type: 'line',
          smooth: true,
          data: keys.map((k) => buckets[k].calls),
          itemStyle: { color: '#1e3a8a' },
          areaStyle: { color: 'rgba(30, 58, 138, 0.1)' },
          lineStyle: { width: 3 },
        },
        {
          name: '错误数',
          type: 'bar',
          data: keys.map((k) => buckets[k].errors),
          itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
          barWidth: 12,
        },
        {
          name: 'Token消耗',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: keys.map((k) => buckets[k].tokens),
          itemStyle: { color: '#f97316' },
          lineStyle: { width: 2, type: 'dashed' },
        },
        {
          name: '平均延迟(ms)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: keys.map((k) => Math.round(buckets[k].latency / Math.max(1, buckets[k].calls))),
          itemStyle: { color: '#8b5cf6' },
          lineStyle: { width: 2 },
        },
      ],
    };
  }, [logs]);

  const statusPieOption = useMemo(() => {
    const counts: Record<number, number> = {};
    logs.forEach((l) => {
      const code = Math.floor(l.statusCode / 100) * 100;
      counts[code] = (counts[code] || 0) + 1;
    });
    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['55%', '80%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{c}', fontSize: 11 },
        data: [
          { value: counts[200] || 0, name: '2xx 成功', itemStyle: { color: '#10b981' } },
          { value: counts[400] || 0, name: '4xx 限流', itemStyle: { color: '#f97316' } },
          { value: counts[500] || 0, name: '5xx 错误', itemStyle: { color: '#ef4444' } },
        ],
      }],
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">调用监控</h1>
          <p className="text-sm text-slate-500 mt-1">实时 API 调用量、延迟与速率限制告警</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <div className="flex rounded-xl bg-slate-100 p-1">
            {['1h', '6h', '24h', '7d'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  timeRange === t
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
        {[
          { label: '总调用量', value: totalCalls.toLocaleString(), unit: '次', icon: Zap, gradient: 'from-blue-500 via-primary-500 to-primary-700', trend: '+12.5%' },
          { label: 'Token 消耗', value: (totalTokens / 1000).toFixed(1) + 'k', icon: DollarSign, gradient: 'from-emerald-400 to-teal-600', trend: '+8.2%' },
          { label: '平均延迟', value: avgLatency + 'ms', icon: Clock, gradient: 'from-violet-500 to-purple-700', trend: '-3.1%', good: true },
          { label: '错误率', value: errorRate + '%', icon: AlertTriangle, gradient: parseFloat(errorRate) > 5 ? 'from-rose-500 to-red-600' : 'from-amber-400 to-orange-600', trend: '+0.3%', good: false },
          { label: '限流触发', value: rateLimitHits, unit: '次', icon: ShieldAlert, gradient: rateLimitHits > 5 ? 'from-red-500 to-rose-700' : 'from-slate-400 to-slate-600', trend: '正常' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-5 hover:shadow-md transition-all">
              <div className={cn('absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-10 bg-gradient-to-br', s.gradient)} />
              <div className="relative flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform', s.gradient)}>
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
              </div>
              <div className="relative">
                <p className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  {s.value}
                  <span className="text-xs font-normal text-slate-400 ml-1">{s.unit || ''}</span>
                </p>
                <p className={cn(
                  'text-[11px] mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md',
                  s.good
                    ? 'bg-emerald-50 text-emerald-700'
                    : parseFloat(s.trend) > 5
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
                )}>
                  <TrendingUp className={cn('h-3 w-3', s.good ? '' : 'rotate-180')} />
                  {s.trend}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {rateLimitHits > 3 && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 border border-rose-200/70 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
          <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              ⚠️ 速率限制告警
              <span className="px-2 py-0.5 text-xs rounded-md bg-rose-100 text-rose-700 font-bold">
                {rateLimitHits} 次触发
              </span>
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              检测到最近时段 API 调用频繁触发 429 速率限制，建议：① 降低并发请求数 ② 启用请求队列 ③ 联系 OpenAI 提升额度
            </p>
          </div>
          <button className="flex-shrink-0 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 shadow-sm shadow-rose-500/30 transition-all">
            查看详情
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">调用时间序列</h2>
              <p className="text-xs text-slate-500">按时间段聚合的多维指标</p>
            </div>
          </div>
          <ReactECharts option={timeSeriesOption} style={{ height: 320 }} />
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Gauge className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">状态码分布</h2>
                <p className="text-xs text-slate-500">HTTP 响应码</p>
              </div>
            </div>
            <ReactECharts option={statusPieOption} style={{ height: 200 }} />
          </div>

          <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Server className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">系统健康度</h2>
                <p className="text-xs text-slate-500">核心服务状态</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { name: 'LLM API', status: 'ok', latency: '1.2s', uptime: '99.8%' },
                { name: '数据库 (SQLite)', status: 'ok', latency: '8ms', uptime: '100%' },
                { name: 'Redis 缓存', status: 'warn', latency: '25ms', uptime: '98.5%' },
                { name: '向量检索', status: 'ok', latency: '45ms', uptime: '99.9%' },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      'relative flex h-2.5 w-2.5',
                      s.status === 'ok' ? '' : 'animate-pulse'
                    )}>
                      <span className={cn(
                        'absolute inline-flex h-full w-full rounded-full opacity-40',
                        s.status === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'
                      )} />
                      <span className={cn(
                        'relative inline-flex rounded-full h-2.5 w-2.5',
                        s.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
                      )} />
                    </span>
                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>延迟 {s.latency}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-md font-semibold',
                      parseFloat(s.uptime) >= 99.9 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    )}>
                      {s.uptime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Server className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">最近调用日志</h2>
              <p className="text-xs text-slate-500">按时间倒序 · 最近 50 条</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50/80 uppercase tracking-wider text-slate-500 sticky top-0 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left font-medium">时间</th>
                <th className="px-4 py-3 text-left font-medium">用户</th>
                <th className="px-4 py-3 text-left font-medium">端点</th>
                <th className="px-4 py-3 text-left font-medium">模型</th>
                <th className="px-4 py-3 text-right font-medium">Tokens</th>
                <th className="px-4 py-3 text-right font-medium">延迟</th>
                <th className="px-4 py-3 text-center font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...logs].reverse().slice(0, 30).map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleTimeString('zh-CN')}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">User #{l.userId}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 truncate max-w-[160px]">{l.endpoint}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 truncate max-w-[180px]">{l.model}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{l.totalTokens}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{l.latencyMs}ms</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-md font-mono font-semibold',
                      l.statusCode === 200
                        ? 'bg-emerald-100 text-emerald-700'
                        : l.statusCode === 429
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-rose-100 text-rose-700'
                    )}>
                      {l.statusCode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
