import { useState, useEffect } from 'react'
import {
  Tabs, Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  Switch, InputNumber, Slider, message, Popconfirm, Radio, Row, Col,
  Empty, Spin,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined, EditOutlined, PlayCircleOutlined,
  PauseCircleOutlined, DeleteOutlined, SettingOutlined, HistoryOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { promptApi, riskApi } from '@/api'
import type {
  Prompt, PromptStatus, PromptCategory, RiskRule, RiskLevel,
  DRFPaginationResult,
} from '@/types/api'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const promptStatusMap: Record<PromptStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  enabled: { label: '启用', color: 'green' },
  disabled: { label: '停用', color: 'red' },
}

const riskLevelMap: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: '低风险', color: 'blue' },
  medium: { label: '中风险', color: 'gold' },
  high: { label: '高风险', color: 'orange' },
  critical: { label: '严重', color: 'red' },
}

const ruleTypeMap: Record<string, string> = {
  keyword: '关键词', regex: '正则表达式', ai_detect: 'AI检测',
}

const SALES_OPERATION_GROUPS = [
  '华东组', '华北组', '华南组', '西南组',
  '销售一组', '销售二组', '销售三组',
  '运营组',
]

const Config: React.FC = () => {
  const [activeTab, setActiveTab] = useState('prompt')

  // ===== Prompt =====
  const [promptLoading, setPromptLoading] = useState(false)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptTotal, setPromptTotal] = useState(0)
  const [promptPage, setPromptPage] = useState(1)
  const [promptPageSize] = useState(10)
  const [promptStatus, setPromptStatus] = useState<PromptStatus | 'all'>('all')
  const [categories, setCategories] = useState<PromptCategory[]>([])

  const [promptModalVisible, setPromptModalVisible] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [promptForm] = Form.useForm()
  const [promptActionLoading, setPromptActionLoading] = useState(false)

  const [grayModalVisible, setGrayModalVisible] = useState(false)
  const [grayForm] = Form.useForm()
  const [grayLoading, setGrayLoading] = useState(false)
  const [grayPromptId, setGrayPromptId] = useState<number | null>(null)

  const [historyModal, setHistoryModal] = useState(false)
  const [historyList, setHistoryList] = useState<Prompt[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [currentPromptId, setCurrentPromptId] = useState<number | null>(null)

  // ===== Risk Rules =====
  const [ruleLoading, setRuleLoading] = useState(false)
  const [rules, setRules] = useState<RiskRule[]>([])
  const [ruleModalVisible, setRuleModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null)
  const [ruleForm] = Form.useForm()
  const [ruleActionLoading, setRuleActionLoading] = useState(false)

  // ===== Prompt =====
  const loadPrompts = async () => {
    setPromptLoading(true)
    try {
      const params: Record<string, unknown> = { page: promptPage, page_size: promptPageSize }
      if (promptStatus !== 'all') params.status = promptStatus
      const res = await promptApi.getPrompts(params) as unknown as DRFPaginationResult<Prompt>
      setPrompts(res.results || [])
      setPromptTotal(res.count || 0)
    } catch {
      message.error('加载提示词列表失败')
    } finally {
      setPromptLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await promptApi.getPromptCategories() as unknown as PromptCategory[]
      setCategories(Array.isArray(res) ? res : [])
    } catch { setCategories([]) }
  }

  useEffect(() => { loadPrompts() }, [promptPage, promptStatus]) // eslint-disable-line
  useEffect(() => { loadCategories() }, [])

  const filteredPrompts = prompts // backend already filtered

  const handleAddPrompt = () => {
    setEditingPrompt(null)
    promptForm.resetFields()
    promptForm.setFieldsValue({ status: 'draft', gray_scale_percent: 100 })
    setPromptModalVisible(true)
  }

  const handleEditPrompt = (record: Prompt) => {
    setEditingPrompt(record)
    promptForm.setFieldsValue({
      title: record.title,
      category: record.category,
      description: record.description,
      content: record.content,
      version: record.version,
      status: record.status,
      gray_scale_percent: record.gray_scale_percent ?? 100,
      target_sales_operations: record.target_sales_operations ?? [],
    })
    setPromptModalVisible(true)
  }

  const handlePromptSubmit = async () => {
    try {
      const values = await promptForm.validateFields()
      setPromptActionLoading(true)
      if (editingPrompt) {
        if (editingPrompt.status === 'draft') {
          await promptApi.updatePrompt(editingPrompt.id, values)
        } else {
          await promptApi.updatePrompt(editingPrompt.id, {
            gray_scale_percent: values.gray_scale_percent,
            target_sales_operations: values.target_sales_operations,
          })
        }
        message.success('更新成功')
      } else {
        await promptApi.createPrompt(values)
        message.success('创建成功')
      }
      setPromptModalVisible(false)
      loadPrompts()
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return
      message.error('操作失败')
    } finally {
      setPromptActionLoading(false)
    }
  }

  const handlePublishPrompt = (id: number) => {
    Modal.confirm({
      title: '发布提示词', content: '发布后将对指定分组生效，确定继续？',
      onOk: async () => {
        try {
          await promptApi.publishPrompt(String(id))
          message.success('发布成功')
          loadPrompts()
        } catch { message.error('发布失败') }
      },
    })
  }

  const handleDisablePrompt = (id: number) => {
    Modal.confirm({
      title: '停用提示词', content: '停用后AI将不再使用此提示词，确定继续？',
      okType: 'danger',
      onOk: async () => {
        try {
          await promptApi.disablePrompt(String(id))
          message.success('停用成功')
          loadPrompts()
        } catch { message.error('停用失败') }
      },
    })
  }

  const handleEnablePrompt = (id: number) => {
    Modal.confirm({
      title: '启用提示词', content: '确定要重新启用此提示词吗？',
      onOk: async () => {
        try {
          await promptApi.publishPrompt(String(id))
          message.success('启用成功')
          loadPrompts()
        } catch { message.error('启用失败') }
      },
    })
  }

  const handleGrayConfig = (record: Prompt) => {
    setGrayPromptId(record.id)
    grayForm.setFieldsValue({
      gray_scale_percent: record.gray_scale_percent ?? 100,
      target_sales_operations: record.target_sales_operations ?? [],
    })
    setGrayModalVisible(true)
  }

  const handleGraySubmit = async () => {
    try {
      const values = await grayForm.validateFields()
      setGrayLoading(true)
      if (grayPromptId) {
        await promptApi.updatePrompt(grayPromptId, {
          gray_scale_percent: values.gray_scale_percent,
          target_sales_operations: values.target_sales_operations,
        })
        message.success('灰度配置保存成功')
        setGrayModalVisible(false)
        loadPrompts()
      }
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return
      message.error('保存失败')
    } finally { setGrayLoading(false) }
  }

  const handleViewHistory = async (id: number) => {
    setCurrentPromptId(id)
    setHistoryLoading(true)
    try {
      const result = await promptApi.getPromptVersionHistory(id) as unknown as DRFPaginationResult<Prompt>
      setHistoryList(result.results || (result as unknown as Prompt[]))
      setHistoryModal(true)
    } catch {
      message.error('获取版本历史失败')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleRollback = (versionId: number) => {
    Modal.confirm({
      title: '版本回滚',
      content: '确定要回滚到此版本吗？回滚后将创建一个新版本草稿。',
      onOk: async () => {
        try {
          if (currentPromptId) {
            await promptApi.rollbackPrompt(currentPromptId, versionId)
            message.success('回滚成功')
            setHistoryModal(false)
            loadPrompts()
          }
        } catch {
          message.error('回滚失败')
        }
      },
    })
  }

  const promptColumns: ColumnsType<Prompt> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: '标题', dataIndex: 'title', key: 'title', width: 200,
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{t}</div>
          <div style={{ color: '#999', fontSize: 12 }}>版本：{r.version}</div>
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: PromptStatus) => (
        <Tag color={promptStatusMap[s]?.color || 'default'}>
          {promptStatusMap[s]?.label || s}
        </Tag>
      ),
    },
    {
      title: '分类', dataIndex: 'category_name', key: 'category_name', width: 100,
      render: t => t || '-',
    },
    { title: '使用次数', dataIndex: 'usage_count', key: 'usage_count', width: 100, render: n => (n || 0).toLocaleString() },
    { title: '准确率', dataIndex: 'accuracy_rate', key: 'accuracy_rate', width: 90, render: v => v != null ? `${v}%` : '-' },
    {
      title: '灰度百分比', dataIndex: 'gray_scale_percent', key: 'gray_scale_percent', width: 110,
      render: v => v != null ? `${v}%` : '-',
    },
    {
      title: '适用分组', dataIndex: 'target_sales_operations', key: 'target_sales_operations', width: 180,
      render: (groups: string[]) => (groups && groups.length > 0 ? groups.join('、') : '全部分组'),
    },
    {
      title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 170,
      render: t => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作', key: 'action', width: 340, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'draft' && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditPrompt(record)}>编辑</Button>
              <Button type="link" size="small" icon={<PlayCircleOutlined />} style={{ color: '#52c41a' }} onClick={() => handlePublishPrompt(record.id)}>发布</Button>
            </>
          )}
          {record.status === 'enabled' && (
            <>
              <Button type="link" size="small" danger icon={<PauseCircleOutlined />} onClick={() => handleDisablePrompt(record.id)}>停用</Button>
              <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleGrayConfig(record)}>灰度</Button>
            </>
          )}
          {record.status === 'disabled' && (
            <>
              <Button type="link" size="small" icon={<PlayCircleOutlined />} style={{ color: '#52c41a' }} onClick={() => handleEnablePrompt(record.id)}>启用</Button>
              <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleGrayConfig(record)}>灰度</Button>
            </>
          )}
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(record.id)}>版本</Button>
        </Space>
      ),
    },
  ]

  // ===== Risk Rules =====
  const loadRules = async () => {
    setRuleLoading(true)
    try {
      const res = await riskApi.getRiskRules() as unknown as RiskRule[]
      setRules(Array.isArray(res) ? res : [])
    } catch {
      message.error('加载风险规则失败')
    } finally { setRuleLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'risk') loadRules()
  }, [activeTab])

  const handleAddRule = () => {
    setEditingRule(null)
    ruleForm.resetFields()
    ruleForm.setFieldsValue({ rule_type: 'keyword', risk_level: 'medium', is_active: true })
    setRuleModalVisible(true)
  }

  const handleEditRule = (record: RiskRule) => {
    setEditingRule(record)
    ruleForm.setFieldsValue({
      name: record.name,
      rule_type: record.rule_type,
      pattern: record.pattern,
      risk_level: record.risk_level,
      is_active: record.is_active,
    })
    setRuleModalVisible(true)
  }

  const handleRuleSubmit = async () => {
    try {
      const values = await ruleForm.validateFields()
      setRuleActionLoading(true)
      if (editingRule) {
        await riskApi.updateRiskRule(String(editingRule.id), values)
        message.success('更新成功')
      } else {
        await riskApi.createRiskRule(values)
        message.success('创建成功')
      }
      setRuleModalVisible(false)
      loadRules()
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return
      message.error('操作失败')
    } finally { setRuleActionLoading(false) }
  }

  const handleToggleRule = async (record: RiskRule) => {
    try {
      await riskApi.toggleRiskRule(String(record.id))
      message.success(record.is_active ? '已停用' : '已启用')
      loadRules()
    } catch { message.error('操作失败') }
  }

  const handleDeleteRule = (id: number) => {
    Modal.confirm({
      title: '删除规则', content: '确定要删除此规则吗？删除后不可恢复。',
      okType: 'danger',
      onOk: async () => {
        try {
          await riskApi.deleteRiskRule(String(id))
          message.success('删除成功')
          loadRules()
        } catch { message.error('删除失败') }
      },
    })
  }

  const ruleColumns: ColumnsType<RiskRule> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    {
      title: '规则类型', dataIndex: 'rule_type', key: 'rule_type', width: 120,
      render: t => ruleTypeMap[t] || t,
    },
    { title: '匹配模式', dataIndex: 'pattern', key: 'pattern', ellipsis: true },
    {
      title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', width: 110,
      render: (l: RiskLevel) => (
        <Tag color={riskLevelMap[l]?.color || 'default'}>
          {riskLevelMap[l]?.label || l}
        </Tag>
      ),
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 100,
      render: active => <Tag color={active ? 'success' : 'default'}>{active ? '已启用' : '已停用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleToggleRule(record)}>
            {record.is_active ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRule(record)}>编辑</Button>
          <Popconfirm
            title="确定删除该规则？" onConfirm={() => handleDeleteRule(record.id)}
            okText="确认" cancelText="取消" okType="danger"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>配置管理</h2>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="提示词配置" key="prompt">
          <Card
            style={{ borderRadius: 8 }}
            extra={
              <Space>
                <Radio.Group value={promptStatus} onChange={e => setPromptStatus(e.target.value)}>
                  <Radio.Button value="all">全部</Radio.Button>
                  <Radio.Button value="enabled">启用</Radio.Button>
                  <Radio.Button value="disabled">停用</Radio.Button>
                  <Radio.Button value="draft">草稿</Radio.Button>
                </Radio.Group>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPrompt}>
                  新建提示词
                </Button>
              </Space>
            }
          >
            <Table
              rowKey="id" columns={promptColumns}
              dataSource={filteredPrompts}
              loading={promptLoading}
              pagination={{
                current: promptPage, pageSize: promptPageSize, total: promptTotal,
                showSizeChanger: false, showQuickJumper: true,
                showTotal: t => `共 ${t} 条`, onChange: p => setPromptPage(p),
              }}
              scroll={{ x: 1400 }}
              locale={{ emptyText: promptLoading ? <Spin tip="加载中..." /> : <Empty description="暂无数据" /> }}
            />
          </Card>
        </TabPane>

        <TabPane tab="风险规则配置" key="risk">
          <Card
            style={{ borderRadius: 8 }}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>新增规则</Button>}
          >
            <Table
              rowKey="id" columns={ruleColumns} dataSource={rules} loading={ruleLoading}
              pagination={{ pageSize: 10, showSizeChanger: false, showQuickJumper: true, showTotal: t => `共 ${t} 条` }}
              scroll={{ x: 1000 }}
              locale={{ emptyText: ruleLoading ? <Spin tip="加载中..." /> : <Empty description="暂无规则" /> }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Prompt Modal */}
      <Modal
        title={editingPrompt ? '编辑提示词' : '新建提示词'}
        open={promptModalVisible} onOk={handlePromptSubmit}
        onCancel={() => setPromptModalVisible(false)} confirmLoading={promptActionLoading}
        width={720} okText="保存" cancelText="取消" destroyOnClose
      >
        <Form form={promptForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="请输入提示词标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select placeholder="请选择分类">
                  {categories.map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="version" label="版本号" rules={[{ required: true, message: '请输入版本号' }]}>
                <Input placeholder="例如：v1.0.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Radio.Group>
                  <Radio value="draft">草稿</Radio>
                  <Radio value="enabled">启用</Radio>
                  <Radio value="disabled">停用</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input placeholder="请输入描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gray_scale_percent" label="灰度百分比">
                <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="%" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="target_sales_operations" label="适用销售运营分组">
                <Select mode="multiple" placeholder="不选表示全部分组" allowClear optionFilterProp="label">
                  {SALES_OPERATION_GROUPS.map(g => (
                    <Option key={g} value={g} label={g}>{g}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="提示词内容" rules={[{ required: true, message: '请输入提示词内容' }]}>
            <TextArea rows={8} placeholder="请输入提示词内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Gray Modal */}
      <Modal
        title="灰度配置" open={grayModalVisible} onOk={handleGraySubmit}
        onCancel={() => setGrayModalVisible(false)} confirmLoading={grayLoading}
        width={520} okText="保存" cancelText="取消" destroyOnClose
      >
        <Form form={grayForm} layout="vertical">
          <Form.Item label="灰度百分比" name="gray_scale_percent" rules={[{ required: true }]}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Slider
                min={0} max={100} style={{ flex: 1 }}
                onChange={(val: number) => grayForm.setFieldsValue({ gray_scale_percent: val })}
              />
              <InputNumber
                min={0} max={100} style={{ width: 90 }} suffix="%"
                onChange={val => {
                  const n = Number(val)
                  if (!isNaN(n)) grayForm.setFieldsValue({ gray_scale_percent: Math.max(0, Math.min(100, n)) })
                }}
              />
            </div>
          </Form.Item>
          <Form.Item label="适用销售运营分组" name="target_sales_operations">
            <Select mode="multiple" placeholder="不选表示全部分组" allowClear style={{ width: '100%' }} optionFilterProp="label">
              {SALES_OPERATION_GROUPS.map(g => (
                <Option key={g} value={g} label={g}>{g}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ fontSize: 12, color: '#999' }}>
            提示：灰度比例为 0% 时不生效，为 100% 时全部流量使用。
          </div>
        </Form>
      </Modal>

      {/* History Modal */}
      <Modal title="版本历史" open={historyModal} onCancel={() => setHistoryModal(false)} width={700}
        footer={[<Button key="close" onClick={() => setHistoryModal(false)}>关闭</Button>]} destroyOnClose>
        <Table
          rowKey="id"
          columns={[
            { title: '版本号', dataIndex: 'version', key: 'version', width: 140 },
            {
              title: '状态', dataIndex: 'status', key: 'status', width: 90,
              render: (s: PromptStatus) => (
                <Tag color={promptStatusMap[s]?.color || 'default'}>{promptStatusMap[s]?.label || s}</Tag>
              ),
            },
            {
              title: '当前版本', dataIndex: 'is_current_version', key: 'is_current_version', width: 90,
              render: (v: boolean) => v ? <Tag color="green">是</Tag> : <Tag>否</Tag>,
            },
            {
              title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170,
              render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
            },
            {
              title: '作者', dataIndex: 'author_name', key: 'author_name', width: 90,
              render: (t: string) => t || '-',
            },
            {
              title: '操作', key: 'action', width: 100,
              render: (_, record) => (
                <Popconfirm
                  title="确认回滚？" description="回滚到此版本将创建一个新版本"
                  onConfirm={() => handleRollback(record.id)} okText="确认" cancelText="取消"
                >
                  <Button type="link" size="small" icon={<RollbackOutlined />}>回滚</Button>
                </Popconfirm>
              ),
            },
          ]}
          dataSource={historyList}
          loading={historyLoading}
          pagination={false}
          size="small"
        />
      </Modal>

      {/* Rule Modal */}
      <Modal
        title={editingRule ? '编辑风险规则' : '新增风险规则'}
        open={ruleModalVisible} onOk={handleRuleSubmit}
        onCancel={() => setRuleModalVisible(false)} confirmLoading={ruleActionLoading}
        width={520} okText="保存" cancelText="取消" destroyOnClose
      >
        <Form form={ruleForm} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="rule_type" label="规则类型">
            <Radio.Group>
              <Radio value="keyword">关键词</Radio>
              <Radio value="regex">正则表达式</Radio>
              <Radio value="ai_detect">AI检测</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="pattern" label="匹配内容" rules={[{ required: true, message: '请输入匹配内容' }]}>
            <TextArea rows={4} placeholder="关键词用逗号分隔，或输入正则表达式" />
          </Form.Item>
          <Form.Item name="risk_level" label="风险等级">
            <Radio.Group>
              <Radio value="low">低风险</Radio>
              <Radio value="medium">中风险</Radio>
              <Radio value="high">高风险</Radio>
              <Radio value="critical">严重</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="is_active" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Config
