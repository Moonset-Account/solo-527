import { Card, Statistic, Row, Col } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons'

const Home = () => {
  return (
    <div>
      <h2>欢迎使用管理系统</h2>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={1128}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={93}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="营收总额"
              value={112893}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="增长率"
              value={11.28}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home
