import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Space, Form, Select, Input,
  Modal, message, Popconfirm, Empty, Spin, Descriptions,
  InputNumber, Row, Col, Slider,
} from 'antd'
import {
  PlusOutlined, EyeOutlined, EditOutlined, PlayCircleOutlined,
  PauseCircleOutlined, HistoryOutlined, SearchOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { promptApi } from '@/api'
import type { Prompt, PromptStatus, PromptCategory, DRFPaginationResult } from '@/types/api'

const { TextArea } = Input

const statusMap: Record<PromptStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  enabled: { label: '启用', color: 'green' },
  disabled: { label: '停用', color: 'red' },
}

const Prompts: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Prompt[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filterForm] = Form.useForm()
  const [editModal, setEditModal] = useState(false)
  const [editType, setEditType] = useState<'create' | 'edit'>('create')
  const [editForm] = Form.useForm()
  const [editLoading, setEditLoading] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<Prompt | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)
  const [historyList, setHistoryList] = useState<Prompt[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [grayModalVisible, setGrayModalVisible] = useState(false)
  const [grayForm] = Form.useForm()
  const [grayLoading, setGrayLoading] = useState(false)
  const [currentPromptId, setCurrentPromptId] = useState<number | null>(null)
  const [categories, setCategories] = useState<PromptCategory[]>([])

  useEffect(() => {
    promptApi.getPromptCategories().then(res => {
      const data = (res as unknown as PromptCategory[]) || []
      setCategories(data)
    }).catch(() => {})
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
        status: values.status && values.status !== 'all' ? values.status : undefined,
        category: values.category || undefined,
        version: values.version || undefined,
        keyword: values.keyword || undefined,
      }
      const result = await promptApi.getPrompts(params) as unknown as DRFPaginationResult<Prompt>
      setData(result.results || [])
      setTotal(result.count || 0)
    } catch {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page])

  const handleSearch = () => { setPage(1); fetchData() }
  const handleReset = () => { filterForm.resetFields(); setPage(1); setTimeout(fetchData, 0) }

  const handleCreate = () => {
    setEditType('create')
    editForm.resetFields()
    setEditModal(true)
  }

  const handleEdit = async (record: Prompt) => {
    setEditType('edit')
    setCurrentPromptId(record.id)
    setEditLoading(true)
    try {
      const detail = await promptApi.getPrompt(record.id) as unknown as Prompt
      editForm.setFieldsValue({
        title: detail.title,
        description: detail.description,
        category: detail.category,
        content: detail.content,
        gray_scale_percent: detail.gray_scale_percent,
        target_sales_operations: detail.target_sales_operations,
      })
      setEditModal(true)
    } catch {
      message.error('获取详情失败')
    } finally {
      setEditLoading(false)
    }
  }

  const handleViewDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const detail = await promptApi.getPrompt(id) as unknown as Prompt
      setCurrentDetail(detail)
      setDetailModal(true)
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      setEditLoading(true)
      if (editType === 'create') {
        await promptApi.createPrompt(values)
        message.success('创建成功')
      } else if (currentPromptId) {
        await promptApi.updatePrompt(currentPromptId, values)
        message.success('更新成功')
      }
      setEditModal(false)
      fetchData()
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) return
      message.error('操作失败')
    } finally {
      setEditLoading(false)
    }
  }

  const handlePublish = (id: number) => {
    Modal.confirm({
      title: '发布提示词',
      content: '确定要发布此提示词吗？发布后将对指定分组生效。',
      onOk: async () => {
        try {
          await promptApi.publishPrompt(id)
          message.success('发布成功')
          fetchData()
        } catch {
          message.error('发布失败')
        }
      },
    })
  }

  const handleDisable = (id: number) => {
    Modal.confirm({
      title: '停用提示词',
      content: '确定要停用此提示词吗？',
      okType: 'danger',
      onOk: async () => {
        try {
          await promptApi.disablePrompt(id)
          message.success('停用成功')
          fetchData()
        } catch {
          message.error('停用失败')
        }
      },
    })
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
            fetchData()
          }
        } catch {
          message.error('回滚失败')
        }
      },
    })
  }

  const handleGrayConfig = (record: Prompt) => {
    setCurrentPromptId(record.id)
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
      if (currentPromptId) {
        await promptApi.updatePrompt(String(currentPromptId), values)
        message.success('灰度配置保存成功')
        setGrayModalVisible(false)
        fetchData()
      }
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) return
      message.error('保存失败')
    } finally {
      setGrayLoading(false)
    }
  }

  const columns: ColumnsType<Prompt> = [
    {
      title: '标题', dataIndex: 'title', key: 'title', width: 200,
      render: (text: string, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ color: '#999', fontSize: 12 }}>版本：{record.version}</div>
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: PromptStatus) => <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.label || status}</Tag>,
    },
    {
      title: '分类', dataIndex: 'category_name', key: 'category_name', width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '使用次数', dataIndex: 'usage_count', key: 'usage_count', width: 100,
      render: (count: number) => (count || 0).toLocaleString(),
    },
    {
      title: '准确率', dataIndex: 'accuracy_rate', key: 'accuracy_rate', width: 90,
      render: (val: number) => val != null ? `${val}%` : '-',
    },
    {
      title: '灰度百分比', dataIndex: 'gray_scale_percent', key: 'gray_scale_percent', width: 110,
      render: (val: number) => val != null ? `${val}%` : '-',
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作', key: 'action', width: 260, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>查看</Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          )}
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} style={{ color: '#52c41a' }} onClick={() => handlePublish(record.id)}>发布</Button>
          )}
          {record.status === 'enabled' && (
            <>
              <Button type="link" size="small" danger icon={<PauseCircleOutlined />} onClick={() => handleDisable(record.id)}>停用</Button>
              <Button type="link" size="small" onClick={() => handleGrayConfig(record)}>灰度</Button>
            </>
          )}
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(record.id)}>版本</Button>
        </Space>
      ),
    },
  ]

  const historyColumns: ColumnsType<Prompt> = [
    { title: '版本号', dataIndex: 'version', key: 'version', width: 120 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (status: PromptStatus) => <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.label || status}</Tag>,
    },
    {
      title: '当前版本', dataIndex: 'is_current_version', key: 'is_current_version', width: 80,
      render: (val: boolean) => val ? <Tag color="green">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '作者', dataIndex: 'author_name', key: 'author_name', width: 80,
      render: (text: string) => text || '-',
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
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>提示词版本管理</h2>

      <Card style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="inline" initialValues={{ status: 'all' }}>
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }}>
              <Select.Option value="all">全部</Select.Option>
              {Object.entries(statusMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select style={{ width: 120 }} placeholder="请选择" allowClear>
              {categories.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="version" label="版本号">
            <Input placeholder="输入版本号" style={{ width: 150 }} allowClear />
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="搜索标题" prefix={<SearchOutlined />} style={{ width: 200 }} allowClear onPressEnter={handleSearch} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch}>查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建提示词</Button>
      }>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          pagination={{
            current: page, pageSize, total, showSizeChanger: false, showQuickJumper: true,
            showTotal: t => `共 ${t} 条`, onChange: p => setPage(p),
          }}
          scroll={{ x: 1300 }}
          locale={{ emptyText: loading ? <Spin tip="加载中..." /> : <Empty description="暂无数据" /> }}
        />
      </Card>

      <Modal title={editType === 'create' ? '新建提示词' : '编辑提示词'} open={editModal}
        onOk={handleEditSubmit} onCancel={() => setEditModal(false)} confirmLoading={editLoading}
        width={720} okText="保存" cancelText="取消" destroyOnClose>
        <Form form={editForm} layout="vertical">
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
                    <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                  ))}
                </Select>
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
              <Form.Item name="target_sales_operations" label="适用分组">
                <Select mode="multiple" placeholder="请选择" allowClear>
                  <Select.Option value="华东组">华东组</Select.Option>
                  <Select.Option value="华北组">华北组</Select.Option>
                  <Select.Option value="华南组">华南组</Select.Option>
                  <Select.Option value="西南组">西南组</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="提示词内容" rules={[{ required: true, message: '请输入提示词内容' }]}>
            <TextArea rows={10} placeholder="请输入提示词内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="提示词详情" open={detailModal} onCancel={() => setDetailModal(false)} width={720}
        footer={[<Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>]}>
        <Spin spinning={detailLoading}>
          {currentDetail && (
            <div>
              <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="标题">{currentDetail.title}</Descriptions.Item>
                <Descriptions.Item label="版本号">{currentDetail.version}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[currentDetail.status]?.color}>{statusMap[currentDetail.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="分类">{currentDetail.category_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="使用次数">{(currentDetail.usage_count || 0).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="准确率">{currentDetail.accuracy_rate != null ? `${currentDetail.accuracy_rate}%` : '-'}</Descriptions.Item>
                <Descriptions.Item label="灰度百分比">{currentDetail.gray_scale_percent != null ? `${currentDetail.gray_scale_percent}%` : '-'}</Descriptions.Item>
                <Descriptions.Item label="作者">{currentDetail.author_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>{dayjs(currentDetail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              </Descriptions>
              {currentDetail.target_sales_operations && currentDetail.target_sales_operations.length > 0 && (
                <Card title="适用分组" size="small" style={{ marginBottom: 16 }}>
                  {currentDetail.target_sales_operations.map(g => <Tag key={g} color="blue">{g}</Tag>)}
                </Card>
              )}
              {currentDetail.content && (
                <Card title="提示词内容" size="small">
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>{currentDetail.content}</pre>
                </Card>
              )}
            </div>
          )}
        </Spin>
      </Modal>

      <Modal title="版本历史" open={historyModal} onCancel={() => setHistoryModal(false)} width={700}
        footer={[<Button key="close" onClick={() => setHistoryModal(false)}>关闭</Button>]}>
        <Table rowKey="id" columns={historyColumns} dataSource={historyList} loading={historyLoading}
          pagination={false} size="small" />
      </Modal>

      <Modal title="灰度配置" open={grayModalVisible} onOk={handleGraySubmit} onCancel={() => setGrayModalVisible(false)}
        confirmLoading={grayLoading} okText="保存" cancelText="取消" width={520} destroyOnClose>
        <Form form={grayForm} layout="vertical">
          <Form.Item label="灰度百分比" name="gray_scale_percent" rules={[{ required: true, message: '请设置灰度比例' }]}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Slider
                min={0} max={100} style={{ flex: 1 }}
                onChange={val => grayForm.setFieldsValue({ gray_scale_percent: val })}
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
            <Select mode="multiple" placeholder="请选择（不选表示全部分组）" allowClear style={{ width: '100%' }}>
              <Select.Option value="销售一组">销售一组</Select.Option>
              <Select.Option value="销售二组">销售二组</Select.Option>
              <Select.Option value="运营组">运营组</Select.Option>
            </Select>
          </Form.Item>
          <div style={{ fontSize: 12, color: '#999' }}>
            提示：灰度比例为 0% 时不生效；为 100% 时全部使用。
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default Prompts
