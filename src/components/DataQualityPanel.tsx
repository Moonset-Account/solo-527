'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Database, FileWarning, BarChart3, ChevronDown, Info } from 'lucide-react';
import { DataQualityInfo } from '@/lib/services/analytics';

interface DataQualityPanelProps {
  qualityInfo: DataQualityInfo;
}

export default function DataQualityPanel({ qualityInfo }: DataQualityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasIssues =
    qualityInfo.missingRate.attendance > 5 ||
    qualityInfo.missingRate.assignments > 5 ||
    qualityInfo.missingRate.quizzes > 5 ||
    qualityInfo.outlierCount.scores > 0 ||
    qualityInfo.outlierCount.attendance > 0;

  const overallQuality = hasIssues ? 'warning' : 'good';

  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden ${
      overallQuality === 'good' ? 'bg-green-50/50 border-green-200' : 'bg-amber-50/50 border-amber-200'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {overallQuality === 'good' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
          <div className="text-left">
            <p className="font-semibold text-gray-800">数据质量概览</p>
            <p className="text-xs text-gray-500">
              {overallQuality === 'good' ? '数据质量良好' : '存在数据质量问题需要关注'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QualityCard
              icon={Database}
              label="学生总数"
              value={qualityInfo.totalStudents.toString()}
              unit="人"
              status="good"
            />
            <QualityCard
              icon={Database}
              label="出勤记录"
              value={qualityInfo.totalRecords.attendance.toString()}
              unit="条"
              status="good"
            />
            <QualityCard
              icon={Database}
              label="作业记录"
              value={qualityInfo.totalRecords.assignments.toString()}
              unit="条"
              status="good"
            />
            <QualityCard
              icon={Database}
              label="测验记录"
              value={qualityInfo.totalRecords.quizzes.toString()}
              unit="条"
              status="good"
            />
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <FileWarning className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">缺失值情况</span>
            </div>
            <div className="space-y-2">
              <MissingRow
                label="出勤数据"
                rate={qualityInfo.missingRate.attendance}
                threshold={5}
              />
              <MissingRow
                label="作业数据"
                rate={qualityInfo.missingRate.assignments}
                threshold={5}
              />
              <MissingRow
                label="测验数据"
                rate={qualityInfo.missingRate.quizzes}
                threshold={5}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">异常值检测</span>
            </div>
            <div className="space-y-2">
              <OutlierRow
                label="成绩异常值"
                count={qualityInfo.outlierCount.scores}
              />
              <OutlierRow
                label="出勤异常值"
                count={qualityInfo.outlierCount.attendance}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              样本量: {qualityInfo.sampleSize} 人 | 数据更新时间:{' '}
              {new Date(qualityInfo.updateTime).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function QualityCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
}: {
  icon: any;
  label: string;
  value: string;
  unit: string;
  status: 'good' | 'warning' | 'error';
}) {
  const colors = {
    good: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${colors[status]}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-800">
        {value}
        <span className="text-xs text-gray-400 font-normal ml-1">{unit}</span>
      </p>
    </div>
  );
}

function MissingRow({ label, rate, threshold }: { label: string; rate: number; threshold: number }) {
  const isWarning = rate > threshold;
  const percentage = rate;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-20">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(percentage * 2, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium w-16 text-right ${isWarning ? 'text-amber-600' : 'text-green-600'}`}>
        {percentage}%
      </span>
    </div>
  );
}

function OutlierRow({ label, count }: { label: string; count: number }) {
  const hasOutliers = count > 0;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        hasOutliers ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
      }`}>
        {hasOutliers ? `${count} 个异常点` : '正常'}
      </span>
    </div>
  );
}
