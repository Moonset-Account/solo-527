import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis, VictoryTooltip, VictoryLegend, VictoryTheme, VictoryVoronoiContainer } from 'victory';
import type { TrainingData, RecoveryData, FilterState } from '@shared/types';
import { EmptyState, LoadingState } from './EmptyStates';

const COLORS = ['#38BDF8', '#F97316', '#10B981', '#A855F7', '#EC4899'];

const METRIC_LABELS: Record<string, string> = {
  loadScore: '训练负荷',
  avgHeartRate: '平均心率',
  distanceKm: '距离(km)',
  paceKmPerH: '配速(km/h)',
  durationMin: '时长(分钟)',
};

interface WorkloadChartProps {
  trainingData: TrainingData[];
  filters: FilterState;
  isLoading?: boolean;
}

export function WorkloadChart({ trainingData, filters, isLoading }: WorkloadChartProps) {
  if (isLoading) return <LoadingState />;
  if (trainingData.length === 0) return <EmptyState icon="chart" title="暂无训练数据" />;

  const aggregatedData = trainingData.reduce((acc, curr) => {
    const existing = acc.find((d) => d.date === curr.date);
    if (existing) {
      existing.loadScore += curr.loadScore;
      existing.avgHeartRate = existing.avgHeartRate || curr.avgHeartRate;
      existing.distanceKm = (existing.distanceKm || 0) + (curr.distanceKm || 0);
      existing.durationMin += curr.durationMin;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as TrainingData[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activeMetrics = filters.metrics.filter((m) => aggregatedData.some((d) => d[m as keyof TrainingData] !== undefined));

  const chartData = aggregatedData.map((d) => ({
    x: new Date(d.date),
    ...Object.fromEntries(activeMetrics.map((m) => [m, d[m as keyof TrainingData]])),
  }));

  return (
    <div className="w-full h-80">
      <VictoryChart
        theme={{
          ...VictoryTheme.material,
          axis: {
            style: {
              grid: { stroke: '#334155', strokeDasharray: '4,4' },
              axis: { stroke: '#475569' },
              tickLabels: { fill: '#94A3B8', fontSize: 11 },
            },
          },
        }}
        height={320}
        padding={{ top: 30, right: 30, bottom: 40, left: 50 }}
        containerComponent={
          <VictoryVoronoiContainer
            labels={({ datum, active }) => {
              if (!active) return '';
              const parts = activeMetrics.map((m) => `${METRIC_LABELS[m] || m}: ${datum[m]}`);
              return `${new Date(datum.x).toLocaleDateString('zh-CN')}\n${parts.join('\n')}`;
            }}
            labelComponent={
              <VictoryTooltip
                style={{ fontSize: 11, fill: '#E2E8F0' }}
                flyoutStyle={{ fill: '#1E293B', stroke: '#475569' }}
                dy={-5}
              />
            }
          />
        }
        scale={{ x: 'time' }}
      >
        <VictoryLegend
          x={50}
          y={5}
          orientation="horizontal"
          gutter={15}
          data={activeMetrics.map((m, i) => ({
            name: METRIC_LABELS[m] || m,
            symbol: { fill: COLORS[i % COLORS.length] },
          }))}
          style={{ labels: { fill: '#94A3B8', fontSize: 11 } }}
        />
        <VictoryAxis
          tickFormat={(x) => new Date(x).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          style={{ grid: { stroke: '#334155' } }}
        />
        <VictoryAxis dependentAxis style={{ grid: { stroke: '#334155' } }} />
        {activeMetrics.map((metric, idx) => (
          <VictoryLine
            key={metric}
            data={chartData}
            x="x"
            y={metric}
            style={{
              data: { stroke: COLORS[idx % COLORS.length], strokeWidth: 2.5 },
            }}
            animate={{
              duration: 800,
              onLoad: { duration: 800 },
            }}
          />
        ))}
      </VictoryChart>
    </div>
  );
}

interface RecoveryChartProps {
  recoveryData: RecoveryData[];
  isLoading?: boolean;
}

export function RecoveryChart({ recoveryData, isLoading }: RecoveryChartProps) {
  if (isLoading) return <LoadingState />;
  if (recoveryData.length === 0) return <EmptyState icon="activity" title="暂无恢复数据" />;

  const sortedData = [...recoveryData]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((d) => ({
      x: new Date(d.date),
      y: d.overallScore,
      sleepScore: d.sleepScore,
      soreness: d.sorenessScore,
    }));

  return (
    <div className="w-full h-64">
      <VictoryChart
        theme={{
          ...VictoryTheme.material,
          axis: {
            style: {
              grid: { stroke: '#334155', strokeDasharray: '4,4' },
              axis: { stroke: '#475569' },
              tickLabels: { fill: '#94A3B8', fontSize: 11 },
            },
          },
        }}
        height={260}
        padding={{ top: 20, right: 20, bottom: 30, left: 40 }}
        containerComponent={
          <VictoryVoronoiContainer
            labels={({ datum, active }) => {
              if (!active) return '';
              return `${new Date(datum.x).toLocaleDateString('zh-CN')}\n恢复评分: ${datum.y}\n睡眠: ${datum.sleepScore || 'N/A'}`;
            }}
            labelComponent={
              <VictoryTooltip
                style={{ fontSize: 11, fill: '#E2E8F0' }}
                flyoutStyle={{ fill: '#1E293B', stroke: '#475569' }}
              />
            }
          />
        }
        scale={{ x: 'time' }}
        domain={{ y: [0, 100] }}
      >
        <VictoryAxis
          tickFormat={(x) => new Date(x).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        />
        <VictoryAxis dependentAxis tickValues={[0, 25, 50, 75, 100]} />
        <VictoryArea
          data={sortedData}
          x="x"
          y="y"
          style={{
            data: {
              fill: 'url(#recoveryGradient)',
              stroke: '#10B981',
              strokeWidth: 2,
            },
          }}
          animate={{
            duration: 800,
            onLoad: { duration: 800 },
          }}
        />
        <VictoryLine
          data={sortedData.map((d) => ({ ...d, y: 60 }))}
          style={{ data: { stroke: '#F97316', strokeDasharray: '5,5', strokeWidth: 1 } }}
        />
      </VictoryChart>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
