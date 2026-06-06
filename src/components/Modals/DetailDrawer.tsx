import React from 'react';
import { Drawer, Table, Tag, Button, Space, Tabs } from 'antd';
import { Download, Users, FileSpreadsheet, FileText } from 'lucide-react';
import { DropoutStudent, LearningActivity, FilterState } from '../../data/types';
import { useETL } from '../../hooks/useETL';
import { useFilterStore } from '../../stores/filterStore';
import { ACTIVITY_TYPE_LABELS } from '../../data/constants';
import { exportToExcel, exportToCSV } from '../../utils/export';

const { TabPane } = Tabs;

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  activityType: string | null;
  dropoutStudents: DropoutStudent[];
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  activityType,
  dropoutStudents,
}) => {
  const { activities, courses, chapters, students, allQuestions } = useETL();
  const filters = useFilterStore();
  
  const dropoutColumns = [
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
    },
    {
      title: '所属班期',
      dataIndex: 'cohortName',
      key: 'cohortName',
      width: 120,
    },
    {
      title: '是否补课学员',
      dataIndex: 'isMakeup',
      key: 'isMakeup',
      width: 120,
      render: (isMakeup: boolean) => (
        <Tag color={isMakeup ? 'orange' : 'default'}>
          {isMakeup ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '最后活跃时间',
      dataIndex: 'lastActivityAt',
      key: 'lastActivityAt',
      width: 180,
      render: (time: string | null) => time || '-',
    },
  ];
  
  const activityColumns = [
    {
      title: '学员',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
    },
    {
      title: '课程',
      dataIndex: 'courseName',
      key: 'courseName',
      width: 140,
      ellipsis: true,
    },
    {
      title: '章节',
      dataIndex: 'chapterName',
      key: 'chapterName',
      width: 140,
      ellipsis: true,
    },
    {
      title: '活动类型',
      dataIndex: 'activityType',
      key: 'activityType',
      width: 100,
      render: (type: string) => ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS] || type,
    },
    {
      title: '是否完成',
      dataIndex: 'completed',
      key: 'completed',
      width: 90,
      render: (completed: boolean) => (
        <Tag color={completed ? 'green' : 'default'}>
          {completed ? '已完成' : '未完成'}
        </Tag>
      ),
    },
    {
      title: '首次完成时间',
      dataIndex: 'firstCompletedAt',
      key: 'firstCompletedAt',
      width: 160,
      render: (time: string | null) => time || '-',
    },
  ];
  
  const activityTableData = activities.map((act) => {
    const student = students.find((s) => s.id === act.studentId);
    const course = courses.find((c) => c.id === act.courseId);
    const chapter = chapters.find((ch) => ch.id === act.chapterId);
    return {
      ...act,
      key: act.id,
      studentName: student?.name || '-',
      courseName: course?.name || '-',
      chapterName: chapter?.name || '-',
      completed: !!act.firstCompletedAt,
    };
  });
  
  const handleExportExcel = () => {
    exportToExcel(
      activities,
      filters as unknown as FilterState,
      students,
      courses,
      chapters,
      allQuestions,
      '学习路径明细数据'
    );
  };
  
  const handleExportCSV = () => {
    exportToCSV(
      activities,
      filters as unknown as FilterState,
      students,
      courses,
      chapters,
      '学习路径明细数据'
    );
  };
  
  return (
    <Drawer
      title={activityType ? `${ACTIVITY_TYPE_LABELS[activityType as keyof typeof ACTIVITY_TYPE_LABELS]} - 掉队学员明细` : '数据明细'}
      placement="right"
      width={800}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<FileText size={14} />} onClick={handleExportCSV}>
            导出 CSV
          </Button>
          <Button
            type="primary"
            icon={<FileSpreadsheet size={14} />}
            onClick={handleExportExcel}
          >
            导出 Excel
          </Button>
        </Space>
      }
    >
      {activityType ? (
        <div>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Users size={16} />
              <span className="font-medium">
                共 {dropoutStudents.length} 名掉队学员
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              注：补课学员已按首次完成时间去重，不重复计入统计
            </p>
          </div>
          <Table
            columns={dropoutColumns}
            dataSource={dropoutStudents.map((s) => ({ ...s, key: s.studentId }))}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </div>
      ) : (
        <Tabs defaultActiveKey="activities">
          <TabPane tab="学习行为明细" key="activities">
            <Table
              columns={activityColumns}
              dataSource={activityTableData}
              pagination={{ pageSize: 20 }}
              size="small"
              scroll={{ x: 800 }}
            />
          </TabPane>
          <TabPane tab="筛选条件说明" key="filters">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">当前筛选条件</h4>
                <div className="text-sm space-y-1.5 text-gray-600">
                  <p>课程: {filters.courseIds.length > 0 ? `${filters.courseIds.length} 门` : '全部'}</p>
                  <p>章节: {filters.chapterIds.length > 0 ? `${filters.chapterIds.length} 个` : '全部'}</p>
                  <p>班期: {filters.cohortIds.length > 0 ? `${filters.cohortIds.length} 个` : '全部'}</p>
                  <p>学员: {filters.studentIds.length > 0 ? `${filters.studentIds.length} 名` : '全部'}</p>
                  <p>题目: {filters.questionIds.length > 0 ? `${filters.questionIds.length} 道` : '全部'}</p>
                  <p>时间范围: {filters.timeRange.start} 至 {filters.timeRange.end}</p>
                  {filters.questionIds.length > 0 && (
                    <p className="text-blue-600 mt-2 pt-2 border-t border-gray-200">
                      <strong>注意:</strong> 选择题目后，将自动过滤出做过这些题目的学员，
                      所有统计指标均基于这些学员的完整学习行为
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">数据口径说明</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>补课学员按首次完成时间去重，不重复计入首次完成率</li>
                  <li>学习路径漏斗统计各环节独立去重学员数</li>
                  <li>题目筛选会联动过滤出相关学员，确保口径统一</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-700 mb-2">导出说明</h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>导出文件包含完整的筛选条件元数据</li>
                  <li>Excel 文件包含两个 Sheet：数据明细 + 筛选条件与元数据</li>
                  <li>请结合筛选条件和数据口径解读结论，避免误读</li>
                </ul>
              </div>
            </div>
          </TabPane>
        </Tabs>
      )}
    </Drawer>
  );
};
