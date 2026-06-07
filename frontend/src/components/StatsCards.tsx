import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  BookOutlined,
  ShoppingCartOutlined,
  InventoryOutlined,
  WarningOutlined,
  RiseOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { SummaryData } from '../types';

interface StatsCardsProps {
  data: SummaryData | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  if (!data) return null;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col span={4}>
        <Card className="stat-card">
          <Statistic
            title="书籍种类"
            value={data.total_books}
            prefix={<BookOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card className="stat-card">
          <Statistic
            title="回收记录总数"
            value={data.total_records}
            prefix={<ShoppingCartOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card className="stat-card">
          <Statistic
            title="已售出"
            value={data.sold_count}
            prefix={<RiseOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card className="stat-card">
          <Statistic
            title="未售出"
            value={data.unsold_count}
            prefix={<InventoryOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card className="stat-card">
          <Statistic
            title={`超${data.unsold_threshold_days}天滞销`}
            value={data.unsold_over_threshold}
            prefix={<ScheduleOutlined />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card className="stat-card">
          <Statistic
            title="价格异常"
            value={data.abnormal_count}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#f5222d' }}
            suffix="条"
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards;
