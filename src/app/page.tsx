'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Users,
  BookOpen,
  Download,
  Upload,
  Bell,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Database,
  ShieldAlert,
} from 'lucide-react';

import FilterBar from '@/components/FilterBar';
import RadarChart from '@/components/charts/RadarChart';
import BoxPlotChart from '@/components/charts/BoxPlotChart';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import MapboxMap from '@/components/MapboxMap';
import StudentTable from '@/components/StudentTable';
import StudentProfile from '@/components/StudentProfile';
import AnomalyList from '@/components/AnomalyList';
import DataQualityPanel from '@/components/DataQualityPanel';
import ExportPanel from '@/components/ExportPanel';
import ImportPanel from '@/components/ImportPanel';

import { AnalyticsService, FilterParams, StudentMetrics, AnomalyData } from '@/lib/services/analytics';
import { mockDataset } from '@/lib/mock/data';
import { mean } from '@/lib/utils/statistics';

interface AnalyticsResponse {
  success: boolean;
  data: {
    studentMetrics: StudentMetrics[];
    radarData: any;
    boxPlotData: any;
    attendanceTrend: any[];
    scoreTrend: any;
    leaveReasons: any[];
    questionTypeAnalysis: any[];
    anomalyData: AnomalyData;
    qualityInfo: any;
    geoData: any[];
    canViewContact: boolean;
    canImportData: boolean;
    canExportData: boolean;
    useMockData: boolean;
    permittedClassIds: string[];
    currentUser?: {
      username: string;
      roles: string[];
    };
  };
  timestamp: string;
}

