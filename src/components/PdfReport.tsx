'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from '@react-pdf/renderer';
import { StudentMetrics, DataQualityInfo, FilterParams } from '@/lib/services/analytics';

Font.register({
  family: 'NotoSansSC',
  src: 'https://cdn.jsdelivr.net/npm/@noto-fonts/noto-sans-sc@31.0.0/files/NotoSansSC-Regular.ttf',
  fontStyle: 'normal',
  fontWeight: 'normal',
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    backgroundColor: '#eff6ff',
    padding: 6,
    borderRadius: 4,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  metadataItem: {
    width: '48%',
  },
  metadataLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  metadataValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityCard: {
    width: '31%',
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qualityLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  qualityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
  },
  tableHeaderCell: {
    padding: 6,
    fontWeight: 'bold',
    fontSize: 9,
    color: 'white',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    color: '#374151',
  },
  riskLow: {
    color: '#059669',
    fontWeight: 'bold',
  },
  riskMedium: {
    color: '#d97706',
    fontWeight: 'bold',
  },
  riskHigh: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  warning: {
    padding: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    marginBottom: 10,
    fontSize: 9,
    color: '#92400e',
  },
});

interface PdfReportProps {
  students: StudentMetrics[];
  qualityInfo: DataQualityInfo;
  filters: FilterParams;
  hideContact: boolean;
}

function getRiskStyle(risk: string) {
  if (risk === 'low') return styles.riskLow;
  if (risk === 'medium') return styles.riskMedium;
  return styles.riskHigh;
}

function getRiskText(risk: string) {
  if (risk === 'low') return '低';
  if (risk === 'medium') return '中';
  return '高';
}

export function PdfReport({
  students,
  qualityInfo,
  filters,
  hideContact,
}: PdfReportProps) {
  const filterDescriptions: string[] = [];
  if (filters.classId) filterDescriptions.push(`班级: ${filters.classId}`);
  if (filters.courseId) filterDescriptions.push(`课程: ${filters.courseId}`);
  if (filters.weekStart && filters.weekEnd)
    filterDescriptions.push(`周次: ${filters.weekStart}-${filters.weekEnd}`);
  if (filters.questionType) filterDescriptions.push(`题型: ${filters.questionType}`);

  const colWidths = {
    id: 14,
    name: 12,
    attendance: 10,
    assignment: 10,
    quiz: 10,
    interaction: 10,
    overall: 10,
    risk: 8,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>班级出勤与学习表现分析报告</Text>
          <Text style={styles.subtitle}>
            生成时间: {new Date().toLocaleString('zh-CN')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>报告信息</Text>
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>数据更新时间</Text>
              <Text style={styles.metadataValue}>
                {new Date(qualityInfo.updateTime).toLocaleString('zh-CN')}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>样本量</Text>
              <Text style={styles.metadataValue}>{qualityInfo.sampleSize} 人</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>筛选条件</Text>
              <Text style={styles.metadataValue}>
                {filterDescriptions.length > 0 ? filterDescriptions.join(', ') : '无'}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>记录数</Text>
              <Text style={styles.metadataValue}>{students.length} 条</Text>
            </View>
          </View>

          {hideContact && (
            <View style={styles.warning}>
              <Text>⚠ 注意: 根据权限设置，联系方式已脱敏处理</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据质量报告</Text>
          <View style={styles.qualityGrid}>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityLabel}>出勤缺失率</Text>
              <Text style={styles.qualityValue}>{qualityInfo.missingRate.attendance}%</Text>
            </View>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityLabel}>作业缺失率</Text>
              <Text style={styles.qualityValue}>{qualityInfo.missingRate.assignments}%</Text>
            </View>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityLabel}>测验缺失率</Text>
              <Text style={styles.qualityValue}>{qualityInfo.missingRate.quizzes}%</Text>
            </View>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityLabel}>成绩异常值</Text>
              <Text style={styles.qualityValue}>{qualityInfo.outlierCount.scores}个</Text>
            </View>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityLabel}>出勤异常值</Text>
              <Text style={styles.qualityValue}>{qualityInfo.outlierCount.attendance}个</Text>
            </View>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityLabel}>数据完整度</Text>
              <Text style={styles.qualityValue}>
                {Math.round(100 - (qualityInfo.missingRate.attendance + qualityInfo.missingRate.assignments + qualityInfo.missingRate.quizzes) / 3)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学生表现明细</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: `${colWidths.id}%` }]}>学号</Text>
              <Text style={[styles.tableHeaderCell, { width: `${colWidths.name}%` }]}>姓名</Text>
              <Text style={[styles.tableHeaderCell, { width: `${colWidths.attendance}%` }]}>出勤率</Text>
              <Text style={[styles.tableHeaderCell, { width: `${colWidths.assignment}%` }]}>作业均分</Text>
              <Text style={[styles.tableHeaderCell, { width: `${colWidths.quiz}%` }]}>测验均分</Text>
              <Text style={[styles.tableHeaderCell, { width: `${colWidths.interaction}%` }]}>互动次数</Text>
              <Text style={[styles.tableHeaderCell, { width: `${colWidths.overall}%` }]}>综合分</Text>
              <Text style={[styles.tableHeaderCell, { width: `${colWidths.risk}%` }]}>风险</Text>
            </View>

            {students.map((student, idx) => (
              <View
                key={student.studentId}
                style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
              >
                <Text style={[styles.tableCell, { width: `${colWidths.id}%` }]}>
                  {student.studentIdNumber}
                </Text>
                <Text style={[styles.tableCell, { width: `${colWidths.name}%` }]}>
                  {student.studentName}
                </Text>
                <Text style={[styles.tableCell, { width: `${colWidths.attendance}%` }]}>
                  {student.attendanceRate}%
                </Text>
                <Text style={[styles.tableCell, { width: `${colWidths.assignment}%` }]}>
                  {student.assignmentAvgScore}
                </Text>
                <Text style={[styles.tableCell, { width: `${colWidths.quiz}%` }]}>
                  {student.quizAvgScore}
                </Text>
                <Text style={[styles.tableCell, { width: `${colWidths.interaction}%` }]}>
                  {student.interactionCount}
                </Text>
                <Text style={[styles.tableCell, { width: `${colWidths.overall}%` }]}>
                  {student.overallScore}
                </Text>
                <Text
                  style={[styles.tableCell, { width: `${colWidths.risk}%` }, getRiskStyle(student.riskLevel)]}
                >
                  {getRiskText(student.riskLevel)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            班级出勤与学习表现分析系统 | 本报告共 {students.length} 条记录 | 生成于{' '}
            {new Date().toLocaleDateString('zh-CN')}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generatePdfBlob(
  students: StudentMetrics[],
  qualityInfo: DataQualityInfo,
  filters: FilterParams,
  hideContact: boolean
): Promise<Blob> {
  const blob = await pdf(
    <PdfReport
      students={students}
      qualityInfo={qualityInfo}
      filters={filters}
      hideContact={hideContact}
    />
  ).toBlob();
  return blob;
}
