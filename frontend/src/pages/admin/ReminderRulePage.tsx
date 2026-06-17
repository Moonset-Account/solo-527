import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Modal,
  Tag,
  message,
  Typography,
  Drawer,
  Descriptions,
  Switch,
  InputNumber,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons'
import {
  getReminderRuleList,
  createReminderRule,
  updateReminderRule,
  toggleReminderRule,
  getReminderRuleById,
} from '@/api/config'
import type { ReminderRule } from '@/types'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const ReminderRulePage = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReminderRule[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<ReminderRule | null>(null)

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ReminderRule | null>(null)

  useEffect(() => {
    fetchData()
  }, [page, size])

  const fetchData = async (values?: any) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        size,
        ...values,
      }
      const res = await getReminderRuleList(params)
      if (res.data.code === 200) {
        setData(res.data.data.records)
        setTotal(res.data.data.total)
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(0)
    searchForm.validateFields().then((values) => {
      fetchData(values)
    })
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPage(0)
    fetchData()
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      enabled: true,
      reminderLevel: 'INFO',
      reminderWay: 'SYSTEM',
    })
    setModalVisible(true)
  }

  const handleEdit = async (record: ReminderRule) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        await updateReminderRule({ ...editingItem, ...values })
        message.success('更新成功')
      } else {
        await createReminderRule(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await toggleReminderRule(id, enabled)
      message.success('状态更新成功')
      fetchData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleViewDetail = (record: ReminderRule) => {
    setSelectedItem(record)
    setDetailDrawerVisible(true)
  }

  const columns = [
    {
      title: '规则编码',
      dataIndex: 'ruleCode',
      key: 'ruleCode',
      width: 180,
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
    },
    {
      title: '规则类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: (val: string) => {
        const map: Record<string, string> = {
          INVENTORY: '库存提醒',
          ROOM_STATUS: '房态提醒',
          CLEANING: '清洁提醒',
          ORDER: '订单提醒',
        }
        return map[val] || val
      },
    },
    {
      title: '提醒级别',
      dataIndex: 'reminderLevel',
      key: 'reminderLevel',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          INFO: 'blue',
          WARN: 'orange',
          ERROR: 'red',
          CRITICAL: 'purple',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '升级规则',
      dataIndex: 'upgradeRuleCode',
      key: 'upgradeRuleCode',
      render: (val: string) => val || '-',
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (val: boolean, record: ReminderRule) => (
        <Switch
          checked={val}
          onChange={(checked) => handleToggle(record.id, checked)}
        />
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (val: number) => `v${val}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ReminderRule) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.upgradeRuleCode && (
            <Button type="link" size="small" icon={<ArrowUpOutlined />}>
              升级条件
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>提醒规则</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增规则
        </Button>
      </div>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="ruleCode" label="规则编码">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="ruleName" label="规则名称">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="ruleType" label="规则类型">
          <Select placeholder="请选择" style={{ width: 120 }} allowClear>
            <Option value="INVENTORY">库存提醒</Option>
            <Option value="ROOM_STATUS">房态提醒</Option>
            <Option value="CLEANING">清洁提醒</Option>
            <Option value="ORDER">订单提醒</Option>
          </Select>
        </Form.Item>
        <Form.Item name="enabled" label="是否启用">
          <Select placeholder="请选择" style={{ width: 100 }} allowClear>
            <Option value={true}>启用</Option>
            <Option value={false}>停用</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        loading={loading}
        dataSource={data}
        columns={columns}
        rowKey="id"
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          onChange: (p, s) => {
            setPage(p - 1)
            setSize(s)
          },
        }}
      />

      <Modal
        title={editingItem ? '编辑规则' : '新增规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="ruleCode" label="规则编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ruleName" label="规则名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ruleType" label="规则类型">
            <Select>
              <Option value="INVENTORY">库存提醒</Option>
              <Option value="ROOM_STATUS">房态提醒</Option>
              <Option value="CLEANING">清洁提醒</Option>
              <Option value="ORDER">订单提醒</Option>
            </Select>
          </Form.Item>
          <Form.Item name="triggerCondition" label="触发条件">
            <TextArea rows={3} placeholder="例如：availableQuantity < 5" />
          </Form.Item>
          <Form.Item name="reminderLevel" label="提醒级别">
            <Select>
              <Option value="INFO">信息</Option>
              <Option value="WARN">警告</Option>
              <Option value="ERROR">错误</Option>
              <Option value="CRITICAL">严重</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reminderWay" label="提醒方式">
            <Select>
              <Option value="SYSTEM">系统消息</Option>
              <Option value="SMS">短信</Option>
              <Option value="EMAIL">邮件</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reminderTemplate" label="提醒模板">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="升级条件">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="upgradeCondition" noStyle>
                <TextArea rows={2} placeholder="升级条件表达式" />
              </Form.Item>
              <Form.Item name="upgradeRuleCode" noStyle>
                <Select placeholder="升级后规则" style={{ width: 150 }} allowClear>
                  {data.map((r) => (
                    <Option key={r.id} value={r.ruleCode}>
                      {r.ruleName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="规则详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
      >
        {selectedItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="规则编码">{selectedItem.ruleCode}</Descriptions.Item>
            <Descriptions.Item label="规则名称">{selectedItem.ruleName}</Descriptions.Item>
            <Descriptions.Item label="规则类型">{selectedItem.ruleType}</Descriptions.Item>
            <Descriptions.Item label="触发条件">{selectedItem.triggerCondition || '-'}</Descriptions.Item>
            <Descriptions.Item label="提醒级别">{selectedItem.reminderLevel}</Descriptions.Item>
            <Descriptions.Item label="提醒方式">{selectedItem.reminderWay}</Descriptions.Item>
            <Descriptions.Item label="提醒模板">{selectedItem.reminderTemplate || '-'}</Descriptions.Item>
            <Descriptions.Item label="升级条件">{selectedItem.upgradeCondition || '-'}</Descriptions.Item>
            <Descriptions.Item label="升级规则">{selectedItem.upgradeRuleCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="启用状态">{selectedItem.enabled ? '是' : '否'}</Descriptions.Item>
            <Descriptions.Item label="版本号">v{selectedItem.version}</Descriptions.Item>
            <Descriptions.Item label="备注">{selectedItem.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default ReminderRulePage
