'use client';

import { AlertTriangle, TrendingDown, User, Filter, Eye } from 'lucide-react';
import { StudentMetrics } from '@/lib/services/analytics';

interface AnomalyListProps {
  highRiskStudents: StudentMetrics[];
  mediumRiskStudents: StudentMetrics[];
  outlierStudents: StudentMetrics[];
  onViewStudent: (studentId: string) => void;
  onFilterByRisk: (riskLevel: 'high' | 'medium') => void;
}

export default function AnomalyList({
  highRiskStudents,
  mediumRiskStudents,
  outlierStudents,
  onViewStudent,
  onFilterByRisk,
}: AnomalyListProps) {
  const tabConfig = [
    {
      key: 'high',
      label: '高风险',
      count: highRiskStudents.length,
      data: highRiskStudents,
      color: 'text-red-600 bg-red-50',
      activeColor: 'bg-red-600 text-white',
    },
    {
      key: 'medium',
      label: '中风险',
      count: mediumRiskStudents.length,
      data: mediumRiskStudents,
      color: 'text-amber-600 bg-amber-50',
      activeColor: 'bg-amber-600 text-white',
    },
    {
      key: 'outlier',
      label: '统计异常',
      count: outlierStudents.length,
      data: outlierStudents,
      color: 'text-purple-600 bg-purple-50',
      activeColor: 'bg-purple-600 text-white',
    },
  ];

  const [activeTab, setActiveTab] = useState('high');

  const activeData = tabConfig.find((t) => t.key === activeTab)?.data || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-800">异常样本</h3>
          </div>
          <button
            onClick={() => onFilterByRisk(activeTab as 'high' | 'medium')}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Filter className="w-3 h-3" />
            仅显示此类
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === tab.key ? tab.activeColor : tab.color
              }`}
            >
              {tab.label}
              <span className="text-xs opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <TrendingDown className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">暂无{activeTab === 'high' ? '高风险' : activeTab === 'medium' ? '中风险' : '异常'}学生</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeData.map((student) => (
              <div
                key={student.studentId}
                className="px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewStudent(student.studentId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {student.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{student.studentName}</p>
                      <p className="text-xs text-gray-500">综合评分: {student.overallScore}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">出勤率</p>
                      <p
                        className={`text-sm font-semibold ${
                          student.attendanceRate >= 90
                            ? 'text-green-600'
                            : student.attendanceRate >= 70
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {student.attendanceRate}%
                      </p>
                    </div>
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 ml-12">
                  {student.absentCount > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                      缺勤{student.absentCount}次
                    </span>
                  )}
                  {student.assignmentSubmissionRate < 80 && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                      作业提交率低
                    </span>
                  )}
                  {student.quizAvgScore < 60 && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                      测验成绩低
                    </span>
                  )}
                  {student.interactionCount === 0 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      无课堂互动
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
