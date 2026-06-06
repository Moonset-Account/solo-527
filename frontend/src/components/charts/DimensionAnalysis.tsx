import React from 'react';
import { Card, Row, Col, Table, Typography, Tag, Empty, Spin, Button } from 'antd';
import { useDashboardStore } from '../../store/dashboard';
import { FilterState } from '../../types';

const { Title, Text } = Typography;

interface DimensionPanelProps {
  dimension: string;
  title: string;
  dataKey: string;
  onDrillDown: (filters: FilterState) => void;
}

const DimensionPanel: React.FC<DimensionPanelProps> = ({ dimension, title, dataKey, onDrillDown }) => {
  const { dashboardData, loading, setDrillDown } = useDashboardStore();
  const data = dashboardData?.dimension_stats?.[dataKey] || [];

  const handleRowClick = (record: any) => {
    let filters: FilterState = {};
    switch (dimension) {
      case 'store':
        filters = { store_ids: record.id ? [record.id] : undefined };
        break;
      case 'warehouse':
        filters = { warehouse_ids: record.id ? [record.id] : undefined };
        break;
      case 'logistics':
        filters = { logistics_providers: record.name ? [record.name] : undefined };
        break;
      case 'category':
        filters = { product_categories: record.name ? [record.name] : undefined };
        break;
    }
    setDrillDown(dimension, filters);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '退货单数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
      render: (val: number) => <Tag color="blue">{val}</Tag>
    },
    {
      title: '退货金额',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: any, b: any) => a.amount - b.amount,
      render: (val: number) => `¥${val?.toLocaleString()}`
    },
    {
      title: '平均周期(天)',
      dataIndex: 'avg_cycle_days',
      key: 'avg_cycle_days',
      sorter: (a: any, b: any) => a.avg_cycle_days - b.avg_cycle_days,
      render: (val: number) => (
        <Tag color={val > 7 ? 'red' : val > 3 ? 'orange' : 'green'}>
          {val || 0}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => handleRowClick(record)}>
          下钻分析
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <Card size="small" title={<Title level={5} style={{ margin: 0 }}>{title}</Title>}>
        <Spin />
      </Card>
    );
  }

  return (
    <Card
      size="small"
      title={<Title level={5} style={{ margin: 0 }}>{title}</Title>}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>点击操作可下钻</Text>}
    >
      {data.length === 0 ? (
        <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          size="small"
          dataSource={data}
          columns={columns}
          pagination={false}
          rowKey="name"
        />
      )}
    </Card>
  );
};

export const DimensionAnalysis: React.FC = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <DimensionPanel
          dimension="store"
          title="店铺维度分析"
          dataKey="store"
          onDrillDown={() => {}}
        />
      </Col>
      <Col xs={24} lg={12}>
        <DimensionPanel
          dimension="warehouse"
          title="仓库维度分析"
          dataKey="warehouse"
          onDrillDown={() => {}}
        />
      </Col>
      <Col xs={24} lg={12}>
        <DimensionPanel
          dimension="logistics"
          title="物流商维度分析"
          dataKey="logistics"
          onDrillDown={() => {}}
        />
      </Col>
      <Col xs={24} lg={12}>
        <DimensionPanel
          dimension="category"
          title="商品品类维度分析"
          dataKey="category"
          onDrillDown={() => {}}
        />
      </Col>
    </Row>
  );
};
