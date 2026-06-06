import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { BookOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useFilter } from '../context/FilterContext';
import { getSummary } from '../services/api';

const SummaryCards = () => {
  const { filters } = useFilter();
  const [data, setData] = useState({ utilization_rate: 0, no_show_rate: 0, sample_size: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getSummary(filters);
      setData(res.data.data || { utilization_rate: 0, no_show_rate: 0, sample_size: 0 });
    } catch (error) {
      console.error('获取汇总数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={8}>
        <Card className="summary-card">
          {loading ? (
            <Spin />
          ) : (
            <Statistic
              title="平均利用率"
              value={data.utilization_rate}
              precision={1}
              suffix="%"
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          )}
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className="summary-card">
          {loading ? (
            <Spin />
          ) : (
            <Statistic
              title="平均爽约率"
              value={data.no_show_rate}
              precision={1}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          )}
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className="summary-card">
          {loading ? (
            <Spin />
          ) : (
            <Statistic
              title="总样本量"
              value={data.sample_size}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCards;
