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

  const getFilterTags = () => {
    if (!filters) return null;
    const tags = [];
    if (filters.floor_id) {
      tags.push(<Tag key="floor" color="orange">{`楼层: ${floorName || filters.floor_id}`}</Tag>);
    }
    if (filters.area_id) {
      tags.push(<Tag key="area" color="orange">{`区域: ${areaName || filters.area_id}`}</Tag>);
    }
    if (filters.seat_type) {
      tags.push(<Tag key="seat_type" color="orange">{`座位: ${filters.seat_type}`}</Tag>);
    }
    if (filters.user_group_id) {
      tags.push(<Tag key="user_group" color="orange">{`用户组: ${userGroupName || filters.user_group_id}`}</Tag>);
    }
    if (filters.time_slot) {
      tags.push(<Tag key="time_slot" color="orange">{`时段: ${TIME_SLOT_LABELS[filters.time_slot] || filters.time_slot}`}</Tag>);
    }
    if (filters.start_date && filters.end_date) {
      tags.push(<Tag key="date" color="orange">{`${filters.start_date} ~ ${filters.end_date}`}</Tag>);
    }
    return tags;
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
        {filters && getFilterTags()}
      </div>
    </div>
  );
};

export default ChartHeader;
