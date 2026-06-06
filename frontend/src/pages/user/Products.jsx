import { Row, Col, Card, Button, InputNumber, Badge, FloatButton, Modal, Form, Select, Input, message, Spin, Tabs } from 'antd'
import { ShoppingCartOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getProducts, getBuildings, createOrder, getProductCategories } from '../../api/user'

function UserProducts() {
  const [products, setProducts] = useState([])
  const [buildings, setBuildings] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState({})
  const [cartVisible, setCartVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadData()
    const userStr = localStorage.getItem('user')
    if (userStr) setUser(JSON.parse(userStr))
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, bRes, cRes] = await Promise.all([
        getProducts(),
        getBuildings(),
        getProductCategories()
      ])
      setProducts(pRes.data?.items || [])
      setBuildings(bRes.data || [])
      setCategories(cRes.data || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[product.id]) {
        newCart[product.id].quantity += 1
      } else {
        newCart[product.id] = { ...product, quantity: 1 }
      }
      return newCart
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[productId]) {
        if (newCart[productId].quantity > 1) {
          newCart[productId].quantity -= 1
        } else {
          delete newCart[productId]
        }
      }
      return newCart
    })
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => ({
      ...prev,
      [productId]: { ...prev[productId], quantity }
    }))
  }

  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = Object.values(cart).reduce((sum, item) => sum + item.quantity * item.price, 0)

  const handleSubmitOrder = async (values) => {
    const items = Object.values(cart).map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }))
    try {
      await createOrder({ ...values, items })
      message.success('下单成功')
      setCart({})
      setCartVisible(false)
    } catch (e) {}
  }

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory)

  const tabItems = [
    { key: 'all', label: '全部' },
    ...categories.map(c => ({ key: c, label: c }))
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">商品列表</h2>
      </div>
      
      <Tabs activeKey={activeCategory} onChange={setActiveCategory} items={tabItems} style={{ marginBottom: 16 }} />
      
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {filteredProducts.map(product => (
            <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
              <Card
                hoverable
                className="product-card"
                cover={<img alt={product.name} src={product.image} style={{ height: 150, objectFit: 'cover' }} />}
                actions={[
                  <div key="qty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Button size="small" shape="circle" icon={<MinusOutlined />} onClick={() => removeFromCart(product.id)} />
                    <span style={{ minWidth: 24, textAlign: 'center' }}>{cart[product.id]?.quantity || 0}</span>
                    <Button size="small" shape="circle" type="primary" icon={<PlusOutlined />} onClick={() => addToCart(product)} style={{ background: '#52c41a' }} />
                  </div>
                ]}
              >
                <Card.Meta
                  title={product.name}
                  description={
                    <div>
                      <div style={{ color: '#f5222d', fontSize: 16, fontWeight: 600 }}>¥{product.price}/{product.unit}</div>
                      <div style={{ color: '#999', fontSize: 12 }}>库存: {product.stock}</div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      {cartCount > 0 && (
        <FloatButton
          icon={<Badge count={cartCount}><ShoppingCartOutlined style={{ fontSize: 20 }} /></Badge>}
          description={`¥${cartTotal.toFixed(2)}`}
          type="primary"
          style={{ right: 24, width: 120, height: 56, borderRadius: 28, background: '#52c41a' }}
          onClick={() => setCartVisible(true)}
        />
      )}

      <Modal
        title="确认下单"
        open={cartVisible}
        onCancel={() => setCartVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
          {Object.values(cart).map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span>{item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <InputNumber
                  size="small"
                  min={0}
                  max={99}
                  value={item.quantity}
                  onChange={(v) => updateQuantity(item.id, v)}
                />
                <span style={{ color: '#f5222d', width: 80, textAlign: 'right' }}>¥{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'right', padding: '12px 0', fontSize: 16, fontWeight: 600 }}>
            合计：<span style={{ color: '#f5222d' }}>¥{cartTotal.toFixed(2)}</span>
          </div>
        </div>
        <Form layout="vertical" onFinish={handleSubmitOrder}>
          <Form.Item
            name="building_id"
            label="配送楼栋"
            initialValue={user?.building_id}
            rules={[{ required: true, message: '请选择楼栋' }]}
          >
            <Select placeholder="选择楼栋">
              {buildings.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="room_number" label="房号" initialValue={user?.room_number}>
            <Input placeholder="请输入房号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="备注信息" rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ background: '#52c41a' }}>
              提交订单
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserProducts
