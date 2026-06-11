import { useState } from 'react'
import {
  Tabs,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Slider,
  message,
  Popconfirm,
  Radio,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  SettingOutlined,
} from '@ant-design/icons'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

type PromptStatus = 'all' | 'active' | 'inactive' | 'draft'

interface PromptItem {
  key: string
  id: string
  name: string
  version: string
  status: 'active' | 'inactive' | 'draft'
  grayScale: number
  applicableGroups: string[]
  createTime: string
  updateTime: string
}

interface ModelItem {
  key: string
  id: string
  name: string
  provider: string
  enabled: boolean
  price: number
  priceUnit: string
  description: string
}

interface ReviewRuleItem {
  key: string
  id: string
  name: string
  type: 'keyword' | 'regex' | 'semantic'
  pattern: string
  riskLevel: 'low' | 'medium' | 'high'
  enabled: boolean
}

interface RiskRuleItem {
  key: string
  id: string
  name: string
  type: 'keyword' | 'regex' | 'semantic'
  matchMode: 'exact' | 'fuzzy' | 'regex'
  riskLevel: 'low' | 'medium' | 'high'
  enabled: boolean
}

const getStatusTag = (status: string) => {
  const colorMap: Record<string, string> = {
    active: 'success',
    inactive: 'error',
    draft: 'default',
  }
  const textMap: Record<string, string> = {
    active: '启用中',
    inactive: '已停用',
    draft: '草稿',
  }
  return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
}

const getRiskLevelTag = (level: string) => {
  const colorMap: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'green',
  }
  const textMap: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  }
  return <Tag color={colorMap[level]}>{textMap[level]}</Tag>
}

