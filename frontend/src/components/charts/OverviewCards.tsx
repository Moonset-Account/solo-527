import React from 'react';
import { Row, Col, Card, Statistic, Tooltip, Typography, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useDashboardStore } from '../../store/dashboard';

const { Text } = Typography;

export const OverviewCards: React.FC = () => {
  const { dashboardData } = useDashboardStore();
  const overview = dashboardData?.overview;

  if (!overview) return null;

  const cards = [
    {
      title: '总退货单数',
      value: overview.total_returns,
      suffix: '单',
      color: '#1890ff',
      tooltip: '统计周期内的退货申请总数量'
    },
    {
      title: '退货率',
      value: overview.return_rate,
      suffix: '%',
      color: '#faad14',
      tooltip: '退货单数 / 总订单数 * 100%',
      trend: overview.return_rate > 5 ? 'up' : 'down'
    },
    {
      title: '退货金额',
      value: overview.total_return_amount.toLocaleString(),
      prefix: '¥',
      color: '#f5222d',
      tooltip: '统计周期内退货商品总金额'
    },
    {
      title: '平均退款周期',
      value: overview.avg_refund_cycle_days,
      suffix: '天',
      color: '#722ed1',
      tooltip: '从申请到退款完成的平均天数'
    },
    {
      title: '客服处理时长',
      value: overview.avg_service_duration_hours,
      suffix: '小时',
      color: '#13c2c2',
      tooltip: '客服首次响应到问题解决的平均时长'
    },
    {
      title: '重复退货用户',
      value: overview.repeat_return_user_count,
      suffix: '人',
      color: '#eb2f96',
      tooltip: '周期内退货2次及以上的用户数（已脱敏）',
      icon: <UserOutlined />
    }
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      {cards.map((card, index) => (
        <Col xs={24} sm={12} md={8} lg={4} key={index}>
          <Card size="small" hoverable>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {card.title}
                <Tooltip title={card.tooltip}>
                  <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 12, opacity: 0.6 }} />
                </Tooltip>
              </Text>
              {card.trend && (
                <Tag color={card.trend === 'up' ? 'red' : 'green'} style={{ margin: 0 }}>
                  {card.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                </Tag>
              )}
            </div>
            <Statistic
              value={card.value}
              prefix={card.prefix}
              suffix={card.suffix}
              valueStyle={{ color: card.color, fontSize: 24, fontWeight: 600 }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};
