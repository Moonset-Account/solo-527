import React, { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Select } from 'antd';
import { GitCompare } from 'lucide-react';
import { CohortMetric } from '../../data/types';
import { COHORT_COLORS } from '../../data/constants';

const { Option } = Select;

interface CohortComparisonChartProps {
  data: CohortMetric[];
}

const METRIC_KEYS = [
  { key: 'videoCompletionRate', label: '视频完成率' },
  { key: 'homeworkSubmissionRate', label: '作业提交率' },
  { key: 'quizPassRate', label: '测验通过率' },
  { key: 'discussionParticipationRate', label: '讨论参与率' },
  { key: 'certificateRate', label: '证书获取率' },
];

export const CohortComparisonChart: React.FC<CohortComparisonChartProps> = ({ data }) => {
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>(
    data.slice(0, 2).map((d) => d.cohortId)
  );
  
  const radarData = METRIC_KEYS.map((metric) => {
    const item: Record<string, any> = { metric: metric.label };
    data.forEach((cohort) => {
      const value = (cohort as any)[metric.key];
      item[cohort.cohortName] = value ? Math.round(value * 100) : 0;
    });
    return item;
  });
  
  const filteredData = data.filter((d) => selectedCohorts.includes(d.cohortId));
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <GitCompare size={18} className="text-blue-600" />
            班期对比分析
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">多班期核心指标横向对比</p>
        </div>
        <Select
          mode="multiple"
          placeholder="选择班期对比"
          value={selectedCohorts}
          onChange={setSelectedCohorts}
          style={{ width: 250 }}
          size="small"
          maxTagCount={2}
        >
          {data.map((cohort) => (
            <Option key={cohort.cohortId} value={cohort.cohortId}>
              {cohort.cohortName} (n={cohort.sampleSize})
            </Option>
          ))}
        </Select>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E5E6EB" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fontSize: 11, fill: '#4E5969' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#86909C' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E6EB',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            {filteredData.map((cohort, index) => (
              <Radar
                key={cohort.cohortId}
                name={cohort.cohortName}
                dataKey={cohort.cohortName}
                stroke={COHORT_COLORS[index % COHORT_COLORS.length]}
                fill={COHORT_COLORS[index % COHORT_COLORS.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