export default function Home() {
  const [filters, setFilters] = useState<FilterParams>({
    classId: 'class-1',
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState<AnalyticsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const analytics = useMemo(() => new AnalyticsService(mockDataset), []);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.teacherId) params.append('teacherId', filters.teacherId);
      if (filters.weekStart) params.append('weekStart', filters.weekStart.toString());
      if (filters.weekEnd) params.append('weekEnd', filters.weekEnd.toString());
      if (filters.questionType) params.append('questionType', filters.questionType);

      const response = await fetch(`/api/analytics?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setApiData(data);
      } else {
        throw new Error(data.error || '获取数据失败');
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
      setLoadError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fallbackData = useMemo(() => {
    const studentMetrics = analytics.calculateStudentMetrics(filters);
    const radarData = analytics.getRadarChartData(filters, selectedStudentIds);
    const boxPlotData = analytics.getScoreBoxPlotData(filters);
    const attendanceTrend = analytics.getAttendanceTrendData(filters);
    const scoreTrend = analytics.getScoreTrendData(filters);
    const leaveReasons = analytics.getLeaveReasonsStat(filters);
    const questionTypeAnalysis = analytics.getQuestionTypeAnalysis(filters);
    const anomalyData = analytics.getAnomalyStudents(filters);
    const qualityInfo = analytics.getDataQualityInfo(filters);
    const geoData = analytics.getStudentGeoData(filters);

    return {
      studentMetrics,
      radarData,
      boxPlotData,
      attendanceTrend,
      scoreTrend,
      leaveReasons,
      questionTypeAnalysis,
      anomalyData,
      qualityInfo,
      geoData,
      canViewContact: false,
      canImportData: true,
      canExportData: true,
      useMockData: true,
      permittedClassIds: mockDataset.classes.map(c => c.id),
      currentUser: {
        username: '教务老师',
        roles: ['dean'],
      },
    };
  }, [analytics, filters, selectedStudentIds]);

  const data = apiData?.data || fallbackData;
  const {
    studentMetrics,
    radarData,
    boxPlotData,
    attendanceTrend,
    scoreTrend,
    leaveReasons,
    questionTypeAnalysis,
    anomalyData,
    qualityInfo,
    geoData,
    canViewContact,
    canImportData,
    canExportData,
    useMockData,
    currentUser,
  } = data;

  const viewStudentDetail = viewStudentId
    ? analytics.getStudentDetail(viewStudentId, filters)
    : null;

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleFilterByRisk = (riskLevel: 'high' | 'medium') => {
    const riskStudents =
      riskLevel === 'high'
        ? anomalyData.highRiskStudents
        : anomalyData.mediumRiskStudents;
    setSelectedStudentIds(riskStudents.map((s) => s.studentId));
  };

  const handleReset = () => {
    setFilters({ classId: 'class-1' });
    setSelectedStudentIds([]);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const avgAttendance = mean(studentMetrics.map((s) => s.attendanceRate));
  const avgAssignmentScore = mean(studentMetrics.map((s) => s.assignmentAvgScore));
  const avgQuizScore = mean(studentMetrics.map((s) => s.quizAvgScore));
  const highRiskCount = anomalyData.highRiskStudents.length;

  const statsCards = [
    {
      title: '平均出勤率',
      value: `${avgAttendance.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
      trend: '+2.3%',
      trendUp: true,
    },
    {
      title: '作业均分',
      value: avgAssignmentScore.toFixed(1),
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      trend: '+1.5',
      trendUp: true,
    },
    {
      title: '测验均分',
      value: avgQuizScore.toFixed(1),
      icon: BarChart3,
      color: 'from-purple-500 to-violet-600',
      trend: '-0.8',
      trendUp: false,
    },
    {
      title: '高风险学生',
      value: highRiskCount.toString(),
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600',
      unit: '人',
      trend: '需关注',
      trendUp: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">班级出勤与学习表现分析工作台</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">教务管理 · 数据驱动决策</p>
                  {useMockData && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                      <Database className="w-3 h-3" />
                      演示数据
                    </span>
                  )}
                  {!useMockData && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      <Database className="w-3 h-3" />
                      实时数据
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canImportData && (
                <button
                  onClick={() => setShowImport(true)}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="批量导入"
                >
                  <Upload className="w-5 h-5" />
                </button>
              )}
              {canExportData && (
                <button
                  onClick={() => setShowExport(true)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="导出数据"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="刷新数据"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {currentUser?.username?.[0] || '教'}
              </div>
            </div>
          </div>

          {loadError && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>数据加载失败: {loadError}，已切换到演示数据</span>
              <button
                onClick={handleRefresh}
                className="ml-auto text-blue-600 hover:text-blue-700 font-medium"
              >
                重试
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onReset={handleReset}
          onRefresh={handleRefresh}
          canViewContact={canViewContact}
          sampleSize={qualityInfo.sampleSize}
          updateTime={qualityInfo.updateTime}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {card.value}
                      <span className="text-sm font-normal text-gray-400 ml-1">{card.unit}</span>
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <span
                    className={`text-xs font-medium ${
                      card.trendUp ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {card.trend}
                  </span>
                  <span className="text-xs text-gray-400">较上周</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <RadarChart data={radarData} title="综合能力雷达图" height={320} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <BoxPlotChart data={boxPlotData} title="成绩分布箱线图" height={320} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <LineChart
                datasets={[
                  { name: '出勤率', data: attendanceTrend, color: '#10b981' },
                ]}
                title="出勤趋势"
                yAxisName="出勤率(%)"
                yMin={60}
                yMax={100}
                height={280}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <LineChart
                  datasets={[
                    { name: '作业均分', data: scoreTrend.assignmentTrend, color: '#3b82f6' },
                    { name: '测验均分', data: scoreTrend.quizTrend, color: '#8b5cf6' },
                  ]}
                  title="成绩趋势"
                  yAxisName="分数"
                  yMin={0}
                  yMax={100}
                  height={280}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <PieChart
                  data={leaveReasons.map((r) => ({
                    name: r.label,
                    value: r.count,
                    color: r.color,
                  }))}
                  title="请假原因分布"
                  height={280}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">题型得分分析</h3>
              <div className="space-y-3">
                {questionTypeAnalysis.map((qt) => (
                  <div key={qt.type} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-20">{qt.label}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${qt.avgPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                      {qt.avgPercentage}%
                    </span>
                    <span className="text-xs text-gray-400 w-16">平均 {qt.avgScore}分</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">学生地理分布</h3>
              <MapboxMap
                students={geoData}
                onStudentClick={setViewStudentId}
                height={350}
              />
            </div>

            <StudentTable
              students={studentMetrics}
              onViewStudent={setViewStudentId}
              onSelectStudent={handleSelectStudent}
              selectedStudentIds={selectedStudentIds}
              canViewContact={canViewContact}
            />
          </div>

          <div className="space-y-6">
            <DataQualityPanel qualityInfo={qualityInfo} />
            <AnomalyList
              highRiskStudents={anomalyData.highRiskStudents}
              mediumRiskStudents={anomalyData.mediumRiskStudents}
              outlierStudents={anomalyData.outlierStudents}
              onViewStudent={setViewStudentId}
              onFilterByRisk={handleFilterByRisk}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                数据更新时间
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">最后同步时间</span>
                  <span className="font-medium text-gray-700">
                    {new Date(qualityInfo.updateTime).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">数据范围</span>
                  <span className="font-medium text-gray-700">2023-2024学年 第2学期</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前样本量</span>
                  <span className="font-medium text-gray-700">{qualityInfo.sampleSize} 人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前筛选</span>
                  <span className="font-medium text-blue-600">
                    {filters.classId ? '已应用筛选' : '无筛选'}
                  </span>
                </div>
                {currentUser && (
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-500">当前用户</span>
                    <span className="font-medium text-gray-700">{currentUser.username}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-5 text-white">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                快捷操作
              </h3>
              <div className="space-y-2">
                {canExportData && (
                  <button
                    onClick={() => setShowExport(true)}
                    className="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    导出分析报告
                  </button>
                )}
                {canImportData && (
                  <button
                    onClick={() => setShowImport(true)}
                    className="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    批量导入数据
                  </button>
                )}
                <button
                  onClick={handleRefresh}
                  className="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  刷新数据
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {viewStudentDetail && (
        <StudentProfile
          metrics={viewStudentDetail.metrics!}
          studentDetail={{
            gender: viewStudentDetail.student.gender,
            phone: viewStudentDetail.student.phone,
            email: viewStudentDetail.student.email,
            className: viewStudentDetail.student.className,
            studentIdNumber: viewStudentDetail.student.studentId,
          }}
          canViewContact={canViewContact}
          onClose={() => setViewStudentId(null)}
        />
      )}

      <ExportPanel
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        students={studentMetrics}
        qualityInfo={qualityInfo}
        filters={filters}
        canViewContact={canViewContact}
      />

      <ImportPanel
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportSuccess={handleRefresh}
      />
    </div>
  );
}
