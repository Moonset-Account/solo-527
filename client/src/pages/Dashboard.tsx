import { Card, Col, Row, Statistic } from 'antd';
import {
  EnvironmentOutlined,
  AppstoreOutlined,
  WarningOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  BulbOutlined,
} from '@ant-design/icons';

const Dashboard: React.FC = () => {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="活跃地块"
              value={12}
              prefix={<EnvironmentOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="进行中批次"
              value={8}
              prefix={<AppstoreOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="活跃告警"
              value={5}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="今日采收(kg)"
              value={1280}
              precision={2}
              prefix={<BulbOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="材料待补充"
              value={3}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title="待处理订单"
              value={6}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
