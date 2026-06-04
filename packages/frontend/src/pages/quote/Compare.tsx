import { useState, useEffect } from 'react';
import { Card, Space, Button, Select, Row, Col, Table, Alert, Typography, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { quoteService } from '../../services/quoteService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function QuoteCompare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [v1, setV1] = useState<number>(1);
  const [v2, setV2] = useState<number>(2);

  const { data: versions } = useQuery(['quoteVersions', id], () => quoteService.getVersions(id!), {
    enabled: !!id,
  });

  const { data: comparison, refetch } = useQuery(
    ['quoteCompare', id, v1, v2],
    () => quoteService.compareVersions(id!, v1, v2),
    { enabled: !!id && !!v1 && !!v2 }
  );

  useEffect(() => {
    if (versions?.data && versions.data.length >= 2) {
      const sorted = [...versions.data].sort((a, b) => b.version - a.version);
      setV2(sorted[0].version);
      setV1(sorted[1].version);
    }
  }, [versions]);

  useEffect(() => {
    if (v1 && v2) {
      refetch();
    }
  }, [v1, v2, refetch]);

  const versionOptions = versions?.data?.map((v) => (
    <Option key={v.version} value={v.version}>
      v{v.version} - {dayjs(v.createdAt).format('MM-DD HH:mm')} - {v.modifiedBy?.name || '未知'}
    </Option>
  ));

  const renderComparisonTable = (title: string, items1: any[], items2: any[], keyField: string) => {
    const allKeys = new Set([
      ...(items1 || []).map((i) => i[keyField]),
      ...(items2 || []).map((i) => i[keyField]),
    ]);

    if (allKeys.size === 0) return null;

    const data = Array.from(allKeys).map((key) => {
      const item1 = (items1 || []).find((i) => i[keyField] === key);
      const item2 = (items2 || []).find((i) => i[keyField] === key);
      const changed = JSON.stringify(item1) !== JSON.stringify(item2);
      return { key, item1, item2, changed };
    });

    return (
      <Card title={title} size="small" style={{ marginTop: 16 }}>
        <Table
          dataSource={data}
          columns={[
            {
              title: '项目',
              dataIndex: 'key',
              key: 'key',
              width: 200,
              render: (text, record) => (
                <Space>
                  {text}
                  {record.changed && <Tag color="orange">变更</Tag>}
                </Space>
              ),
            },
            {
              title: `v${v1}`,
              key: 'v1',
              render: (_, record) => {
                const item = record.item1;
                if (!item) return <Text type="secondary">无</Text>;
                const cost = item.totalCost || item.amount || 0;
                return `¥${cost.toLocaleString()}`;
              },
            },
            {
              title: `v${v2}`,
              key: 'v2',
              render: (_, record) => {
                const item = record.item2;
                if (!item) return <Text type="secondary">无</Text>;
                const cost = item.totalCost || item.amount || 0;
                return `¥${cost.toLocaleString()}`;
              },
            },
          ]}
          pagination={false}
          size="small"
          rowClassName={(record) => (record.changed ? 'bg-yellow-50' : '')}
        />
      </Card>
    );
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/quotes/${id}`)}>
          返回报价详情
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          版本对比
        </Title>
      </Space>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <span>版本1：</span>
          <Select style={{ width: 250 }} value={v1} onChange={setV1}>
            {versionOptions}
          </Select>
          <span>vs</span>
          <span>版本2：</span>
          <Select style={{ width: 250 }} value={v2} onChange={setV2}>
            {versionOptions}
          </Select>
        </Space>

        {comparison?.data && (
          <>
            <Row gutter={24} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title={`v${v1} 总价`}
                    value={comparison.data.version1.totalPrice}
                    prefix="¥"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title={`v${v2} 总价`}
                    value={comparison.data.version2.totalPrice}
                    prefix="¥"
                    valueStyle={{
                      color:
                        comparison.data.version2.totalPrice > comparison.data.version1.totalPrice
                          ? '#ff4d4f'
                          : comparison.data.version2.totalPrice < comparison.data.version1.totalPrice
                          ? '#52c41a'
                          : '#000',
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {comparison.data.version1.totalPrice !== comparison.data.version2.totalPrice && (
              <Alert
                message={`价格变动: ¥${comparison.data.version1.totalPrice.toLocaleString()} → ¥${comparison.data.version2.totalPrice.toLocaleString()}`}
                description={`差额: ¥${Math.abs(
                  comparison.data.version2.totalPrice - comparison.data.version1.totalPrice
                ).toLocaleString()}`}
                type={
                  comparison.data.version2.totalPrice > comparison.data.version1.totalPrice
                    ? 'warning'
                    : 'success'
                }
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {renderComparisonTable('酒店', comparison.data.version1.hotels, comparison.data.version2.hotels, 'name')}
            {renderComparisonTable('交通', comparison.data.version1.transportation, comparison.data.version2.transportation, 'description')}
            {renderComparisonTable('门票', comparison.data.version1.tickets, comparison.data.version2.tickets, 'attraction')}
            {renderComparisonTable('餐饮', comparison.data.version1.meals, comparison.data.version2.meals, 'type')}
            {renderComparisonTable('导游', comparison.data.version1.guides, comparison.data.version2.guides, 'type')}
            {renderComparisonTable('其他费用', comparison.data.version1.otherExpenses, comparison.data.version2.otherExpenses, 'description')}

            <Card title="服务费/毛利对比" size="small" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div>
                    <Text type="secondary">v{v1} 服务费</Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                      ¥{comparison.data.version1.serviceFee?.toLocaleString() || 0}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text type="secondary">v{v2} 服务费</Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                      ¥{comparison.data.version2.serviceFee?.toLocaleString() || 0}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text type="secondary">毛利率变动</Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                      {comparison.data.version1.profitMargin?.toFixed(1)}% → {comparison.data.version2.profitMargin?.toFixed(1)}%
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
}

function Statistic(props: any) {
  return (
    <div>
      <div style={{ color: '#999', fontSize: 12 }}>{props.title}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold', ...props.valueStyle }}>
        {props.prefix}
        {props.value?.toLocaleString()}
      </div>
    </div>
  );
}