const Config: React.FC = () => {
  const [activeTab, setActiveTab] = useState('prompt')

  const [promptStatus, setPromptStatus] = useState<PromptStatus>('all')
  const [promptModalVisible, setPromptModalVisible] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null)
  const [grayModalVisible, setGrayModalVisible] = useState(false)
  const [promptForm] = Form.useForm()
  const [grayForm] = Form.useForm()

  const [modelModalVisible, setModelModalVisible] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelItem | null>(null)
  const [modelForm] = Form.useForm()

  const [reviewRuleModalVisible, setReviewRuleModalVisible] = useState(false)
  const [editingReviewRule, setEditingReviewRule] = useState<ReviewRuleItem | null>(null)
  const [reviewRuleForm] = Form.useForm()

  const [riskRuleModalVisible, setRiskRuleModalVisible] = useState(false)
  const [editingRiskRule, setEditingRiskRule] = useState<RiskRuleItem | null>(null)
  const [riskRuleForm] = Form.useForm()

  const promptData: PromptItem[] = [
    { key: '1', id: 'P001', name: '客服问候语', version: 'v2.0.0', status: 'active', grayScale: 100, applicableGroups: ['华东组', '华北组'], createTime: '2024-01-15 10:00:00', updateTime: '2024-06-01 14:30:00' },
    { key: '2', id: 'P002', name: '产品介绍模板', version: 'v1.3.0', status: 'active', grayScale: 60, applicableGroups: ['华南组'], createTime: '2024-02-20 09:00:00', updateTime: '2024-05-20 11:00:00' },
    { key: '3', id: 'P003', name: '投诉处理话术', version: 'v1.1.0', status: 'inactive', grayScale: 0, applicableGroups: [], createTime: '2024-03-10 14:00:00', updateTime: '2024-04-15 16:20:00' },
    { key: '4', id: 'P004', name: '售后引导语', version: 'v0.9.0', status: 'draft', grayScale: 0, applicableGroups: [], createTime: '2024-06-05 08:30:00', updateTime: '2024-06-08 17:45:00' },
    { key: '5', id: 'P005', name: '订单查询回复', version: 'v1.2.0', status: 'active', grayScale: 80, applicableGroups: ['西南组', '西北组'], createTime: '2024-02-01 10:00:00', updateTime: '2024-05-10 13:00:00' },
  ]

  const modelData: ModelItem[] = [
    { key: '1', id: 'M001', name: 'GPT-4o', provider: 'OpenAI', enabled: true, price: 0.015, priceUnit: '/1K tokens', description: '最新一代大语言模型，性能最优' },
    { key: '2', id: 'M002', name: 'GPT-3.5 Turbo', provider: 'OpenAI', enabled: true, price: 0.0015, priceUnit: '/1K tokens', description: '性价比高，适合日常使用' },
    { key: '3', id: 'M003', name: 'Claude 3 Opus', provider: 'Anthropic', enabled: false, price: 0.015, priceUnit: '/1K tokens', description: '长文本理解能力强' },
    { key: '4', id: 'M004', name: '通义千问', provider: '阿里云', enabled: true, price: 0.008, priceUnit: '/1K tokens', description: '国内主流大模型，响应快' },
    { key: '5', id: 'M005', name: '文心一言', provider: '百度', enabled: false, price: 0.012, priceUnit: '/1K tokens', description: '百度自研大语言模型' },
  ]

  const reviewRuleData: ReviewRuleItem[] = [
    { key: '1', id: 'R001', name: '敏感词检测', type: 'keyword', pattern: '违禁词词库', riskLevel: 'high', enabled: true },
    { key: '2', id: 'R002', name: '手机号识别', type: 'regex', pattern: '1[3-9]\\d{9}', riskLevel: 'medium', enabled: true },
    { key: '3', id: 'R003', name: '辱骂性语言检测', type: 'semantic', pattern: '语义模型-辱骂', riskLevel: 'high', enabled: true },
    { key: '4', id: 'R004', name: '广告推广检测', type: 'keyword', pattern: '广告关键词库', riskLevel: 'low', enabled: false },
    { key: '5', id: 'R005', name: '身份证号识别', type: 'regex', pattern: '\\d{17}[\\dXx]', riskLevel: 'medium', enabled: true },
  ]

  const riskRuleData: RiskRuleItem[] = [
    { key: '1', id: 'RR001', name: '欺诈风险词', type: 'keyword', matchMode: 'fuzzy', riskLevel: 'high', enabled: true },
    { key: '2', id: 'RR002', name: '隐私泄露模式', type: 'regex', matchMode: 'regex', riskLevel: 'high', enabled: true },
    { key: '3', id: 'RR003', name: '诱导转账', type: 'semantic', matchMode: 'exact', riskLevel: 'high', enabled: true },
    { key: '4', id: 'RR004', name: '恶意投诉模板', type: 'keyword', matchMode: 'fuzzy', riskLevel: 'medium', enabled: false },
    { key: '5', id: 'RR005', name: '竞品推广词', type: 'keyword', matchMode: 'exact', riskLevel: 'low', enabled: true },
  ]

  const filteredPromptData = promptStatus === 'all'
    ? promptData
    : promptData.filter(item => item.status === promptStatus)

  const promptColumns: ColumnsType<PromptItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '灰度比例',
      dataIndex: 'grayScale',
      key: 'grayScale',
      width: 120,
      render: (scale: number, record) => (
        record.status === 'active' ? `${scale}%` : '-'
      ),
    },
    {
      title: '适用分组',
      dataIndex: 'applicableGroups',
      key: 'applicableGroups',
      width: 200,
      render: (groups: string[]) => (
        groups.length > 0 ? groups.join('、') : '-'
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => handlePublishPrompt(record)}
            >
              发布
            </Button>
          )}
          {record.status === 'active' && (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleTogglePromptStatus(record, false)}
            >
              停用
            </Button>
          )}
          {record.status === 'inactive' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleTogglePromptStatus(record, true)}
            >
              启用
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleGrayConfig(record)}
          >
            灰度配置
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPrompt(record)}
            disabled={record.status === 'active'}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const modelColumns: ColumnsType<ModelItem> = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (price: number, record) => (
        <span>
          <span style={{ color: '#ff4d4f', fontWeight: 500 }}>${price}</span>
          <span style={{ color: '#999' }}>{record.priceUnit}</span>
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '已启用' : '已停用'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleModelStatus(record)}
          >
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditModel(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const reviewRuleColumns: ColumnsType<ReviewRuleItem> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          keyword: '关键词',
          regex: '正则表达式',
          semantic: '语义识别',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '匹配模式',
      dataIndex: 'pattern',
      key: 'pattern',
      ellipsis: true,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 120,
      render: (level: string) => getRiskLevelTag(level),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '已启用' : '已停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleReviewRuleStatus(record)}
          >
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditReviewRule(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条规则吗？"
            onConfirm={() => handleDeleteReviewRule(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const riskRuleColumns: ColumnsType<RiskRuleItem> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          keyword: '关键词',
          regex: '正则表达式',
          semantic: '语义识别',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '匹配模式',
      dataIndex: 'matchMode',
      key: 'matchMode',
      width: 120,
      render: (mode: string) => {
        const modeMap: Record<string, string> = {
          exact: '精确匹配',
          fuzzy: '模糊匹配',
          regex: '正则匹配',
        }
        return modeMap[mode] || mode
      },
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 120,
      render: (level: string) => getRiskLevelTag(level),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '已启用' : '已停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleRiskRuleStatus(record)}
          >
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRiskRule(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条规则吗？"
            onConfirm={() => handleDeleteRiskRule(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleTogglePromptStatus = (_record: PromptItem, activate: boolean) => {
    const action = activate ? '启用' : '停用'
    Modal.confirm({
      title: `确定要${action}该提示词吗？`,
      content: `${action}后将${activate ? '立即生效' : '停止使用'}该提示词配置。`,
      onOk: () => {
        message.success(`提示词${action}成功`)
      },
    })
  }

  const handlePublishPrompt = (_record: PromptItem) => {
    Modal.confirm({
      title: '确定要发布该草稿吗？',
      content: '发布后提示词将进入启用状态，可配置灰度比例。',
      onOk: () => {
        message.success('提示词发布成功')
      },
    })
  }

  const handleEditPrompt = (record: PromptItem) => {
    setEditingPrompt(record)
    promptForm.setFieldsValue(record)
    setPromptModalVisible(true)
  }

  const handleAddPrompt = () => {
    setEditingPrompt(null)
    promptForm.resetFields()
    promptForm.setFieldsValue({ status: 'draft' })
    setPromptModalVisible(true)
  }

  const handlePromptSubmit = () => {
    promptForm.validateFields().then(() => {
      message.success(editingPrompt ? '提示词编辑成功' : '提示词创建成功')
      setPromptModalVisible(false)
    })
  }

  const handleGrayConfig = (record: PromptItem) => {
    grayForm.setFieldsValue({
      grayScale: record.grayScale,
      applicableGroups: record.applicableGroups,
    })
    setGrayModalVisible(true)
  }

  const handleGraySubmit = () => {
    grayForm.validateFields().then(() => {
      message.success('灰度配置保存成功')
      setGrayModalVisible(false)
    })
  }

  const handleToggleModelStatus = (record: ModelItem) => {
    const action = record.enabled ? '停用' : '启用'
    Modal.confirm({
      title: `确定要${action}该模型吗？`,
      content: `${action}后将${record.enabled ? '停止使用' : '启用'}该AI模型。`,
      onOk: () => {
        message.success(`模型${action}成功`)
      },
    })
  }

  const handleEditModel = (record: ModelItem) => {
    setEditingModel(record)
    modelForm.setFieldsValue(record)
    setModelModalVisible(true)
  }

  const handleAddModel = () => {
    setEditingModel(null)
    modelForm.resetFields()
    modelForm.setFieldsValue({ enabled: true })
    setModelModalVisible(true)
  }

  const handleModelSubmit = () => {
    modelForm.validateFields().then(() => {
      message.success(editingModel ? '模型编辑成功' : '模型添加成功')
      setModelModalVisible(false)
    })
  }

  const handleToggleReviewRuleStatus = (record: ReviewRuleItem) => {
    const action = record.enabled ? '停用' : '启用'
    message.success(`规则${action}成功`)
  }

  const handleEditReviewRule = (record: ReviewRuleItem) => {
    setEditingReviewRule(record)
    reviewRuleForm.setFieldsValue(record)
    setReviewRuleModalVisible(true)
  }

  const handleAddReviewRule = () => {
    setEditingReviewRule(null)
    reviewRuleForm.resetFields()
    reviewRuleForm.setFieldsValue({ type: 'keyword', riskLevel: 'medium', enabled: true })
    setReviewRuleModalVisible(true)
  }

  const handleReviewRuleSubmit = () => {
    reviewRuleForm.validateFields().then(() => {
      message.success(editingReviewRule ? '规则编辑成功' : '规则添加成功')
      setReviewRuleModalVisible(false)
    })
  }

  const handleDeleteReviewRule = (_record: ReviewRuleItem) => {
    message.success('规则删除成功')
  }

  const handleToggleRiskRuleStatus = (record: RiskRuleItem) => {
    const action = record.enabled ? '停用' : '启用'
    message.success(`规则${action}成功`)
  }

  const handleEditRiskRule = (record: RiskRuleItem) => {
    setEditingRiskRule(record)
    riskRuleForm.setFieldsValue(record)
    setRiskRuleModalVisible(true)
  }

  const handleAddRiskRule = () => {
    setEditingRiskRule(null)
    riskRuleForm.resetFields()
    riskRuleForm.setFieldsValue({ type: 'keyword', matchMode: 'fuzzy', riskLevel: 'medium', enabled: true })
    setRiskRuleModalVisible(true)
  }

  const handleRiskRuleSubmit = () => {
    riskRuleForm.validateFields().then(() => {
      message.success(editingRiskRule ? '规则编辑成功' : '规则添加成功')
      setRiskRuleModalVisible(false)
    })
  }

  const handleDeleteRiskRule = (_record: RiskRuleItem) => {
    message.success('规则删除成功')
  }

  const groupOptions = ['华东组', '华北组', '华南组', '西南组', '西北组']

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>配置管理</h2>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="提示词配置" key="prompt">
          <Card
            style={{ borderRadius: 8 }}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPrompt}>
                新建提示词
              </Button>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Radio.Group value={promptStatus} onChange={(e) => setPromptStatus(e.target.value)}>
                <Radio.Button value="all">全部</Radio.Button>
                <Radio.Button value="active">启用中</Radio.Button>
                <Radio.Button value="inactive">已停用</Radio.Button>
                <Radio.Button value="draft">草稿</Radio.Button>
              </Radio.Group>
            </div>
            <Table
              columns={promptColumns}
              dataSource={filteredPromptData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="AI模型配置" key="model">
          <Card
            style={{ borderRadius: 8 }}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModel}>
                新增模型
              </Button>
            }
          >
            <Table
              columns={modelColumns}
              dataSource={modelData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="审核规则配置" key="review">
          <Card
            style={{ borderRadius: 8 }}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddReviewRule}>
                新增规则
              </Button>
            }
          >
            <Table
              columns={reviewRuleColumns}
              dataSource={reviewRuleData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="风险规则配置" key="risk">
          <Card
            style={{ borderRadius: 8 }}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRiskRule}>
                新增规则
              </Button>
            }
          >
            <Table
              columns={riskRuleColumns}
              dataSource={riskRuleData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingPrompt ? '编辑提示词' : '新建提示词'}
        open={promptModalVisible}
        onOk={handlePromptSubmit}
        onCancel={() => setPromptModalVisible(false)}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={promptForm} layout="vertical">
          <Form.Item
            label="提示词名称"
            name="name"
            rules={[{ required: true, message: '请输入提示词名称' }]}
          >
            <Input placeholder="请输入提示词名称" />
          </Form.Item>
          <Form.Item
            label="版本号"
            name="version"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="例如：v1.0.0" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Radio.Group>
              <Radio value="draft">草稿</Radio>
              <Radio value="active">启用</Radio>
              <Radio value="inactive">停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="提示词内容"
            name="content"
            rules={[{ required: true, message: '请输入提示词内容' }]}
          >
            <TextArea rows={6} placeholder="请输入提示词内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="灰度配置"
        open={grayModalVisible}
        onOk={handleGraySubmit}
        onCancel={() => setGrayModalVisible(false)}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form form={grayForm} layout="vertical">
          <Form.Item label="灰度比例" name="grayScale">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Slider
                min={0}
                max={100}
                style={{ flex: 1 }}
                onChange={(value) => grayForm.setFieldsValue({ grayScale: value })}
              />
              <InputNumber
                formatter={(value) => `${value}%`}
                parser={(value) => (value ? Number(value.replace('%', '')) : 0)}
                style={{ width: 80 }}
                onChange={(value) => {
                  const numValue = Number(value)
                  if (!isNaN(numValue)) {
                    const clamped = Math.max(0, Math.min(100, numValue))
                    grayForm.setFieldsValue({ grayScale: clamped })
                  }
                }}
              />
            </div>
          </Form.Item>
          <Form.Item label="适用分组" name="applicableGroups">
            <Select mode="multiple" placeholder="请选择适用分组" allowClear>
              {groupOptions.map((group) => (
                <Option key={group} value={group}>
                  {group}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            提示：灰度比例为0%时，所有请求都不会使用此提示词；为100%时，所有请求都使用此提示词。
          </div>
        </Form>
      </Modal>

      <Modal
        title={editingModel ? '编辑模型配置' : '新增AI模型'}
        open={modelModalVisible}
        onOk={handleModelSubmit}
        onCancel={() => setModelModalVisible(false)}
        width={500}
        okText="确定"
        cancelText="取消"
      >
        <Form form={modelForm} layout="vertical">
          <Form.Item
            label="模型名称"
            name="name"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="请输入模型名称" />
          </Form.Item>
          <Form.Item
            label="提供商"
            name="provider"
            rules={[{ required: true, message: '请选择提供商' }]}
          >
            <Select placeholder="请选择提供商">
              <Option value="OpenAI">OpenAI</Option>
              <Option value="Anthropic">Anthropic</Option>
              <Option value="阿里云">阿里云</Option>
              <Option value="百度">百度</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: !editingModel, message: '请输入API Key' }]}
          >
            <Input.Password placeholder="请输入API Key" />
          </Form.Item>
          <Form.Item label="价格" name="price">
            <InputNumber
              min={0}
              step={0.001}
              style={{ width: '100%' }}
              placeholder="请输入价格"
              addonAfter="美元/1K tokens"
            />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="请输入模型描述" />
          </Form.Item>
          <Form.Item label="是否启用" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingReviewRule ? '编辑审核规则' : '新增审核规则'}
        open={reviewRuleModalVisible}
        onOk={handleReviewRuleSubmit}
        onCancel={() => setReviewRuleModalVisible(false)}
        width={500}
        okText="确定"
        cancelText="取消"
      >
        <Form form={reviewRuleForm} layout="vertical">
          <Form.Item
            label="规则名称"
            name="name"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item label="规则类型" name="type">
            <Radio.Group>
              <Radio value="keyword">关键词</Radio>
              <Radio value="regex">正则表达式</Radio>
              <Radio value="semantic">语义识别</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="匹配内容"
            name="pattern"
            rules={[{ required: true, message: '请输入匹配内容' }]}
          >
            <TextArea rows={4} placeholder="请输入匹配内容/正则表达式/语义模型名称" />
          </Form.Item>
          <Form.Item label="风险等级" name="riskLevel">
            <Radio.Group>
              <Radio value="low">低风险</Radio>
              <Radio value="medium">中风险</Radio>
              <Radio value="high">高风险</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="是否启用" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingRiskRule ? '编辑风险规则' : '新增风险规则'}
        open={riskRuleModalVisible}
        onOk={handleRiskRuleSubmit}
        onCancel={() => setRiskRuleModalVisible(false)}
        width={500}
        okText="确定"
        cancelText="取消"
      >
        <Form form={riskRuleForm} layout="vertical">
          <Form.Item
            label="规则名称"
            name="name"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item label="规则类型" name="type">
            <Radio.Group>
              <Radio value="keyword">关键词</Radio>
              <Radio value="regex">正则表达式</Radio>
              <Radio value="semantic">语义识别</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="匹配模式" name="matchMode">
            <Select placeholder="请选择匹配模式">
              <Option value="exact">精确匹配</Option>
              <Option value="fuzzy">模糊匹配</Option>
              <Option value="regex">正则匹配</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="匹配内容"
            name="pattern"
            rules={[{ required: true, message: '请输入匹配内容' }]}
          >
            <TextArea rows={4} placeholder="请输入匹配内容" />
          </Form.Item>
          <Form.Item label="风险等级" name="riskLevel">
            <Radio.Group>
              <Radio value="low">低风险</Radio>
              <Radio value="medium">中风险</Radio>
              <Radio value="high">高风险</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="是否启用" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Config
