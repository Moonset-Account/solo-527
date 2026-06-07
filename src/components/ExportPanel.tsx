'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Eye, EyeOff, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { StudentMetrics, DataQualityInfo, FilterParams } from '@/lib/services/analytics';
import { maskPhone, maskEmail } from '@/lib/auth';
import { generatePdfBlob } from './PdfReport';
import { mockDataset } from '@/lib/mock/data';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentMetrics[];
  qualityInfo: DataQualityInfo;
  filters: FilterParams;
  canViewContact: boolean;
}

export default function ExportPanel({
  isOpen,
  onClose,
  students,
  qualityInfo,
  filters,
  canViewContact,
}: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [hideContact, setHideContact] = useState(!canViewContact);
  const [includeQualityReport, setIncludeQualityReport] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const generateCSV = () => {
    const headers = [
      '学号',
      '姓名',
      '出勤率(%)',
      '缺勤次数',
      '迟到次数',
      '作业均分',
      '作业提交率(%)',
      '测验均分',
      '课堂互动次数',
      '互动质量',
      '综合评分',
      '风险等级',
    ];

    if (!hideContact) {
      headers.push('联系电话', '邮箱');
    }

    const rows = students.map((s) => {
      const row = [
        s.studentIdNumber,
        s.studentName,
        s.attendanceRate,
        s.absentCount,
        s.lateCount,
        s.assignmentAvgScore,
        s.assignmentSubmissionRate,
        s.quizAvgScore,
        s.interactionCount,
        s.interactionQuality,
        s.overallScore,
        s.riskLevel === 'low' ? '低' : s.riskLevel === 'medium' ? '中' : '高',
      ];

      if (!hideContact) {
        const student = qualityInfo.filters.classId ? students.find(st => st.studentId === s.studentId) : null;
        row.push(
          hideContact ? maskPhone('13800000000') : '138****0000',
          hideContact ? maskEmail('student@example.com') : 's***@university.edu.cn'
        );
      }

      return row;
    });

    let csvContent = '\ufeff';

    csvContent += '# 班级出勤与学习表现分析报告\n';
    csvContent += `# 导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
    csvContent += `# 数据更新时间: ${new Date(qualityInfo.updateTime).toLocaleString('zh-CN')}\n`;
    csvContent += `# 样本量: ${qualityInfo.sampleSize} 人\n`;
    csvContent += '# 筛选条件: ';
    const filterDescriptions: string[] = [];
    if (filters.classId) filterDescriptions.push(`班级: ${filters.classId}`);
    if (filters.courseId) filterDescriptions.push(`课程: ${filters.courseId}`);
    if (filters.weekStart && filters.weekEnd) filterDescriptions.push(`周次: ${filters.weekStart}-${filters.weekEnd}`);
    if (filters.questionType) filterDescriptions.push(`题型: ${filters.questionType}`);
    csvContent += filterDescriptions.length > 0 ? filterDescriptions.join(', ') : '无';
    csvContent += '\n';
    if (hideContact) {
      csvContent += '# 注意: 联系方式已根据权限脱敏\n';
    }
    csvContent += '\n';

    if (includeQualityReport) {
      csvContent += '# 数据质量报告\n';
      csvContent += `#,缺失率-出勤,${qualityInfo.missingRate.attendance}%\n`;
      csvContent += `#,缺失率-作业,${qualityInfo.missingRate.assignments}%\n`;
      csvContent += `#,缺失率-测验,${qualityInfo.missingRate.quizzes}%\n`;
      csvContent += `#,成绩异常值,${qualityInfo.outlierCount.scores}个\n`;
      csvContent += `#,出勤异常值,${qualityInfo.outlierCount.attendance}个\n`;
      csvContent += '\n';
    }

    csvContent += headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    return csvContent;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportFormat === 'csv') {
        const csv = generateCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `班级表现分析_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const pdfBlob = await generatePdfBlob(
          students,
          qualityInfo,
          filters,
          hideContact
        );
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `班级表现分析_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      alert('导出失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">导出数据</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  exportFormat === 'csv'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className={`w-6 h-6 ${exportFormat === 'csv' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${exportFormat === 'csv' ? 'text-blue-700' : 'text-gray-700'}`}>CSV</p>
                  <p className="text-xs text-gray-500">表格格式</p>
                </div>
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  exportFormat === 'pdf'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className={`w-6 h-6 ${exportFormat === 'pdf' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${exportFormat === 'pdf' ? 'text-blue-700' : 'text-gray-700'}`}>PDF</p>
                  <p className="text-xs text-gray-500">文档格式</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">导出选项</label>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {hideContact ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">隐藏联系方式</p>
                  <p className="text-xs text-gray-500">导出时脱敏手机号和邮箱</p>
                </div>
              </div>
              <button
                onClick={() => setHideContact(!hideContact)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  hideContact ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    hideContact ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!canViewContact && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>您的权限不允许查看联系方式，导出时将自动脱敏</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">包含数据质量报告</p>
                  <p className="text-xs text-gray-500">缺失率、异常值、样本量信息</p>
                </div>
              </div>
              <button
                onClick={() => setIncludeQualityReport(!includeQualityReport)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  includeQualityReport ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    includeQualityReport ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              将导出 <span className="font-semibold">{students.length}</span> 条学生记录，
              包含筛选条件和数据更新时间信息
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || exportSuccess}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              exportSuccess
                ? 'bg-green-600'
                : isExporting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckCircle className="w-5 h-5" />
                导出成功
              </>
            ) : isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在导出...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                确认导出
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
