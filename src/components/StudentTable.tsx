'use client';

import { useState } from 'react';
import { Search, ChevronUp, ChevronDown, Eye, CheckCircle, AlertTriangle, Filter } from 'lucide-react';
import { StudentMetrics } from '@/lib/services/analytics';
import { maskPhone } from '@/lib/auth';

interface StudentTableProps {
  students: StudentMetrics[];
  onViewStudent: (studentId: string) => void;
  onSelectStudent: (studentId: string) => void;
  selectedStudentIds: string[];
  canViewContact: boolean;
}

type SortField = 'studentName' | 'attendanceRate' | 'assignmentAvgScore' | 'quizAvgScore' | 'overallScore';
type SortDirection = 'asc' | 'desc';

export default function StudentTable({
  students,
  onViewStudent,
  onSelectStudent,
  selectedStudentIds,
  canViewContact,
}: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('overallScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredStudents = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentIdNumber.includes(searchTerm)
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aVal: string | number = a[sortField];
    let bVal: string | number = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const riskConfig = {
    low: { label: '低', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    medium: { label: '中', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    high: { label: '高', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === sortedStudents.length) {
      sortedStudents.forEach((s) => selectedStudentIds.includes(s.studentId) && onSelectStudent(s.studentId));
    } else {
      sortedStudents.forEach((s) => !selectedStudentIds.includes(s.studentId) && onSelectStudent(s.studentId));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">学生列表</h3>
          <span className="text-xs text-gray-500">共 {sortedStudents.length} 人</span>
          {selectedStudentIds.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              已选 {selectedStudentIds.length} 人
            </span>
          )}
        </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索学生姓名/学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedStudentIds.length === sortedStudents.length && sortedStudents.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                onClick={() => handleSort('studentName')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                学生
                {sortField === 'studentName' && (
                  sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              风险等级
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                onClick={() => handleSort('attendanceRate')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                出勤率
                {sortField === 'attendanceRate' && (
                  sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                onClick={() => handleSort('assignmentAvgScore')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                作业均分
                {sortField === 'assignmentAvgScore' && (
                  sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                onClick={() => handleSort('quizAvgScore')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                测验均分
                {sortField === 'quizAvgScore' && (
                  sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                onClick={() => handleSort('overallScore')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                综合评分
                {sortField === 'overallScore' && (
                  sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </th>
            <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedStudents.map((student) => {
            const risk = riskConfig[student.riskLevel];
            const RiskIcon = risk.icon;
            const isSelected = selectedStudentIds.includes(student.studentId);

            return (
              <tr
                key={student.studentId}
                className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
              >
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectStudent(student.studentId)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {student.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{student.studentName}</p>
                      <p className="text-xs text-gray-500">{student.studentIdNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${risk.color}`}>
                    <RiskIcon className="w-3 h-3" />
                    {risk.label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-medium ${
                    student.attendanceRate >= 90 ? 'text-green-600' :
                    student.attendanceRate >= 70 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {student.attendanceRate}%
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-medium ${
                    student.assignmentAvgScore >= 80 ? 'text-green-600' :
                    student.assignmentAvgScore >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {student.assignmentAvgScore}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-medium ${
                    student.quizAvgScore >= 80 ? 'text-green-600' :
                    student.quizAvgScore >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {student.quizAvgScore}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          student.overallScore >= 80 ? 'bg-green-500' :
                          student.overallScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${student.overallScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {student.overallScore}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onViewStudent(student.studentId)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="查看详情"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">未找到匹配的学生</p>
        </div>
      )}
    </div>
  );
}
