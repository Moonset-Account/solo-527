import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Space, Typography } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyLeads, fetchTimeoutLeads } from '../store/slices/leadsSlice';
import { fetchMyContracts, fetchPendingApprovals } from '../store/slices/contractsSlice';
import { fetchSalesFunnel } from '../store/slices/commonSlice';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { salesFunnel } = useSelector(state => state.common);
  const { leads: myLeads } = useSelector(state => state.leads);
  const { contracts: myContracts, pendingApprovals } = useSelector(state => state.contracts);
  const { leads: timeoutLeads } = useSelector(state => state.leads);

  useEffect(() => {
    dispatch(fetchMyLeads({ page_size: 5 }));
    dispatch(fetchTimeoutLeads({ page_size: 5 }));
    dispatch(fetchMyContracts({ page_size: 5 }));
    dispatch(fetchPendingApprovals({ page_size: 5 }));
    dispatch(fetchSalesFunnel());
  }, [dispatch]);

  const getQualityColor = (quality) => {
    const colors = { high: 'green', medium: 'gold', low: 'red' };
    return colors[quality] || 'default';
  };

  const getQualityText = (quality) => {
    const texts = { high: '高质量', medium: '中质量', low: '低质量' };
    return texts[quality] || quality;
  };

  const funnelOption = salesFunnel ? {
    title: { text: '销售漏斗', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      type: 'funnel',
      left: '10%',
      top: 60,
      bottom: 20,
      width: '80%',
      min: 0,
      max: salesFunnel.summary?.total_leads || 100,
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}\n{c}',
      },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: salesFunnel.funnel?.map(item => ({ value: item.count, name: item.stage })) || [],
    }]
  } : {};

  const statCards = [
    { title: '我的线索', value: myLeads.length || 0, icon: <UserOutlined />, color: '#1890ff', onClick: () => navigate('/leads') },
    { title: '待审批合同', value: pendingApprovals.length || 0, icon: <FileTextOutlined />, color: '#faad14', onClick: () => navigate('/contract-approval') },
    { title: '我的合同', value: myContracts.length || 0, icon: <CheckCircleOutlined />, color: '#52c41a', onClick: () => navigate('/contracts') },
    { title: '超时跟进', value: timeoutLeads.length || 0, icon: <ExclamationCircleOutlined />, color: '#ff4d4f', onClick: () => navigate('/leads?is_timeout=true') },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map((card, index) => (
          <Col span={6} key={index}>
            <Card hoverable onClick={card.onClick} style={{ cursor: 'pointer' }}>
              <Statistic
                title={card.title}
                value={card.value}
                valueStyle={{ color: card.color }}
                prefix={card.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="销售漏斗概览">
            <ReactECharts option={funnelOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="待处理线索"
            extra={<a onClick={() => navigate('/leads')}>查看全部</a>}
          >
            <List
              dataSource={myLeads.slice(0, 5)}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  onClick={() => navigate(`/leads/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.customer_name}
                        <Tag color={getQualityColor(item.quality)}>
                          {getQualityText(item.quality)}
                        </Tag>
                        {item.is_timeout && <Tag color="red">超时</Tag>}
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="secondary">{item.status_name}</Text>
                        <Text type="secondary">
                          {dayjs(item.created_at).format('MM-DD HH:mm')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card
            title="待审批合同"
            extra={<a onClick={() => navigate('/contract-approval')}>查看全部</a>}
          >
            <List
              dataSource={pendingApprovals.slice(0, 5)}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  onClick={() => navigate(`/contracts/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.contract_no}
                        <Tag color="gold">待审批</Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="secondary">{item.customer_name}</Text>
                        <Text type="secondary">¥{item.actual_amount?.toFixed(2)}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="快速统计"
          >
            {salesFunnel?.summary && (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Text type="secondary">总线索数</Text>
                  <Title level={3} style={{ margin: 0 }}>{salesFunnel.summary.total_leads}</Title>
                </div>
                <div>
                  <Text type="secondary">成交金额</Text>
                  <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                    ¥{salesFunnel.summary.total_amount?.toFixed(2)}
                  </Title>
                </div>
                <div>
                  <Text type="secondary">成交转化率</Text>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    <RiseOutlined /> {salesFunnel.summary.lost_rate?.toFixed(2)}%
                  </Title>
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
