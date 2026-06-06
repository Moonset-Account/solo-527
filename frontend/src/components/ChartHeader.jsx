import React from 'react';
import { Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ChartHeader = ({ title, sampleSize, updateTime, filters }) => {
  const formatFilters = () => {
    if (!filters) return null;
    const parts = [];
    if (filters.floor_id) parts.push(`楼层: ${filters.floor_id}`);
    if (filters.area_id) parts.push(`区域: ${filters.area_id}`);
    if (filters.seat_type) parts.push(`类型: ${filters.seat_type}`);
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
