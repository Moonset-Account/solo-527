import React from 'react';
import { CohortData } from '../../types';
import { Users, TrendingUp, Calendar } from 'lucide-react';
import * as d3 from 'd3';

interface CohortChartProps {
  data: CohortData;
}

const CohortChart: React.FC<CohortChartProps> = ({ data }) => {
  const weeks = ['week0', 'week1', 'week2', 'week3', 'week4', 'week5', 'week6', 'week7'] as const;

  const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 100]);

  const avgRetention = (weekIdx: number) => {
    const values = data
      .map((d) => d[weeks[weekIdx]])
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return 0;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Cohort 留存分析</h3>
          <p className="text-sm text-gray-500 mt-1">按注册周分组的用户留存趋势</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">W7 平均留存 {avgRetention(7)}%</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  注册周
                </div>
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-gray-50">
                <div className="flex items-center gap-2 justify-center">
                  <Users className="w-4 h-4" />
                  用户数
                </div>
              </th>
              {weeks.map((week, idx) => (
                <th key={week} className="text-center py-3 px-2 font-semibold text-gray-700 bg-gray-50 min-w-[80px]">
                  W{idx}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={row.cohort} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-800 bg-white sticky left-0 z-10">
                  {row.cohort}
                </td>
                <td className="py-3 px-4 text-center text-gray-600">
                  <span className="font-semibold">{row.cohortSize.toLocaleString()}</span>
                </td>
                {weeks.map((week, colIdx) => {
                  const value = row[week];
                  const isEmpty = value === null || value === undefined;
                  const isValid = !isEmpty && colIdx <= data.length - 1 - rowIdx;
                  
                  return (
                    <td
                      key={week}
                      className="py-2 px-2 text-center"
                    >
                      {isValid ? (
                        <div
                          className="py-2 rounded font-medium transition-transform hover:scale-105 cursor-default"
                          style={{
                            backgroundColor: colIdx === 0 ? '#eff6ff' : colorScale(value as number),
                            color: (value as number) > 50 ? 'white' : '#1e3a5f',
                          }}
                          title={`第 ${colIdx} 周留存: ${value}%`}
                        >
                          {value}%
                        </div>
                      ) : (
                        <div className="text-gray-300">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td className="py-3 px-4 font-semibold text-gray-700 sticky left-0 z-10 bg-gray-50">
                平均留存
              </td>
              <td className="py-3 px-4 text-center font-semibold text-gray-700">
                {Math.round(data.reduce((a, b) => a + b.cohortSize, 0) / data.length).toLocaleString()}
              </td>
              {weeks.map((week, idx) => (
                <td key={week} className="py-3 px-2 text-center">
                  <span className="font-semibold text-primary-600">{avgRetention(idx)}%</span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-xs text-blue-600 font-medium mb-1">W1 平均留存</div>
          <div className="text-2xl font-bold text-blue-700">{avgRetention(1)}%</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="text-xs text-indigo-600 font-medium mb-1">W2 平均留存</div>
          <div className="text-2xl font-bold text-indigo-700">{avgRetention(2)}%</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-xs text-purple-600 font-medium mb-1">W4 平均留存</div>
          <div className="text-2xl font-bold text-purple-700">{avgRetention(4)}%</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-xs text-green-600 font-medium mb-1">W7 平均留存</div>
          <div className="text-2xl font-bold text-green-700">{avgRetention(7)}%</div>
        </div>
      </div>
    </div>
  );
};

export default CohortChart;
