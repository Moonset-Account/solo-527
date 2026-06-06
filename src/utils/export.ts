import * as XLSX from 'xlsx';
import { LearningActivity, FilterState, ExportMetadata, Student, Course, Chapter } from '../data/types';
import { ACTIVITY_TYPE_LABELS } from '../data/constants';

const formatFiltersForExport = (filters: FilterState): string[][] => {
  const rows: string[][] = [];
  rows.push(['筛选条件', '值']);
  rows.push(['课程', filters.courseIds.length > 0 ? filters.courseIds.join(', ') : '全部']);
  rows.push(['章节', filters.chapterIds.length > 0 ? filters.chapterIds.join(', ') : '全部']);
  rows.push(['班期', filters.cohortIds.length > 0 ? filters.cohortIds.join(', ') : '全部']);
  rows.push(['学员', filters.studentIds.length > 0 ? `${filters.studentIds.length} 名学员` : '全部']);
  rows.push(['题目', filters.questionIds.length > 0 ? `${filters.questionIds.length} 道题目` : '全部']);
  rows.push(['时间范围', `${filters.timeRange.start} 至 ${filters.timeRange.end}`]);
  rows.push(['时间预设', filters.timeRange.preset]);
  return rows;
};

const formatActivitiesForExport = (
  activities: LearningActivity[],
  students: Student[],
  courses: Course[],
  chapters: Chapter[]
): string[][] => {
  const rows: string[][] = [];
  rows.push([
    '学员ID',
    '学员姓名',
    '班期ID',
    '是否补课',
    '课程名称',
    '章节名称',
    '活动类型',
    '完成时间',
    '首次完成时间',
    '得分',
    '是否正确',
  ]);
  
  activities.forEach((act) => {
    const student = students.find((s) => s.id === act.studentId);
    const course = courses.find((c) => c.id === act.courseId);
    const chapter = chapters.find((ch) => ch.id === act.chapterId);
    
    rows.push([
      act.studentId,
      student?.name || '',
      student?.cohortId || '',
      student?.isMakeup ? '是' : '否',
      course?.name || '',
      chapter?.name || '',
      ACTIVITY_TYPE_LABELS[act.activityType] || act.activityType,
      act.completedAt || '',
      act.firstCompletedAt || '',
      act.score?.toString() || '',
      act.isCorrect !== undefined ? (act.isCorrect ? '是' : '否') : '',
    ]);
  });
  
  return rows;
};

export const exportToExcel = (
  activities: LearningActivity[],
  filters: FilterState,
  students: Student[],
  courses: Course[],
  chapters: Chapter[],
  filename: string = '学习路径数据'
): void => {
  const wb = XLSX.utils.book_new();
  
  const dataRows = formatActivitiesForExport(activities, students, courses, chapters);
  const wsData = XLSX.utils.aoa_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(wb, wsData, '数据明细');
  
  const metadata: ExportMetadata = {
    exportAt: new Date().toISOString(),
    filters,
    sampleSize: activities.length,
    dataRange: {
      start: filters.timeRange.start,
      end: filters.timeRange.end,
    },
  };
  
  const filterRows = formatFiltersForExport(filters);
  filterRows.push([]);
  filterRows.push(['导出信息', '']);
  filterRows.push(['导出时间', metadata.exportAt]);
  filterRows.push(['样本量', metadata.sampleSize.toString()]);
  filterRows.push(['数据时间范围', `${metadata.dataRange.start} 至 ${metadata.dataRange.end}`]);
  
  const wsMeta = XLSX.utils.aoa_to_sheet(filterRows);
  XLSX.utils.book_append_sheet(wb, wsMeta, '筛选条件与元数据');
  
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (
  activities: LearningActivity[],
  filters: FilterState,
  students: Student[],
  courses: Course[],
  chapters: Chapter[],
  filename: string = '学习路径数据'
): void => {
  const dataRows = formatActivitiesForExport(activities, students, courses, chapters);
  const csvContent = dataRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
