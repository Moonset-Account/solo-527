import { Card, Col, Row, Select, Statistic } from 'antd';
import {
  ThermometerOutlined,
  DropletOutlined,
  BulbOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const Environment: React.FC = () => {
  return (
    <div>
      <Card
        title="环境监测站"
        extra={
          <Select
            placeholder="选择地块"
            style={{ width: 200 }}
            allowClear
          />
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="温度 (°C)"
                value={24.5}
                precision={1}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ThermometerOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="湿度 (%)"
                value={68}
                valueStyle={{ color: '#1677ff' }}
                prefix={<DropletOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="土壤湿度 (%)"
                value={55}
                valueStyle={{ color: '#52c41a' }}
                prefix={<BulbOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="光照强度 (lux)"
                value={35000}
                valueStyle={{ color: '#faad14' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
        </Row>
        <p style={{ color: '#999', textAlign: 'center', padding: 48 }}>
          图表区域 - 待接入 ECharts
        </p>
      </Card>
    </div>
  );
};

export default Environment;
