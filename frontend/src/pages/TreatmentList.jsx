import { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Select,
  Button,
  Row,
  Col,
  Tag,
  Badge,
  Modal,
  Descriptions,
  Empty,
  Space,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  EyeOutlined,
  FilterOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { getTreatmentList, getTreatmentCategories, getTreatmentDetail } from '../api/treatment'

const { Option } = Select
const { Search } = Input

const TreatmentList = () => {
  const [loading, setLoading] = useState(false)
  const [treatments, setTreatments] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState(null)

  useEffect(() => {
    loadCategories()
    loadTreatments()
  }, [])

  const loadCategories = async () => {
    const res = await getTreatmentCategories()
    if (res.code === 0) {
      setCategories(res.data)
    }
  }

  const loadTreatments = async () => {
    setLoading(true)
    try {
      const res = await getTreatmentList({
        category: activeCategory === '全部' ? '' : activeCategory,
        keyword: searchKeyword,
      })
      if (res.code === 0) {
        setTreatments(res.data.list)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    setActiveCategory(category)
  }

  const handleSearch = (value) => {
    setSearchKeyword(value)
  }

  const handleViewDetail = async (treatment) => {
    const res = await getTreatmentDetail(treatment.id)
    if (res.code === 0) {
      setSelectedTreatment(res.data)
      setDetailModalVisible(true)
    }
  }

  const filteredTreatments = treatments.filter((item) => {
    if (activeCategory === '全部') return true
    return item.category === activeCategory
  })

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>疗程列表</h2>
        <Search
          placeholder="搜索疗程名称"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          {categories.map((cat) => (
            <Tag.CheckableTag
              key={cat.id}
              checked={activeCategory === cat.name}
              onChange={() => handleCategoryClick(cat.name)}
              style={{
                fontSize: 14,
                padding: '4px 16px',
                borderRadius: 4,
              }}
            >
              <FilterOutlined style={{ marginRight: 4 }} />
              {cat.name}
            </Tag.CheckableTag>
          ))}
        </Space>
      </Card>

      {filteredTreatments.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredTreatments.map((treatment) => (
            <Col xs={24} sm={12} md={8} lg={6} key={treatment.id}>
              <Badge.Ribbon text={`${treatment.totalCount}次卡`} color="blue">
                <Card
                  hoverable
                  loading={loading}
                  cover={
                    <img
                      alt={treatment.name}
                      src={treatment.image}
                      style={{ height: 180, objectFit: 'cover' }}
                    />
                  }
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(treatment)}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{treatment.name}</span>
                        <Tag color="gold" style={{ marginLeft: 'auto' }}>
                          {treatment.category}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div
                          style={{
                            color: '#f5222d',
                            fontSize: 20,
                            fontWeight: 'bold',
                            marginBottom: 8,
                          }}
                        >
                          ¥{treatment.price}
                          <span
                            style={{
                              color: '#999',
                              fontSize: 12,
                              textDecoration: 'line-through',
                              marginLeft: 8,
                              fontWeight: 'normal',
                            }}
                          >
                            ¥{treatment.originalPrice}
                          </span>
                        </div>
                        <div style={{ color: '#999', fontSize: 13, marginBottom: 8 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {treatment.duration}分钟/次
                          <span style={{ margin: '0 8px' }}>|</span>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          有效期{treatment.validPeriod}个月
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {treatment.features?.slice(0, 3).map((feature, idx) => (
                            <Tag key={idx} color="blue" style={{ fontSize: 11 }}>
                              {feature}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="暂无疗程数据" />
      )}

      <Modal
        title="疗程详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedTreatment && (
          <div>
            <img
              alt={selectedTreatment.name}
              src={selectedTreatment.image}
              style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 8 }}
            />
            <Divider />
            <h2 style={{ margin: '12px 0' }}>
              {selectedTreatment.name}
              <Tag color="gold" style={{ marginLeft: 12 }}>
                {selectedTreatment.category}
              </Tag>
            </h2>
            <div
              style={{
                color: '#f5222d',
                fontSize: 28,
                fontWeight: 'bold',
                marginBottom: 16,
              }}
            >
              ¥{selectedTreatment.price}
              <span
                style={{
                  color: '#999',
                  fontSize: 16,
                  textDecoration: 'line-through',
                  marginLeft: 12,
                  fontWeight: 'normal',
                }}
              >
                ¥{selectedTreatment.originalPrice}
              </span>
            </div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="疗程次数">
                {selectedTreatment.totalCount}次
              </Descriptions.Item>
              <Descriptions.Item label="单次时长">
                {selectedTreatment.duration}分钟
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                {selectedTreatment.validPeriod}个月
              </Descriptions.Item>
              <Descriptions.Item label="性价比">
                <StarOutlined style={{ color: '#faad14' }} /> 超值
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>疗程介绍</h4>
              <p style={{ color: '#666', lineHeight: 1.8 }}>
                {selectedTreatment.description}
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>疗程功效</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedTreatment.features?.map((feature, idx) => (
                  <Tag key={idx} color="green">
                    {feature}
                  </Tag>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>适合人群</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedTreatment.suitablePeople?.map((item, idx) => (
                  <Tag key={idx} color="blue">
                    {item}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: 8 }}>禁忌人群</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedTreatment.taboo?.map((item, idx) => (
                  <Tag key={idx} color="red">
                    {item}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TreatmentList
