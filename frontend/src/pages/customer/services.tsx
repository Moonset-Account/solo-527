import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Button, Spin, Typography, Empty, Space } from 'antd';
import { ClockCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import { Service, ServiceTypeLabels } from '../../types';

const { Title, Text, Paragraph } = Typography;

const ServicesPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data: Service[] = await request.get('/services/active/list');
      setServices(data || []);
    } catch (error) {
      console.error('获取服务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleBook = (service: Service) => {
    navigate('/customer/appointments', { state: { preselectedServiceId: service.id } });
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>
          服务套餐
        </Title>
        <Text type="secondary">选择您需要的服务，立即预约</Text>
      </div>

      <Spin spinning={loading}>
        {services.length === 0 && !loading ? (
          <Empty description="暂无可用服务" style={{ marginTop: 80 }} />
        ) : (
          <Row gutter={[24, 24]}>
            {services.map((service) => (
              <Col xs={24} sm={12} lg={8} key={service.id}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <Space style={{ marginBottom: 8 }}>
                      <Tag color="blue">{ServiceTypeLabels[service.type]}</Tag>
                      <Tag icon={<ClockCircleOutlined />} color="default">
                        {service.duration} 分钟
                      </Tag>
                    </Space>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {service.name}
                    </Title>
                  </div>

                  <Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2, expandable: false }}
                    style={{ flex: 1, minHeight: 44 }}
                  >
                    {service.description || '暂无描述'}
                  </Paragraph>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid #f0f0f0',
                    }}
                  >
                    <div>
                      <Text strong style={{ color: '#f5222d', fontSize: 20 }}>
                        ¥{Number(service.price).toFixed(2)}
                      </Text>
                      {service.originalPrice && service.originalPrice > service.price && (
                        <Text delete type="secondary" style={{ marginLeft: 8 }}>
                          ¥{Number(service.originalPrice).toFixed(2)}
                        </Text>
                      )}
                    </div>
                    <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => handleBook(service)}>
                      立即预约
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default ServicesPage;
