import { useEffect, useState } from 'react';
import { Carousel, Card, Button, Tag, Space, Row, Col } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, PhoneOutlined, StarOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { formatCurrency } from '@/utils';
import type { Property, Room } from '@/types';

const { Meta } = Card;

export default function Home() {
  const navigate = useNavigate();
  const { properties, rooms, fetchProperties, fetchRooms } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProperties(), fetchRooms()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProperties, fetchRooms]);

  const carouselImages = [
    {
      url: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20boutique%20hotel%20mountain%20view%20sunrise%20serene%20beautiful&image_size=landscape_16_9",
      title: "青禾山居",
      subtitle: "远离喧嚣，回归自然"
    },
    {
      url: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oceanview%20boutique%20resort%20sunset%20beach%20luxury&image_size=landscape_16_9",
      title: "青禾海畔",
      subtitle: "面朝大海，春暖花开"
    },
    {
      url: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20boutique%20hotel%20garden%20courtyard%20traditional%20chinese%20architecture&image_size=landscape_16_9",
      title: "雅致庭院",
      subtitle: "闹中取静，尽享悠然"
    }
  ];

  const renderPropertyCard = (property: Property) => (
    <Card
      key={property.id}
      hoverable
      className="h-full"
      cover={
        <img
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20boutique%20hotel%20exterior%20facade%20modern%20elegant&image_size=landscape_4_3"
          alt={property.name}
          className="h-48 object-cover"
        />
      }
      actions={[
        <Button type="primary" onClick={() => navigate('/booking')}>
          立即预订
        </Button>
      ]}
    >
      <Meta
        title={<span className="text-lg font-semibold">{property.name}</span>}
        description={
          <div className="space-y-2">
            <p className="text-gray-600 line-clamp-2">{property.description}</p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <EnvironmentOutlined />
              <span>{property.city}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <PhoneOutlined />
              <span>{property.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <StarOutlined className="text-yellow-500" />
              <StarOutlined className="text-yellow-500" />
              <StarOutlined className="text-yellow-500" />
              <StarOutlined className="text-yellow-500" />
              <StarOutlined className="text-yellow-500" />
              <span className="text-gray-500 text-sm ml-1">精品民宿</span>
            </div>
          </div>
        }
      />
    </Card>
  );

  const renderRoomCard = (room: Room) => (
    <Card
      key={room.id}
      hoverable
      className="h-full"
      cover={
        <img
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20hotel%20room%20interior%20king%20bed%20elegant%20design&image_size=landscape_4_3"
          alt={room.name}
          className="h-48 object-cover"
        />
      }
      actions={[
        <Button type="primary" onClick={() => navigate('/booking')}>
          查看房态
        </Button>
      ]}
    >
      <Meta
        title={
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">{room.name}</span>
            <span className="text-primary-600 font-bold text-xl">
              {formatCurrency(room.base_price)}
              <span className="text-sm font-normal text-gray-500">/晚</span>
            </span>
          </div>
        }
        description={
          <div className="space-y-3">
            <p className="text-gray-600 line-clamp-2">{room.description}</p>
            <Space wrap>
              <Tag color="green">
                <UserOutlined className="mr-1" />
                最多 {room.max_guests} 人
              </Tag>
              <Tag color="blue">{room.room_type}</Tag>
              <Tag color="orange">{room.bed_count} 张床</Tag>
              <Tag color="purple">{room.size_sqm}㎡</Tag>
            </Space>
            <div className="flex flex-wrap gap-2">
              {room.amenities?.slice(0, 4).map((amenity) => (
                <Tag key={amenity.id}>{amenity.name}</Tag>
              ))}
              {room.amenities && room.amenities.length > 4 && (
                <Tag>等 {room.amenities.length} 项</Tag>
              )}
            </div>
          </div>
        }
      />
    </Card>
  );

  return (
    <div className="min-h-screen">
      <Carousel autoplay effect="fade" className="h-[500px]">
        {carouselImages.map((image, index) => (
          <div key={index} className="relative h-[500px]">
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
              <div className="text-white px-24 max-w-2xl">
                <h2 className="text-5xl font-bold mb-4">{image.title}</h2>
                <p className="text-2xl mb-8 opacity-90">{image.subtitle}</p>
                <Button
                  type="primary"
                  size="large"
                  className="h-12 px-8 text-lg"
                  onClick={() => navigate('/booking')}
                >
                  <CalendarOutlined className="mr-2" />
                  立即预订
                </Button>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      <section className="py-16 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">我们的民宿</h2>
            <p className="text-gray-500 text-lg">精选优质房源，为您打造独一无二的入住体验</p>
          </div>
          <Row gutter={[24, 24]}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Col key={i} xs={24} md={8}>
                  <Card loading className="h-96" />
                </Col>
              ))
            ) : (
              properties.slice(0, 3).map((property) => (
                <Col key={property.id} xs={24} md={8}>
                  {renderPropertyCard(property)}
                </Col>
              ))
            )}
          </Row>
        </div>
      </section>

      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">精选房型</h2>
            <p className="text-gray-500 text-lg">多种房型选择，满足您的不同需求</p>
          </div>
          <Row gutter={[24, 24]}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Col key={i} xs={24} sm={12} lg={8}>
                  <Card loading className="h-[480px]" />
                </Col>
              ))
            ) : (
              rooms.slice(0, 6).map((room) => (
                <Col key={room.id} xs={24} sm={12} lg={8}>
                  {renderRoomCard(room)}
                </Col>
              ))
            )}
          </Row>
        </div>
      </section>

      <section className="py-16 px-8 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">为什么选择青禾民宿？</h2>
          <Row gutter={[48, 24]}>
            <Col xs={24} sm={8}>
              <div className="text-5xl mb-4">🏡</div>
              <h3 className="text-xl font-semibold mb-2">精选房源</h3>
              <p className="text-green-100">每一间民宿都经过精心挑选，确保品质</p>
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-2">贴心服务</h3>
              <p className="text-green-100">24小时管家服务，让您的旅程无忧</p>
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-semibold mb-2">黄金地段</h3>
              <p className="text-green-100">位于景区核心区域，交通便利</p>
            </Col>
          </Row>
        </div>
      </section>

      <section className="py-16 px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">准备好开始您的旅程了吗？</h2>
          <p className="text-gray-500 text-lg mb-8">立即查询房态，开启您的完美假期</p>
          <Button
            type="primary"
            size="large"
            className="h-14 px-12 text-xl"
            onClick={() => navigate('/booking')}
          >
            <CalendarOutlined className="mr-2" />
            查询房态并预订
          </Button>
        </div>
      </section>
    </div>
  );
}
