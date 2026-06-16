import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Space,
  Tag,
  Progress,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { statsApi } from '../../services/api.js';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };
      const [overviewRes, dailyRes] = await Promise.all([
        statsApi.overview(params),
        statsApi.daily(params),
      ]);
      if (overviewRes.success) setOverview(overviewRes.data);
      if (dailyRes.success) setDaily(dailyRes.data);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const statCardStyle = { borderRadius: 8 };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card style={statCardStyle}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>统计周期</Title>
          <RangePicker
            value={dateRange}
            onChange={(val) => val && setDateRange(val)}
          />
        </Space>
      </Card>

      {overview && (
        <Row gutter={16}>
          <Col span={4}>
            <Card style={statCardStyle}>
              <Statistic title="预约总数" value={overview.summary.totalAppointments} />
            </Card>
          </Col>
          <Col span={4}>
            <Card style={statCardStyle}>
              <Statistic title="已完成" value={overview.summary.completed + overview.summary.checkedIn} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card style={statCardStyle}>
              <Statistic title="待确认" value={overview.summary.pending} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card style={statCardStyle}>
              <Statistic title="爽约数" value={overview.summary.noShows} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card style={statCardStyle}>
              <Statistic title="候补中" value={overview.summary.waitlisted} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card style={statCardStyle}>
              <Statistic title="候补超时" value={overview.summary.waitlistExpired} valueStyle={{ color: '#8c8c8c' }} />
            </Card>
          </Col>
        </Row>
      )}

      {overview && (
        <Row gutter={16}>
          <Col span={12}>
            <Card title="核销效率" style={statCardStyle}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    整体核销率：<strong style={{ fontSize: 20 }}>{overview.summary.checkInEfficiency}%</strong>
                  </div>
                  <Progress percent={overview.summary.checkInEfficiency} status="active" />
                </div>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    爽约率：<strong style={{ fontSize: 20, color: '#ff4d4f' }}>{overview.summary.noShowRate}%</strong>
                  </div>
                  <Progress percent={overview.summary.noShowRate} status="exception" />
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="咨询师核销效率排行" style={statCardStyle}>
              <Table
                size="small"
                pagination={false}
                dataSource={overview.byCounselor}
                rowKey="id"
                columns={[
                  { title: '咨询师', dataIndex: 'name', render: (t, r) => `${t}${r.title ? `（${r.title}）` : ''}` },
                  { title: '总预约', dataIndex: 'total', width: 80 },
                  { title: '已完成', dataIndex: 'completed', width: 80 },
                  { title: '爽约', dataIndex: 'noShows', width: 80 },
                  {
                    title: '效率',
                    dataIndex: 'efficiency',
                    render: (v) => (
                      <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>
                        {v}%
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card title="每日核销效率趋势" style={statCardStyle}>
        <Table
          loading={loading}
          size="small"
          pagination={false}
          dataSource={daily}
          rowKey="date"
          columns={[
            { title: '日期', dataIndex: 'date', width: 140 },
            { title: '预约数', dataIndex: 'total', width: 100 },
            { title: '完成', dataIndex: 'completed', width: 100 },
            { title: '爽约', dataIndex: 'noShows', width: 100 },
            {
              title: '核销效率',
              dataIndex: 'efficiency',
              render: (v) => (
                <Progress percent={v} size="small" status={v >= 80 ? 'success' : v >= 60 ? 'normal' : 'exception'} />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
