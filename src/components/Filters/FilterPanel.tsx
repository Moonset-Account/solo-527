import React from 'react';
import { Select, DatePicker, Button, Space, Divider, Tag } from 'antd';
import { Filter, RefreshCw } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { useFilterStore } from '../../stores/filterStore';
import { useETL } from '../../hooks/useETL';
import { TimePreset } from '../../data/types';
import { TIME_PRESET_LABELS } from '../../data/constants';

const { RangePicker } = DatePicker;
const { Option } = Select;

export const FilterPanel: React.FC = () => {
  const {
    courseIds,
    chapterIds,
    cohortIds,
    timeRange,
    setCourseIds,
    setChapterIds,
    setCohortIds,
    setTimeRange,
    resetFilters,
  } = useFilterStore();
  
  const { courses, chapters, cohorts } = useETL();
  
  const filteredChapters = courseIds.length > 0
    ? chapters.filter((ch) => courseIds.includes(ch.courseId))
    : chapters;
  
  const handleTimePresetChange = (preset: TimePreset) => {
    const end = dayjs();
    let start = dayjs();
    
    switch (preset) {
      case 'day':
        start = dayjs();
        break;
      case 'week':
        start = dayjs().subtract(7, 'day');
        break;
      case 'month':
        start = dayjs().subtract(30, 'day');
        break;
      default:
        break;
    }
    
    setTimeRange({
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
      preset,
    });
  };
  
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setTimeRange({
        start: dates[0].format('YYYY-MM-DD'),
        end: dates[1].format('YYYY-MM-DD'),
        preset: 'custom',
      });
    }
  };
  
  const activeFilterCount = [
    courseIds.length,
    chapterIds.length,
    cohortIds.length,
  ].filter(Boolean).length;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-blue-600" />
          <span className="font-semibold text-gray-800">筛选条件</span>
          {activeFilterCount > 0 && (
            <Tag color="blue" className="ml-1">{activeFilterCount} 个筛选</Tag>
          )}
        </div>
        <Button
          type="text"
          size="small"
          icon={<RefreshCw size={14} />}
          onClick={resetFilters}
          className="text-gray-500 hover:text-blue-600"
        >
          重置
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">课程</label>
          <Select
            mode="multiple"
            allowClear
            placeholder="选择课程"
            value={courseIds}
            onChange={setCourseIds}
            style={{ width: '100%' }}
            size="middle"
            maxTagCount={2}
          >
            {courses.map((course) => (
              <Option key={course.id} value={course.id}>{course.name}</Option>
            ))}
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">章节</label>
          <Select
            mode="multiple"
            allowClear
            placeholder="选择章节"
            value={chapterIds}
            onChange={setChapterIds}
            style={{ width: '100%' }}
            size="middle"
            maxTagCount={2}
            disabled={filteredChapters.length === 0}
          >
            {filteredChapters.map((chapter) => (
              <Option key={chapter.id} value={chapter.id}>{chapter.name}</Option>
            ))}
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">班期</label>
          <Select
            mode="multiple"
            allowClear
            placeholder="选择班期"
            value={cohortIds}
            onChange={setCohortIds}
            style={{ width: '100%' }}
            size="middle"
            maxTagCount={2}
          >
            {cohorts.map((cohort) => (
              <Option key={cohort.id} value={cohort.id}>{cohort.name}</Option>
            ))}
          </Select>
        </div>
        
        <Divider className="my-3" />
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">时间窗口</label>
          <Space.Compact className="w-full mb-2">
            {(['day', 'week', 'month'] as TimePreset[]).map((preset) => (
              <Button
                key={preset}
                type={timeRange.preset === preset ? 'primary' : 'default'}
                onClick={() => handleTimePresetChange(preset)}
                style={{ flex: 1 }}
              >
                {TIME_PRESET_LABELS[preset]}
              </Button>
            ))}
          </Space.Compact>
          <RangePicker
            value={[dayjs(timeRange.start), dayjs(timeRange.end)]}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
            size="middle"
          />
        </div>
      </div>
    </div>
  );
};
