import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  DatePicker,
  Divider,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { createLead } from '../api/lead'
import { getAllTags } from '../api/tag'
import { useEffect } from 'react'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const LeadCreate = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [allTags, setAllTags] = useState([])

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const res = await getAllTags()
      setAllTags(res || [])
    } catch (e) {}
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = {
        ...values,
        moveInDate: values.moveInDate ? values.moveInDate.format('YYYY-MM-DD') : undefined,
      }
      const res = await createLead(data)
      message.success('创建成功')
      navigate(`/leads/${res.id}`)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h2 style={{ margin: 0 }}>新增线索</h2>
        </Space>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: 'NEW', level: 'C' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="customerName"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="电话"
                rules={[{ required: true, message: '请输入电话' }]}
              >
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="age" label="年龄">
                <InputNumber style={{ width: '100%' }} placeholder="请输入年龄" min={0} max={120} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="source" label="来源">
                <Select placeholder="请选择来源">
                  <Option value="网络咨询">网络咨询</Option>
                  <Option value="电话咨询">电话咨询</Option>
                  <Option value="门店到访">门店到访</Option>
                  <Option value="老客户推荐">老客户推荐</Option>
                  <Option value="活动">活动</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="level" label="客户等级">
                <Select placeholder="请选择等级">
                  <Option value="S">S级</Option>
                  <Option value="A">A级</Option>
                  <Option value="B">B级</Option>
                  <Option value="C">C级</Option>
                  <Option value="D">D级</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">房屋信息</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="community" label="小区">
                <Input placeholder="请输入小区名称" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="address" label="地址">
                <Input placeholder="请输入详细地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="houseType" label="房屋类型">
                <Select placeholder="请选择房屋类型">
                  <Option value="平层">平层</Option>
                  <Option value="复式">复式</Option>
                  <Option value="别墅">别墅</Option>
                  <Option value="公寓">公寓</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="houseArea" label="房屋面积(㎡)">
                <InputNumber style={{ width: '100%' }} placeholder="请输入面积" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="decorationType" label="装修类型">
                <Select placeholder="请选择装修类型">
                  <Option value="全包">全包</Option>
                  <Option value="半包">半包</Option>
                  <Option value="清包">清包</Option>
                  <Option value="整装">整装</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="decorationStyle" label="装修风格">
                <Select placeholder="请选择风格">
                  <Option value="现代简约">现代简约</Option>
                  <Option value="北欧">北欧</Option>
                  <Option value="中式">中式</Option>
                  <Option value="欧式">欧式</Option>
                  <Option value="美式">美式</Option>
                  <Option value="日式">日式</Option>
                  <Option value="轻奢">轻奢</Option>
                  <Option value="工业风">工业风</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="budgetMin" label="预算下限(元)">
                <InputNumber style={{ width: '100%' }} placeholder="最低预算" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="budgetMax" label="预算上限(元)">
                <InputNumber style={{ width: '100%' }} placeholder="最高预算" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="moveInDate" label="预计入住时间">
                <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Button onClick={() => navigate(-1)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default LeadCreate
