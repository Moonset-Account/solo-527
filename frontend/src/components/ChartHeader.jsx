import React from 'react';
import { Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const TIME_SLOT_LABELS = {
  'morning': '上午 (08:00-12:00)',
  'afternoon': '下午 (12:00-18:00)',
  'evening': '晚间 (18:00-22:00)',
  '08-10': '08:00-10:00',
  '10-12': '10:00-12:00',
  '12-14': '12:00-14:00',
  '14-16': '14:00-16:00',
  '16-18': '16:00-18:00',
  '18-20': '18:00-20:00',
  '20-22': '20:00-22:00'
};

const ChartHeader = ({ title, sampleSize, updateTime, filters, floorName, areaName, userGroupName }) => {
  const formatFilters = () => {
    if (!filters) return null;
    const parts = [];
    if (filters.floor_id) parts.push(`楼层: ${floorName || filters.floor_id}`);
    if (filters.area_id) parts.push(`区域: ${areaName || filters.area_id}`);
    if (filters.seat_type) parts.push(`座位类型: ${filters.seat_type}`);
    if (filters.user_group_id) parts.push(`用户组: ${userGroupName || filters.user_group_id}`);
    if (filters.time_slot) parts.push(`时间段: ${TIME_SLOT_LABELS[filters.time_slot] || filters.time_slot}`);
    if (filters.start_date && filters.end_date) {
      parts.push(`${filters.start_date} ~ ${filters.end_date}`);
    }
    return parts.join(' | ');
  };

  return (
    <div className="chart-header">
      <span className="chart-title">{title}</span>
      <div className="chart-meta">
        {sampleSize !== undefined && (
          <Tooltip title="数据样本量">
            <Tag color="blue" icon={<InfoCircleOutlined />}>
              样本量: {sampleSize.toLocaleString()}
            </Tag>
          </Tooltip>
        )}
        {updateTime && (
          <Tooltip title="数据更新时间">
            <Tag color="green">
              更新于: {dayjs(updateTime).format('MM-DD HH:mm')}
            </Tag>
          </Tooltip>
        )}
        {filters && formatFilters() && (
          <Tooltip title={formatFilters()}>
            <Tag color="orange">筛选条件</Tag>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default ChartHeader;
