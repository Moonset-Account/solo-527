import { Card, Row, Col, Space, Timeline, Divider } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined } from '@ant-design/icons';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">关于青禾民宿</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            青禾民宿致力于为每一位客人提供高品质的住宿体验，让您在旅途中感受家的温暖
          </p>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card className="h-full">
              <img
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20boutique%20hotel%20lobby%20reception%20elegant%20warm%20atmosphere&image_size=landscape_16_9"
                alt="青禾民宿"
                className="w-full h-80 object-cover rounded-lg mb-6"
              />
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">我们的故事</h2>
                <p className="text-gray-600 leading-relaxed">
                  青禾民宿成立于2018年，源于创始人对旅行和生活的热爱。我们相信，每一次旅行都应该是一次心灵的放松，
                  每一个住处都应该是一个温暖的家。从第一家"青禾山居"开始，我们始终坚持"精品、贴心、自然"的理念，
                  为每一位客人打造独一无二的入住体验。
                </p>
                <p className="text-gray-600 leading-relaxed">
                  目前，青禾民宿已在多个热门旅游目的地拥有分店，包括山景、海景、庭院等多种风格的精品房源。
                  我们精心挑选每一处物业，用心设计每一个细节，只为给您带来最美好的住宿回忆。
                </p>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card className="h-full" title="我们的理念">
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <h4 className="font-semibold mb-1">品质至上</h4>
                        <p className="text-gray-600 text-sm">每一间客房都经过精心设计和严格把控，确保高品质的入住体验</p>
                      </div>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <div>
                        <h4 className="font-semibold mb-1">贴心服务</h4>
                        <p className="text-gray-600 text-sm">24小时管家服务，从入住前到退房后，全程为您提供贴心帮助</p>
                      </div>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <div>
                        <h4 className="font-semibold mb-1">本地特色</h4>
                        <p className="text-gray-600 text-sm">深度融入当地文化，为您推荐最地道的美食和游玩路线</p>
                      </div>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <div>
                        <h4 className="font-semibold mb-1">环保可持续</h4>
                        <p className="text-gray-600 text-sm">践行绿色环保理念，使用可降解用品，减少对环境的影响</p>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Divider className="my-12" />

        <Card title="联系我们" className="mb-8">
          <Row gutter={[32, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Space align="start" size="middle">
                <EnvironmentOutlined className="text-2xl text-primary-600 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">总部地址</h4>
                  <p className="text-gray-600">浙江省杭州市西湖区青禾路88号</p>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space align="start" size="middle">
                <PhoneOutlined className="text-2xl text-primary-600 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">客服热线</h4>
                  <p className="text-gray-600">400-888-8888</p>
                  <p className="text-gray-500 text-sm">7×24小时服务</p>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space align="start" size="middle">
                <MailOutlined className="text-2xl text-primary-600 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">电子邮箱</h4>
                  <p className="text-gray-600">service@qinghe.com</p>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space align="start" size="middle">
                <ClockCircleOutlined className="text-2xl text-primary-600 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">工作时间</h4>
                  <p className="text-gray-600">全年无休</p>
                  <p className="text-gray-500 text-sm">随时为您服务</p>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        <Card className="bg-gradient-to-r from-primary-50 to-qinghe-50 border-0">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">加入青禾会员</h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              注册成为青禾会员，享受专属优惠、积分兑换、生日礼遇等多重福利
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
