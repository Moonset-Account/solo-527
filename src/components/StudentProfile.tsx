'use client';

import { X, User, Calendar, CheckCircle, AlertTriangle, BookOpen, MessageSquare, Award, TrendingUp } from 'lucide-react';
import { StudentMetrics } from '@/lib/services/analytics';
import { maskPhone, maskEmail } from '@/lib/auth';
import { DATA_DICTIONARY } from '@/lib/constants/data-dictionary';

interface StudentProfileProps {
  metrics: StudentMetrics;
  studentDetail: {
    gender?: string;
    phone?: string;
    email?: string;
    className?: string;
    studentIdNumber?: string;
  } | null;
  canViewContact: boolean;
  onClose: () => void;
}

export default function StudentProfile({ metrics, studentDetail, canViewContact, onClose }: StudentProfileProps) {
  const riskConfig = {
    low: { label: '低风险', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    medium: { label: '中风险', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    high: { label: '高风险', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };

  const risk = riskConfig[metrics.riskLevel];
  const RiskIcon = risk.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {metrics.studentName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{metrics.studentName}</h2>
              <p className="text-sm text-gray-500">学号: {metrics.studentIdNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${risk.color}`}>
              <RiskIcon className="w-4 h-4" />
              {risk.label}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              综合评分: <span className="font-semibold text-gray-800">{metrics.overallScore}</span>
            </div>
          </div>

          {studentDetail && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">班级</p>
                  <p className="text-sm font-medium text-gray-700">{studentDetail.className}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">性别</p>
                  <p className="text-sm font-medium text-gray-700">
                    {studentDetail.gender === 'male' ? '男' : '女'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">联系电话</p>
                  <p className="text-sm font-medium text-gray-700">
                    {canViewContact ? studentDetail.phone : maskPhone(studentDetail.phone)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">邮箱</p>
                  <p className="text-sm font-medium text-gray-700">
                    {canViewContact ? studentDetail.email : maskEmail(studentDetail.email)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">学习表现</h3>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                icon={CheckCircle}
                label="出勤率"
                value={`${metrics.attendanceRate}%`}
                color={metrics.attendanceRate >= 90 ? 'green' : metrics.attendanceRate >= 70 ? 'amber' : 'red'}
              />
              <MetricCard
                icon={AlertTriangle}
                label="缺勤次数"
                value={metrics.absentCount.toString()}
                color={metrics.absentCount <= 2 ? 'green' : metrics.absentCount <= 5 ? 'amber' : 'red'}
              />
              <MetricCard
                icon={BookOpen}
                label="作业均分"
                value={metrics.assignmentAvgScore.toString()}
                color={metrics.assignmentAvgScore >= 80 ? 'green' : metrics.assignmentAvgScore >= 60 ? 'amber' : 'red'}
              />
              <MetricCard
                icon={Award}
                label="作业提交率"
                value={`${metrics.assignmentSubmissionRate}%`}
                color={metrics.assignmentSubmissionRate >= 90 ? 'green' : metrics.assignmentSubmissionRate >= 70 ? 'amber' : 'red'}
              />
              <MetricCard
                icon={BookOpen}
                label="测验均分"
                value={metrics.quizAvgScore.toString()}
                color={metrics.quizAvgScore >= 80 ? 'green' : metrics.quizAvgScore >= 60 ? 'amber' : 'red'}
              />
              <MetricCard
                icon={MessageSquare}
                label="课堂互动"
                value={`${metrics.interactionCount}次`}
                color="blue"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: 'green' | 'amber' | 'red' | 'blue';
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
